import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { NumericFormat } from 'react-number-format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/types/database';

type PessoalRow = Database['public']['Tables']['pessoal']['Row'];

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cargo: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')).transform(v => v === '' ? null : v),
  telefone: z.string().optional().nullable(),
  documento: z.string().optional().nullable(),
  salario: z.number().optional().nullable(),
  data_admissao: z.string().optional().nullable(),
  data_demissao: z.string().optional().nullable(),
  status: z.string().default('ativo'),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

type FormData = z.input<typeof schema>;

interface PessoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario?: PessoalRow | null;
  onSubmit: (data: any) => Promise<void>;
}

export function PessoalForm({ open, onOpenChange, funcionario, onSubmit }: PessoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nome: '',
      cargo: '',
      email: '',
      telefone: '',
      documento: '',
      salario: null,
      data_admissao: '',
      data_demissao: '',
      status: 'ativo',
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

  const isAtivo = watch('status') === 'ativo';

  useEffect(() => {
    if (open) {
      if (funcionario) {
        reset({
          nome: funcionario.nome,
          cargo: funcionario.cargo || '',
          email: funcionario.email || '',
          telefone: funcionario.telefone || '',
          documento: funcionario.documento || '',
          salario: funcionario.salario,
          data_admissao: funcionario.data_admissao || '',
          data_demissao: funcionario.data_demissao || '',
          status: funcionario.status || 'ativo',
          cep: funcionario.cep || '',
          logradouro: funcionario.logradouro || '',
          numero: funcionario.numero || '',
          complemento: funcionario.complemento || '',
          bairro: funcionario.bairro || '',
          cidade: funcionario.cidade || '',
          estado: funcionario.estado || '',
          observacoes: funcionario.observacoes || '',
        });
      } else {
        reset({
          nome: '',
          cargo: '',
          email: '',
          telefone: '',
          documento: '',
          salario: null,
          data_admissao: '',
          data_demissao: '',
          status: 'ativo',
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
  }, [open, funcionario, reset]);

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

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      // Garante que se for ativo, zera a data de demissão
      if (data.status === 'ativo') {
        data.data_demissao = null;
      }
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
          <DialogTitle>{funcionario ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Cadastre membros da equipe e professores contratados. Estes dados são estritamente confidenciais.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input id="nome" {...register('nome')} placeholder="Ex: Ana Silva" className="bg-slate-900 border-slate-800" />
              {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" {...register('cargo')} placeholder="Ex: Recepcionista" className="bg-slate-900 border-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} placeholder="Ex: ana@email.com" className="bg-slate-900 border-slate-800" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register('telefone')} placeholder="Ex: (11) 99999-9999" className="bg-slate-900 border-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documento">Documento (CPF/RG)</Label>
              <Input id="documento" {...register('documento')} placeholder="000.000.000-00" className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salario">Salário Base (R$) - Confidencial</Label>
              <Controller
                name="salario"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <NumericFormat
                    customInput={Input}
                    className="bg-slate-900 border-slate-800 text-emerald-400 font-medium"
                    placeholder="R$ 0,00"
                    value={value === null ? '' : value}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    onValueChange={(values) => {
                      onChange(values.floatValue ?? null);
                    }}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="data_admissao">Data de Admissão</Label>
              <Input id="data_admissao" type="date" {...register('data_admissao')} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                {...register('status')}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Desligado / Inativo</option>
              </select>
            </div>
          </div>

          {!isAtivo && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Label htmlFor="data_demissao" className="text-red-400">Data de Desligamento</Label>
              <Input id="data_demissao" type="date" {...register('data_demissao')} className="bg-slate-900 border-slate-800 border-red-900/50" />
            </div>
          )}

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
            <Label htmlFor="observacoes">Observações Internas</Label>
            <Textarea id="observacoes" {...register('observacoes')} placeholder="Notas adicionais e histórico" className="resize-none bg-slate-900 border-slate-800" />
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
