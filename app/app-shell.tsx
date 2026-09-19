import type { ReactNode } from "react";
import { DesktopBrandBar } from "@/app/app-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DesktopBrandBar />
      {children}
    </div>
  );
}
