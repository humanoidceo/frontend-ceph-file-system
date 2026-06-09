import type { ReactNode } from 'react';
import { Header } from '../../pages/Header';
import { Sidebar, type SidebarItem } from './Sidebar';
import type { CurrentUser } from '../../types/auth';

interface AppShellProps {
  user: CurrentUser;
  isLoggingOut: boolean;
  navItems: SidebarItem[];
  activeModule: string;
  onModuleChange: (module: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

export function AppShell({
  user,
  isLoggingOut,
  navItems,
  activeModule,
  onModuleChange,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <>
      <Header user={user} isLoggingOut={isLoggingOut} onLogout={onLogout} />
      <div className="dashboard-layout">
        <Sidebar items={navItems} activeItem={activeModule} onChange={onModuleChange} />
        <main className="app-main">
          <div className="app-shell">{children}</div>
        </main>
      </div>
    </>
  );
}
