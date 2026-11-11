import { SettingsForm } from "@/components/SettingsForm";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/app/login/actions";
import { getSettings } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AjustesPage() {
  const supabase = await createClient();
  const settings = await getSettings(supabase);

  return (
    <>
      <h1 className="mb-3 text-xl font-semibold">Ajustes</h1>
      <SettingsForm settings={settings} />
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="secondary" className="w-full">
          Cerrar sesión
        </Button>
      </form>
    </>
  );
}
