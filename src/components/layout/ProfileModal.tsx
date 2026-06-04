import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user } = useAuth();
  
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      setNome(user.user_metadata?.nome || '');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(null);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password && password.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Atualiza o nome se foi alterado
      if (nome && nome !== user?.user_metadata?.nome) {
        // Atualiza no Auth
        const { error: authError } = await supabase.auth.updateUser({
          data: { nome }
        });
        if (authError) throw authError;

        // Atualiza na tabela profiles
        if (user?.id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ nome })
            .eq('id', user.id);
          
          if (profileError) throw profileError;
        }
      }

      // Atualiza a senha se foi preenchida
      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password
        });
        if (passwordError) throw passwordError;
      }

      setSuccess('Dados atualizados com sucesso!');
      
      // Fecha o modal após 2 segundos em caso de sucesso
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao atualizar os dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-950 text-slate-100 border-slate-800">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
          <DialogDescription className="text-slate-400">
            Atualize suas informações pessoais e senha de acesso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 text-sm bg-red-900/30 border border-red-900/50 text-red-400 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm bg-emerald-900/30 border border-emerald-900/50 text-emerald-400 rounded-md">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input 
              id="nome" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome" 
              className="bg-slate-900 border-slate-800"
              required
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/50">
            <Label htmlFor="password" className="text-slate-300">Nova Senha</Label>
            <Input 
              id="password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco para não alterar" 
              className="bg-slate-900 border-slate-800"
            />
          </div>

          {password && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha" 
                className="bg-slate-900 border-slate-800"
                required
              />
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="hover:bg-slate-800 text-slate-300">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
