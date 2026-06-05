import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pessoalService } from '@/modules/pessoal/pessoalService';
import type { Database } from '@/types/database';

type PessoalInsert = Database['public']['Tables']['pessoal']['Insert'];
type PessoalUpdate = Database['public']['Tables']['pessoal']['Update'];

const QUERY_KEY = ['pessoal'] as const;

export function usePessoal() {
  const queryClient = useQueryClient();

  const { data: pessoal = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: pessoalService.getAll,
  });

  const error = queryError ? (queryError as Error).message : null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (data: Omit<PessoalInsert, 'id' | 'criado_em' | 'atualizado_em'>) =>
      pessoalService.create(data),
    onSuccess: invalidate,
  });

  const insertManyMutation = useMutation({
    mutationFn: (data: Omit<PessoalInsert, 'id' | 'criado_em' | 'atualizado_em'>[]) =>
      pessoalService.insertMany(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PessoalUpdate> }) =>
      pessoalService.update(id, data),
    onSuccess: invalidate,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      pessoalService.updateStatus(id, status),
    onSuccess: invalidate,
  });

  // Interface pública idêntica ao hook anterior
  const create = async (data: Omit<PessoalInsert, 'id' | 'criado_em' | 'atualizado_em'>) => {
    await createMutation.mutateAsync(data);
  };

  const insertMany = async (data: Omit<PessoalInsert, 'id' | 'criado_em' | 'atualizado_em'>[]) => {
    await insertManyMutation.mutateAsync(data);
  };

  const update = async (id: string, data: Partial<PessoalUpdate>) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const updateStatus = async (id: string, status: string) => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const fetchAll = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  return {
    pessoal,
    loading,
    error,
    fetchAll,
    create,
    insertMany,
    update,
    updateStatus,
  };
}
