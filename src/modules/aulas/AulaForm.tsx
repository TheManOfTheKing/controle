import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/types/database';
import { useProfessores } from '@/hooks/useProfessores';

type AulaRow = Database['public']['Tables']['aulas']['Row'];

const schema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  professor_id: z.string().uuid('Professor é obrigatório'),
  data_hora: z.string().min(1, 'Data e Hora são obrigatórias'),
  duracao_minutos: z.coerce.number().min(1, 'Duração deve ser maior que 0'),
  link_transmissao: z.string().optional().nullable(),
  status: z.enum(['agendada', 'realizada', 'cancelada']).default('agendada'),
  gravacao_url: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface AulaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aula?: AulaRow | null;
  onSubmit: (data: any) => Promise<void>;
}

export function AulaForm({ open, onOpenChange, aula, onSubmit }: AulaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { professores } = useProfessores();
  
  // Filtramos apenas professores ativos para o formulário
  const professoresAtivos = professores.filter(p => p.ativo);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      titulo: '',
      professor_id: '',
      data_hora: '',
      duracao_minutos: 60,
      link_transmissao: '',
      status: 'agendada',
      gravacao_url: '',
      observacoes: '',
    }
  });

  const watchStatus = watch('status');

  useEffect(() => {
    if (open) {
      if (aula) {
        // Converte do UTC salvo no banco para o fuso local do usuário no formato YYYY-MM-DDTHH:mm
        const dataLocal = format(new Date(aula.data_hora), "yyyy-MM-dd'T'HH:mm");

        reset({
          titulo: aula.titulo,
          professor_id: aula.professor_id || '',
          data_hora: dataLocal,
          duracao_minutos: aula.duracao_minutos,
          link_transmissao: aula.link_transmissao || '',
          status: aula.status as any,
          gravacao_url: aula.gravacao_url || '',
          observacoes: aula.observacoes || '',
        });
      } else {
        reset({
          titulo: '',
          professor_id: '',
          data_hora: '',
          duracao_minutos: 60,
          link_transmissao: '',
          status: 'agendada',
          gravacao_url: '',
          observacoes: '',
        });
      }
    }
  }, [open, aula, reset]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      // Converte do formato input datetime-local (fuso do usuário) para UTC (ISO String)
      const dataFormatadaParaBanco = new Date(data.data_hora).toISOString();
      
      // Monta o payload final
      const payload = {
        ...data,
        data_hora: dataFormatadaParaBanco,
        gravacao_url: data.status === 'realizada' ? data.gravacao_url : null,
      };

      await onSubmit(payload);
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
      <DialogContent className="sm:max-w-[500px] bg-slate-950 text-slate-100 border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{aula ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Preencha os dados da aula. Horários usarão o seu fuso horário local.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...register('titulo')} placeholder="Ex: Aula de Reforço" className="bg-slate-900 border-slate-800" />
            {errors.titulo && <p className="text-sm text-red-500">{errors.titulo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="professor_id">Professor *</Label>
            <select 
              id="professor_id" 
              {...register('professor_id')}
              className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-200"
            >
              <option value="">Selecione um professor...</option>
              {professoresAtivos.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.nome}</option>
              ))}
              {/* Se estiver editando e o professor atual estiver inativo, ainda deve aparecer no select para não bugar */}
              {aula && aula.professor_id && !professoresAtivos.find(p => p.id === aula.professor_id) && professores.find(p => p.id === aula.professor_id) && (
                <option value={aula.professor_id}>
                  {professores.find(p => p.id === aula.professor_id)?.nome} (Inativo)
                </option>
              )}
            </select>
            {errors.professor_id && <p className="text-sm text-red-500">{errors.professor_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_hora">Data e Hora *</Label>
              <Input id="data_hora" type="datetime-local" {...register('data_hora')} className="bg-slate-900 border-slate-800" />
              {errors.data_hora && <p className="text-sm text-red-500">{errors.data_hora.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracao_minutos">Duração (minutos) *</Label>
              <Input id="duracao_minutos" type="number" {...register('duracao_minutos')} className="bg-slate-900 border-slate-800" />
              {errors.duracao_minutos && <p className="text-sm text-red-500">{errors.duracao_minutos.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                {...register('status')}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-slate-200"
              >
                <option value="agendada">Agendada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_transmissao">Link Transmissão</Label>
              <Input id="link_transmissao" {...register('link_transmissao')} placeholder="https://zoom.us/..." className="bg-slate-900 border-slate-800" />
            </div>
          </div>

          {watchStatus === 'realizada' && (
            <div className="space-y-2 animate-in fade-in zoom-in duration-200">
              <Label htmlFor="gravacao_url">Link da Gravação</Label>
              <Input id="gravacao_url" {...register('gravacao_url')} placeholder="https://youtube.com/..." className="bg-slate-900 border-slate-800" />
            </div>
          )}

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
