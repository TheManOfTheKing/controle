import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { professorService } from '@/modules/professores/professorService';
import type { Database } from '@/types/database';

type ProfessorInsert = Database['public']['Tables']['professores']['Insert'];
type ProfessorUpdate = Database['public']['Tables']['professores']['Update'];

const QUERY_KEY = ['professores'] as const;

export function useProfessores() {
  const queryClient = useQueryClient();

  const { data: professores = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: professorService.getAll,
  });

  const error = queryError ? (queryError as Error).message : null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (data: Omit<ProfessorInsert, 'id' | 'criado_em' | 'atualizado_em'>) =>
      professorService.create(data),
    onSuccess: invalidate,
  });

  const insertManyMutation = useMutation({
    mutationFn: (data: Omit<ProfessorInsert, 'id' | 'criado_em' | 'atualizado_em'>[]) =>
      professorService.insertMany(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProfessorUpdate> }) =>
      professorService.update(id, data),
    onSuccess: invalidate,
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, statusAtual }: { id: string; statusAtual: boolean }) =>
      professorService.toggleAtivo(id, statusAtual),
    onSuccess: invalidate,
  });

  // Interface pública idêntica ao hook anterior
  const create = async (data: Omit<ProfessorInsert, 'id' | 'criado_em' | 'atualizado_em'>) => {
    await createMutation.mutateAsync(data);
  };

  const insertMany = async (data: Omit<ProfessorInsert, 'id' | 'criado_em' | 'atualizado_em'>[]) => {
    await insertManyMutation.mutateAsync(data);
  };

  const update = async (id: string, data: Partial<ProfessorUpdate>) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const toggleAtivo = async (id: string, statusAtual: boolean) => {
    await toggleAtivoMutation.mutateAsync({ id, statusAtual });
  };

  const fetchAll = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  return {
    professores,
    loading,
    error,
    fetchAll,
    create,
    insertMany,
    update,
    toggleAtivo,
  };
}
