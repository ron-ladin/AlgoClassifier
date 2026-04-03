import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

const DashboardLayout = ({ sidebar, children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="w-full max-w-sm border-r border-gray-800 bg-gray-950/70 p-4 md:p-6">{sidebar}</aside>
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
