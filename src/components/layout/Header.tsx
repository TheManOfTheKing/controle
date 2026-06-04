import React from 'react';
import { useAuth } from '@/auth/useAuth';
import { Menu, LogOut, ShieldAlert, ShieldCheck, User as UserIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProfileModal } from './ProfileModal';
import { useState } from 'react';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export function Header({ setMobileOpen }: HeaderProps) {
  const { user, role, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const userName = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário';

  const roleConfig = {
    admin: { color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', icon: ShieldAlert, label: 'Admin' },
    editor: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: ShieldCheck, label: 'Editor' },
    viewer: { color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', icon: UserIcon, label: 'Viewer' },
  };

  const currentRole = role ? roleConfig[role as keyof typeof roleConfig] : roleConfig.viewer;
  const RoleIcon = currentRole.icon;

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden text-slate-400 hover:text-slate-200"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden lg:flex items-center gap-2">
          {/* Logo or secondary branding could go here */}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-slate-200">{userName}</span>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider mt-1",
            currentRole.color
          )}>
            <RoleIcon className="w-3 h-3" />
            {currentRole.label}
          </div>
        </div>

        <div className="h-8 w-px bg-slate-800 mx-2 hidden sm:block"></div>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsProfileOpen(true)}
          className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 hidden sm:flex px-2"
          title="Meu Perfil"
        >
          <Settings className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => signOut()}
          className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 hidden sm:flex px-2"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <ProfileModal open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </header>
  );
}
