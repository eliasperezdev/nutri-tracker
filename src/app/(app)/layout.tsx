import { BottomNav } from "@/components/nav/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <main className="px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
