import React, { useState, useMemo } from 'react';
import { useAulas } from '@/hooks/useAulas';
import { useProfessores } from '@/hooks/useProfessores';
import { useAuth } from '@/auth/useAuth';
import { format, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AulaForm } from './AulaForm';
import { ExportButton } from '@/components/shared/ExportButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AulaWithProfessor } from './aulaService';

export default function AulasPage() {
  const { aulas, loading, error, create, update, updateStatus } = useAulas();
  const { professores } = useProfessores(); // Para o filtro de professores
  const { role } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'agendada' | 'realizada' | 'cancelada'>('todos');
  const [professorFilter, setProfessorFilter] = useState<string>('todos');
  const [mesFilter, setMesFilter] = useState<string>(''); // Formato YYYY-MM
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<AulaWithProfessor | null>(null);

  const canWrite = role === 'admin' || role === 'editor';

  const filteredAulas = useMemo(() => {
    return aulas.filter(a => {
      const matchTitle = a.titulo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || a.status === statusFilter;
      const matchProfessor = professorFilter === 'todos' || a.professor_id === professorFilter;
      
      let matchMes = true;
      if (mesFilter) {
        const aulaDate = new Date(a.data_hora);
        const [year, month] = mesFilter.split('-');
        matchMes = aulaDate.getFullYear() === parseInt(year) && aulaDate.getMonth() === (parseInt(month) - 1);
      }

      return matchTitle && matchStatus && matchProfessor && matchMes;
    });
  }, [aulas, searchTerm, statusFilter, professorFilter, mesFilter]);

  const handleOpenCreate = () => {
    setEditingAula(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (aula: AulaWithProfessor) => {
    setEditingAula(aula);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingAula) {
      await update(editingAula.id, data);
    } else {
      await create(data);
    }
  };

  const handleQuickStatus = async (aula: AulaWithProfessor, novoStatus: 'realizada' | 'cancelada') => {
    if (confirm(`Deseja marcar esta aula como ${novoStatus}?`)) {
      try {
        await updateStatus(aula.id, novoStatus);
      } catch (err: any) {
        alert(`Erro ao alterar status: ${err.message}`);
      }
    }
  };

  // Prepara dados para o ExportButton
  const exportData = filteredAulas.map(a => ({
    Titulo: a.titulo,
    Professor: a.professores?.nome || 'Sem professor',
    Data: format(new Date(a.data_hora), 'dd/MM/yyyy HH:mm'),
    Duracao: `${a.duracao_minutos} min`,
    Status: a.status,
    LinkTransmissao: a.link_transmissao || '',
    LinkGravacao: a.gravacao_url || '',
    Observacoes: a.observacoes || ''
  }));

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Aulas</h1>
          <p className="text-slate-400 mt-1">Gerenciamento de grade e sessões ao vivo.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ExportButton 
            data={exportData} 
            filename="aulas" 
            className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800"
          />
          {canWrite && (
            <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Aula
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar por título..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-200"
          />
        </div>
        
        <select 
          value={professorFilter}
          onChange={(e) => setProfessorFilter(e.target.value)}
          className="h-10 px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-48"
        >
          <option value="todos">Todos os Professores</option>
          {professores.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>

        <Input 
          type="month"
          value={mesFilter}
          onChange={(e) => setMesFilter(e.target.value)}
          className="bg-slate-950 border-slate-800 text-slate-200 w-full md:w-48"
        />

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-48"
        >
          <option value="todos">Todos os Status</option>
          <option value="agendada">Agendada</option>
          <option value="realizada">Realizada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-slate-900/80">
              <TableHead className="text-slate-400">Título / Data</TableHead>
              <TableHead className="text-slate-400">Professor</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              {canWrite && <TableHead className="text-slate-400 text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-slate-950">
            {filteredAulas.length === 0 ? (
              <TableRow className="border-slate-800 hover:bg-slate-900/50">
                <TableCell colSpan={canWrite ? 4 : 3} className="h-24 text-center text-slate-500">
                  Nenhuma aula encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredAulas.map((aula) => {
                const dataLocal = new Date(aula.data_hora);
                return (
                  <TableRow key={aula.id} className="border-slate-800 hover:bg-slate-900/50">
                    <TableCell>
                      <div className="font-medium text-slate-200">{aula.titulo}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {format(dataLocal, "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                        {' • '}{aula.duracao_minutos} min
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {aula.professores?.nome || <span className="text-slate-500 italic">Sem professor</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={aula.status} />
                    </TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {aula.status === 'agendada' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleQuickStatus(aula, 'realizada')}
                                className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                                title="Marcar como Realizada"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleQuickStatus(aula, 'cancelada')}
                                className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                                title="Cancelar Aula"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEdit(aula)}
                            className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AulaForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        aula={editingAula}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
