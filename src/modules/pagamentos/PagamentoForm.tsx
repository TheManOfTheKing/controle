import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { useProfessores } from '@/hooks/useProfessores';
import { useAulas } from '@/hooks/useAulas';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type PagamentoRow = Database['public']['Tables']['pagamentos']['Row'];

// Componente de input de moeda BRL sem dependência externa
function CurrencyInput({ value, onChange, className, placeholder }: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const format = (n: number) =>
    n ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) : '';
  const [display, setDisplay] = useState(() => format(value));

  useEffect(() => { setDisplay(format(value)); }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const numeric = raw ? parseFloat(raw) / 100 : 0;
    setDisplay(raw ? format(numeric) : '');
    onChange(numeric);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">R$</span>
      <input
        className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm pl-9 ${className ?? ''}`}
        placeholder={placeholder ?? '0,00'}
        value={display}
        onChange={handleChange}
        inputMode="numeric"
      />
    </div>
  );
}

const schema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  professor_id: z.string().optional().nullable().transform(v => v === '' ? null : v),
  aula_id: z.string().optional().nullable().transform(v => v === '' ? null : v),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  data_vencimento: z.string().min(1, 'Vencimento é obrigatório'),
  metodo: z.string().optional().nullable().transform(v => v === '' ? null : v),
  observacoes: z.string().optional().nullable(),
});

type FormData = z.input<typeof schema>;

interface PagamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamento?: PagamentoRow | null;
  onSubmit: (data: any) => Promise<void>;
}

export function PagamentoForm({ open, onOpenChange, pagamento, onSubmit }: PagamentoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { professores } = useProfessores();
  const { aulas } = useAulas();
  
  const professoresAtivos = professores.filter(p => p.ativo);

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      descricao: '',
      professor_id: '',
      aula_id: '',
      valor: 0,
      data_vencimento: '',
      metodo: '',
      observacoes: '',
    }
  });

  const watchProfessorId = watch('professor_id');

  // Filtra as aulas do professor selecionado (ou todas se nenhum for selecionado, mas o melhor é só mostrar se selecionar professor)
  const aulasFiltradas = watchProfessorId 
    ? aulas.filter(a => a.professor_id === watchProfessorId)
    : [];

  useEffect(() => {
    // Se mudar o professor, limpa a aula se ela não pertencer ao novo professor
    const aulaAtual = aulas.find(a => a.id === watch('aula_id'));
    if (aulaAtual && watchProfessorId && aulaAtual.professor_id !== watchProfessorId) {
      setValue('aula_id', '');
    }
  }, [watchProfessorId, aulas, setValue, watch]);

  useEffect(() => {
    if (open) {
      if (pagamento) {
        reset({
          descricao: pagamento.descricao,
          professor_id: pagamento.professor_id || '',
          aula_id: pagamento.aula_id || '',
          valor: pagamento.valor,
          data_vencimento: pagamento.data_vencimento,
          metodo: pagamento.metodo || '',
          observacoes: pagamento.observacoes || '',
        });
      } else {
        reset({
          descricao: '',
          professor_id: '',
          aula_id: '',
          valor: 0,
          data_vencimento: '',
          metodo: '',
          observacoes: '',
        });
      }
    }
  }, [open, pagamento, reset]);

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast.success(pagamento ? 'Pagamento atualizado com sucesso!' : 'Pagamento cadastrado com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 text-slate-100 border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pagamento ? 'Editar Pagamento' : 'Novo Pagamento'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Preencha os dados financeiros. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" {...register('descricao')} placeholder="Ex: Mensalidade, Aulão..." className="bg-slate-900 border-slate-800" />
            {errors.descricao && <p className="text-sm text-red-500">{errors.descricao.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="professor_id">Professor</Label>
              <select 
                id="professor_id" 
                {...register('professor_id')}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
              >
                <option value="">Nenhum / Geral</option>
                {professoresAtivos.map(prof => (
                  <option key={prof.id} value={prof.id}>{prof.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="aula_id">Aula Relacionada</Label>
              <select 
                id="aula_id" 
                {...register('aula_id')}
                disabled={!watchProfessorId || aulasFiltradas.length === 0}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
              >
                <option value="">Nenhuma</option>
                {aulasFiltradas.map(aula => (
                  <option key={aula.id} value={aula.id}>{aula.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Controller
                name="valor"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CurrencyInput
                    className="bg-slate-900 border-slate-800"
                    value={value ?? 0}
                    onChange={onChange}
                  />
                )}
              />
              {errors.valor && <p className="text-sm text-red-500">{errors.valor.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data Vencimento *</Label>
              <Input id="data_vencimento" type="date" {...register('data_vencimento')} className="bg-slate-900 border-slate-800" />
              {errors.data_vencimento && <p className="text-sm text-red-500">{errors.data_vencimento.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo">Método de Pagamento</Label>
            <select 
              id="metodo" 
              {...register('metodo')}
              className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            >
              <option value="">Não definido</option>
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="outro">Outro</option>
            </select>
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
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
