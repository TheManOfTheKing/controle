import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useMounted } from '@/hooks/use-mounted';
import type { User } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [allowedScreens, setAllowedScreens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useMounted();
  const location = useLocation();

  useEffect(() => {
    // PASSO 1: Configurar o listener ANTES de buscar a sessão atual.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // PASSO 2: Atualizar estado de forma SÍNCRONA dentro do callback.
        if (isMountedRef.current) {
          setUser(session?.user ?? null);
        }

        // PASSO 3: Operações assíncronas usam queueMicrotask.
        if (session?.user) {
          queueMicrotask(() => {
            checkUserRole(session.user.id);
          });
        } else {
          if (isMountedRef.current) {
            setIsAdmin(false);
            setIsSuspended(false);
            setLoading(false);
          }
        }
      }
    );

    // PASSO 4: Buscar sessão existente.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMountedRef.current) {
        setUser(user ?? null);
        if (!user) {
          setLoading(false);
        }
      }
    });

    // PASSO 5: Cleanup.
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, ativo, telas_acesso')
        .eq('id', userId)
        .single();

      if (isMountedRef.current) {
        if (!error && data) {
          setIsAdmin(data.role === 'admin');
          setIsSuspended(!data.ativo);
          setAllowedScreens(data.telas_acesso || []);
        }
        setLoading(false);
      }
    } catch {
      if (isMountedRef.current) setLoading(false);
    }
  }

  // PASSO 6: Mostrar loading enquanto verifica autenticação.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // PASSO 7: Redirecionar usuários inativos.
  if (isSuspended) {
    return <Navigate to="/login?error=suspended" replace />;
  }

  // PASSO 8: Redirecionar não-autenticados.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // PASSO 9: Redirecionar não-admins tentando acessar rotas admin.
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // PASSO 10: Bloquear acesso baseado nas telas permitidas.
  // Ignora bloqueio para admin (Admin tem acesso a tudo) ou se a rota for a raiz '/'.
  if (!isAdmin && location.pathname !== '/') {
    // Extrai o nome da tela da rota (ex: "/professores" -> "professores")
    const currentScreen = location.pathname.split('/')[1];
    
    // Lista de rotas válidas que requerem verificação no array de permissões
    const restrictedScreens = ['dashboard', 'aulas', 'pagamentos', 'professores', 'pessoal', 'usuarios', 'backup'];
    
    if (restrictedScreens.includes(currentScreen) && !allowedScreens.includes(currentScreen)) {
      if (allowedScreens.length > 0) {
        return <Navigate to={`/${allowedScreens[0]}`} replace />;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Restrito</h1>
          <p className="text-slate-400 mb-6 text-center">
            Seu perfil não possui acesso a esta tela, e você não possui nenhuma outra tela liberada.<br/>
            Contate o administrador ou faça login novamente se houver um erro de conexão.
          </p>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Sair e Voltar ao Login
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
}
