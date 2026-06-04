import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { Calendar, CreditCard, Users, Lock, LogOut, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen, setMobileOpen }: SidebarProps) {
  const { role, signOut } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Aulas', to: '/aulas', icon: Calendar },
    { name: 'Pagamentos', to: '/pagamentos', icon: CreditCard },
    { name: 'Professores', to: '/professores', icon: Users },
  ];

  if (role === 'admin') {
    navItems.push({ name: 'Pessoal', to: '/pessoal', icon: Lock });
  }

  const baseClasses = "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static";
  const mobileClasses = isMobileOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <aside className={cn(baseClasses, mobileClasses)}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold text-slate-100">Controle</span>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 lg:hidden shrink-0">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>

        {/* Footer with "Desenvolvido por AndreSD" */}
        <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 mt-auto shrink-0">
          Desenvolvido por <a href="https://wa.me/5512982176890" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">AndreSD</a>
        </div>
      </aside>
    </>
  );
}
