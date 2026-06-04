import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/types/database';

type Professor = Database['public']['Tables']['professores']['Row'];

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional().transform(v => v === '' ? null : v),
  telefone: z.string().optional().nullable(),
  especialidade: z.string().optional().nullable(),
  documento: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface ProfessorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professor?: Professor | null;
  onSubmit: (data: any) => Promise<void>;
}

export function ProfessorForm({ open, onOpenChange, professor, onSubmit }: ProfessorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      especialidade: '',
      documento: '',
      endereco: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      observacoes: '',
    }
  });

  useEffect(() => {
    if (open) {
      if (professor) {
        reset({
          nome: professor.nome,
          email: professor.email || '',
          telefone: professor.telefone || '',
          especialidade: professor.especialidade || '',
          documento: professor.documento || '',
          endereco: professor.endereco || '',
          cep: professor.cep || '',
          logradouro: professor.logradouro || '',
          numero: professor.numero || '',
          complemento: professor.complemento || '',
          bairro: professor.bairro || '',
          cidade: professor.cidade || '',
          estado: professor.estado || '',
          observacoes: professor.observacoes || '',
        });
      } else {
        reset({
          nome: '',
          email: '',
          telefone: '',
          especialidade: '',
          documento: '',
          endereco: '',
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          observacoes: '',
        });
      }
    }
  }, [open, professor, reset]);

  const cepValue = watch('cep');

  useEffect(() => {
    if (cepValue && cepValue.replace(/\D/g, '').length === 8) {
      const fetchAddress = async () => {
        try {
          const cleanCep = cepValue.replace(/\D/g, '');
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await res.json();
          if (!data.erro) {
            setValue('logradouro', data.logradouro || '', { shouldValidate: true });
            setValue('bairro', data.bairro || '', { shouldValidate: true });
            setValue('cidade', data.localidade || '', { shouldValidate: true });
            setValue('estado', data.uf || '', { shouldValidate: true });
          }
        } catch (err) {
          console.error("Erro ao buscar CEP", err);
        }
      };
      fetchAddress();
    }
  }, [cepValue, setValue]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 text-slate-100 border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{professor ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Preencha os dados do professor abaixo. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register('nome')} placeholder="Ex: João da Silva" className="bg-slate-900 border-slate-800" />
            {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} placeholder="Ex: joao@email.com" className="bg-slate-900 border-slate-800" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register('telefone')} placeholder="Ex: (11) 99999-9999" className="bg-slate-900 border-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input id="especialidade" {...register('especialidade')} placeholder="Ex: Matemática" className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">Documento (CPF)</Label>
              <Input id="documento" {...register('documento')} placeholder="000.000.000-00" className="bg-slate-900 border-slate-800" />
            </div>
          </div>

          <div className="space-y-4 border border-slate-800 rounded-md p-4 bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-300">Endereço</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" {...register('cep')} placeholder="00000-000" className="bg-slate-950 border-slate-800" maxLength={9} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" {...register('logradouro')} placeholder="Rua, Avenida..." className="bg-slate-950 border-slate-800" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" {...register('numero')} placeholder="123" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" {...register('complemento')} placeholder="Apto, Sala, Bloco..." className="bg-slate-950 border-slate-800" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" {...register('bairro')} placeholder="Bairro" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" {...register('cidade')} placeholder="Cidade" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input id="estado" {...register('estado')} placeholder="UF" className="bg-slate-950 border-slate-800" maxLength={2} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register('observacoes')} placeholder="Notas adicionais" className="resize-none bg-slate-900 border-slate-800" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="hover:bg-slate-800 text-slate-300">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
