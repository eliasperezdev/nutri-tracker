import { mealJsonSchema, ParsedMealSchema, type ParsedMeal } from "./schema";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const TIMEOUT_MS = 25_000;

export type LlmErrorCode =
  | "config"
  | "auth"
  | "credits"
  | "rate_limit"
  | "timeout"
  | "upstream"
  | "invalid_output";

const USER_MESSAGES: Record<LlmErrorCode, string> = {
  config: "El servicio de IA no está configurado.",
  auth: "La clave de OpenRouter no es válida.",
  credits: "OpenRouter no tiene crédito disponible.",
  rate_limit: "Demasiadas solicitudes. Probá de nuevo en unos segundos.",
  timeout: "La IA tardó demasiado. Probá de nuevo.",
  upstream: "No pude interpretar la comida. Probá de nuevo o cargala a mano.",
  invalid_output: "No pude interpretar la comida. Probá de nuevo o cargala a mano.",
};

export class LlmError extends Error {
  constructor(
    public readonly code: LlmErrorCode,
    detail?: string,
    public readonly status?: number,
  ) {
    super(detail ?? code);
    this.name = "LlmError";
  }
  get userMessage(): string {
    return USER_MESSAGES[this.code];
  }
}

type ChatMessage = { role: "system" | "user"; content: string };

async function chat(messages: ChatMessage[], strict: boolean): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new LlmError("config", "Falta OPENROUTER_API_KEY");

  const body: Record<string, unknown> = {
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    messages,
    temperature: 0, // consistencia: mismo input → mismos valores
    max_tokens: 1500,
  };
  if (strict) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: "meal_estimate", strict: true, schema: mealJsonSchema },
    };
    // Solo rutea a proveedores que soportan response_format; si no hay, falla
    // y se activa el fallback a JSON "puro".
    body.provider = { require_parameters: true };
  }

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "nutri-tracker",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new LlmError("timeout", "Timeout llamando a OpenRouter");
    }
    throw new LlmError("upstream", "Error de red llamando a OpenRouter");
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new LlmError("auth", undefined, res.status);
    if (res.status === 402) throw new LlmError("credits", undefined, res.status);
    if (res.status === 429) throw new LlmError("rate_limit", undefined, res.status);
    throw new LlmError("upstream", `HTTP ${res.status}`, res.status);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new LlmError("invalid_output", "Respuesta HTTP no es JSON");
  }
  const content = (json as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new LlmError("invalid_output", "Respuesta vacía del modelo");
  }
  return content;
}

/** Extrae un objeto JSON aunque venga con ```json ... ``` o texto alrededor. */
function extractJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    // seguir
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      // seguir
    }
  }
  throw new LlmError("invalid_output", "El modelo no devolvió JSON válido");
}

function parseMealContent(content: string): ParsedMeal {
  const result = ParsedMealSchema.safeParse(extractJson(content));
  if (!result.success) {
    throw new LlmError("invalid_output", "El JSON no cumple el esquema esperado");
  }
  return result.data;
}

// Errores que no tiene sentido reintentar sin response_format.
const NO_FALLBACK: LlmErrorCode[] = ["config", "auth", "credits", "rate_limit", "timeout"];

/**
 * 1) Intenta con JSON schema estricto.
 * 2) Si el modelo/proveedor no lo soporta o la salida es inválida,
 *    reintenta pidiendo JSON puro y lo parsea con try/catch.
 */
export async function estimateMeal(system: string, user: string): Promise<ParsedMeal> {
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  try {
    return parseMealContent(await chat(messages, true));
  } catch (e) {
    if (e instanceof LlmError && NO_FALLBACK.includes(e.code)) throw e;
  }
  return parseMealContent(await chat(messages, false));
}
