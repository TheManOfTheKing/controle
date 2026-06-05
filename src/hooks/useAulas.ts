import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aulaService, type AulaWithProfessor } from '@/modules/aulas/aulaService';
import type { Database } from '@/types/database';

type AulaInsert = Database['public']['Tables']['aulas']['Insert'];
type AulaUpdate = Database['public']['Tables']['aulas']['Update'];

const QUERY_KEY = ['aulas'] as const;

export function useAulas() {
  const queryClient = useQueryClient();

  const { data: aulas = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: aulaService.getAll,
  });

  const error = queryError ? (queryError as Error).message : null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (data: Omit<AulaInsert, 'id' | 'criado_em' | 'atualizado_em'>) =>
      aulaService.create(data),
    onSuccess: invalidate,
  });

  const insertManyMutation = useMutation({
    mutationFn: (data: Omit<AulaInsert, 'id' | 'criado_em' | 'atualizado_em'>[]) =>
      aulaService.insertMany(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AulaUpdate> }) =>
      aulaService.update(id, data),
    onSuccess: invalidate,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      aulaService.updateStatus(id, status),
    onSuccess: invalidate,
  });

  // Interface pública idêntica ao hook anterior
  const create = async (data: Omit<AulaInsert, 'id' | 'criado_em' | 'atualizado_em'>) => {
    await createMutation.mutateAsync(data);
  };

  const insertMany = async (data: Omit<AulaInsert, 'id' | 'criado_em' | 'atualizado_em'>[]) => {
    await insertManyMutation.mutateAsync(data);
  };

  const update = async (id: string, data: Partial<AulaUpdate>) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const updateStatus = async (id: string, status: string) => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const fetchAll = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  return {
    aulas,
    loading,
    error,
    fetchAll,
    create,
    insertMany,
    update,
    updateStatus,
  };
}
