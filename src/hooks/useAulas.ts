import { useState, useCallback, useEffect } from 'react';
import { aulaService, type AulaWithProfessor } from '@/modules/aulas/aulaService';
import type { Database } from '@/types/database';

type AulaInsert = Database['public']['Tables']['aulas']['Insert'];
type AulaUpdate = Database['public']['Tables']['aulas']['Update'];

export function useAulas() {
  const [aulas, setAulas] = useState<AulaWithProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aulaService.getAll();
      setAulas(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Omit<AulaInsert, 'id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      setError(null);
      await aulaService.create(data);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const update = async (id: string, data: Partial<AulaUpdate>) => {
    try {
      setError(null);
      await aulaService.update(id, data);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setError(null);
      await aulaService.updateStatus(id, status);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    aulas,
    loading,
    error,
    fetchAll,
    create,
    update,
    updateStatus,
  };
}
