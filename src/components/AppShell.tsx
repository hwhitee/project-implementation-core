import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export const AppShell = ({
  children,
  title,
  back = false,
  hideNav = false,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
  hideNav?: boolean;
}) => (
  <div className="min-h-[100dvh] flex flex-col bg-background">
    <TopBar title={title} back={back} />
    <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-28 animate-fade-up">
      {children}
    </main>
    {!hideNav && <BottomNav />}
  </div>
);
