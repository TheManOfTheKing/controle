import React, { useState, useMemo } from 'react';
import { useAulas } from '@/hooks/useAulas';
import { useProfessores } from '@/hooks/useProfessores';
import { useAuth } from '@/auth/useAuth';
import { format, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AULA_STATUS } from '@/types/aulaStatus';
import { DIAS_SEMANA, getDiaSemana } from '@/lib/diaSemana';
import { AulaForm } from './AulaForm';
import { ImportModal } from '@/components/shared/ImportModal';
import { ExportButton } from '@/components/shared/ExportButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit2, CheckCircle, XCircle, Upload, CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AulaWithProfessor } from './aulaService';
import { getNomeMonitor } from './aulaService';
import { useMonitores } from '@/hooks/useMonitores';

export default function AulasPage() {
  const { aulas, loading, error, create, update, updateStatus, insertMany } = useAulas();
  const { professores } = useProfessores(); // Para o filtro de professores
  const { role } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [professorFilter, setProfessorFilter] = useState<string>('todos');
  const [monitorFilter, setMonitorFilter] = useState<string>('todos');
  const [mesFilter, setMesFilter] = useState<string>(''); // Formato YYYY-MM
  const [diaSemanaFilter, setDiaSemanaFilter] = useState<number | 'todos'>('todos');
  const [agruparPorDia, setAgruparPorDia] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<AulaWithProfessor | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false, title: '', description: '', action: async () => {}
  });

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

      const matchDia = diaSemanaFilter === 'todos' || getDay(new Date(a.data_hora)) === diaSemanaFilter;

      return matchTitle && matchStatus && matchProfessor && matchMonitor && matchMes && matchDia;
    });
  }, [aulas, searchTerm, statusFilter, professorFilter, monitorFilter, mesFilter, diaSemanaFilter]);

  const aulasPorDia = useMemo(() => {
    if (!agruparPorDia) return null;
    const grupos: Record<number, AulaWithProfessor[]> = {};
    filteredAulas.forEach(a => {
      const dia = getDay(new Date(a.data_hora));
      grupos[dia] = [...(grupos[dia] ?? []), a];
    });
    // Ordenar por dia (1=Segunda...0=Domingo por ultimo)
    return [1,2,3,4,5,6,0].filter(d => grupos[d]?.length)
      .map(d => ({ dia: DIAS_SEMANA[d], aulas: grupos[d] }));
  }, [filteredAulas, agruparPorDia]);

  const { monitores } = useMonitores();

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

  const handleQuickStatus = async (aula: AulaWithProfessor, novoStatus: 'aula_postada' | 'cancelada') => {
    setConfirmDialog({
      isOpen: true,
      title: `Marcar como ${novoStatus === 'aula_postada' ? 'Aula Postada' : 'Cancelada'}`,
      description: `Deseja realmente marcar esta aula como ${novoStatus}?`,
      action: async () => {
        try {
          await updateStatus(aula.id, novoStatus);
          toast.success(`Aula marcada como ${novoStatus} com sucesso.`);
        } catch (err: any) {
          toast.error(`Erro ao alterar status: ${err.message}`);
        }
      }
    });
  };

  const handleImport = async (data: any[]) => {
    try {
      const inserts = data.map(row => {
        let professor_id = null;
        if (row['Nome do Professor']) {
          const prof = professores.find(p => p.nome.toLowerCase() === String(row['Nome do Professor']).trim().toLowerCase());
          if (!prof) {
            throw new Error(`Professor não encontrado: "${row['Nome do Professor']}". Certifique-se de que o nome está idêntico ao cadastrado.`);
          }
          professor_id = prof.id;
        }

        let duracao = 60;
        if (row['Duracao']) {
          const parsed = parseInt(String(row['Duracao']), 10);
          if (!isNaN(parsed)) duracao = parsed;
        }

        const dataStr = row['DataHora'];
        if (!dataStr) throw new Error("A coluna 'DataHora' é obrigatória (ex: 2026-10-15T14:30).");
        
        let dataHoraFinal = dataStr;
        try {
          dataHoraFinal = new Date(dataStr).toISOString();
        } catch(e) {
          throw new Error(`Data inválida: "${dataStr}". Use o formato AAAA-MM-DDTHH:MM (ex: 2026-10-15T14:30)`);
        }
        
        const statusValidos = AULA_STATUS.map(s => s.value);
        return {
          professor_id,
          titulo: row['Titulo'] || 'Aula importada',
          descricao: null,
          data_hora: dataHoraFinal,
          duracao_minutos: duracao,
          link_transmissao: row['Link'] || null,
          status: statusValidos.includes(row['Status']) ? row['Status'] : 'agendada'
        };
      });

      if (inserts.length === 0) throw new Error("Nenhum dado válido encontrado.");
      
      await insertMany(inserts);
      toast.success(`${inserts.length} aulas importadas com sucesso!`);
    } catch(err:any) {
      throw new Error(err.message);
    }
  };

  const exportColumns = [
    { key: 'titulo', label: 'Título' },
    { key: 'professores.nome', label: 'Professor', format: (val: any) => val || 'Sem professor' },
    { key: 'monitor', label: 'Monitor', format: (val: any, row: AulaWithProfessor) => getNomeMonitor(row) },
    { key: 'data_hora', label: 'Data', format: (val: any) => val ? format(new Date(val), 'dd/MM/yyyy') : '' },
    { key: 'data_hora', label: 'Hora', format: (val: any) => val ? format(new Date(val), 'HH:mm') : '' },
    { key: 'duracao_minutos', label: 'Duração', format: (val: any) => `${val} min` },
    { key: 'status', label: 'Status' },
    { key: 'link_transmissao', label: 'Link', format: (val: any) => val || '' }
  ];

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

  const renderRows = (aulasList: AulaWithProfessor[]) => {
    return aulasList.map((aula) => {
      const dataLocal = new Date(aula.data_hora);
      const diaSemana = getDiaSemana(aula.data_hora);
      return (
        <TableRow key={aula.id} className="border-slate-800 hover:bg-slate-900/50">
          <TableCell>
            <div className="font-medium text-slate-200">{aula.titulo}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${diaSemana.cor}`}>
                {diaSemana.label}
              </span>
              <span className="text-xs text-slate-400">
                {format(dataLocal, "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                {' • '}{aula.duracao_minutos} min
              </span>
            </div>
          </TableCell>
          <TableCell className="text-slate-300">
            {aula.professores?.nome || <span className="text-slate-500 italic">Sem professor</span>}
          </TableCell>
          <TableCell className="text-slate-300 text-sm">
            {getNomeMonitor(aula)}
          </TableCell>
          <TableCell>
            <StatusBadge status={aula.status} />
            {(() => {
              const STATUS_PROGRESSO = ['agendada','confirmada','material_enviado','material_postado','aula_postada'];
              const progressoIdx = STATUS_PROGRESSO.indexOf(aula.status);
              return progressoIdx >= 0 && (
                <div className="flex gap-0.5 mt-2">
                  {STATUS_PROGRESSO.map((_,i) => (
                    <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i <= progressoIdx ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  ))}
                </div>
              );
            })()}
          </TableCell>
          {canWrite && (
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                {aula.status !== 'cancelada' && aula.status !== 'aula_postada' && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleQuickStatus(aula, 'aula_postada')}
                      className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                      title="Marcar como Aula Postada"
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
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Aulas</h1>
          <p className="text-slate-400 mt-1">Gerenciamento de grade e sessões ao vivo.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <ExportButton 
            data={filteredAulas} 
            filename="aulas" 
            columns={exportColumns}
            className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800"
          />
          {canWrite && (
            <>
              <Button onClick={() => setIsImportOpen(true)} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Aula
              </Button>
            </>
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

        <select 
          value={monitorFilter}
          onChange={(e) => setMonitorFilter(e.target.value)}
          className="h-10 px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-48"
        >
          <option value="todos">Todos os Monitores</option>
          {monitores.map(m => (
            <option key={m.id} value={m.id}>{m.nome || "Monitor"}</option>
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
          {AULA_STATUS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select 
          value={diaSemanaFilter}
          onChange={e => setDiaSemanaFilter(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
          className="h-10 px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-44"
        >
          <option value="todos">Todos os Dias</option>
          {DIAS_SEMANA.filter(d => d.value !== 0).map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
          <option value={0}>Domingo</option>
        </select>
      </div>

      <div className="flex justify-end mb-2">
        <Button variant={agruparPorDia ? "default" : "outline"} size="sm" onClick={() => setAgruparPorDia(!agruparPorDia)} className="text-xs">
          <CalendarDays className="w-3 h-3 mr-1" />
          Agrupar por dia
        </Button>
      </div>

      <div className="space-y-4">
        {agruparPorDia ? (
          aulasPorDia?.map(grupo => (
            <div key={grupo.dia.value} className="space-y-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${grupo.dia.cor}`}>
                <CalendarDays className="w-4 h-4" />
                <span className="font-semibold text-sm">{grupo.dia.label}</span>
                <span className="text-xs opacity-70">
                  ({grupo.aulas.length} aula{grupo.aulas.length !== 1 ? "s" : ""})
                </span>
              </div>
              <div className="rounded-md border border-slate-800 overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-900/80">
                    <TableRow className="border-slate-800 hover:bg-slate-900/80">
                      <TableHead className="text-slate-400">Título / Data</TableHead>
                      <TableHead className="text-slate-400">Professor</TableHead>
                      <TableHead className="text-slate-400">Monitor</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      {canWrite && <TableHead className="text-slate-400 text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-slate-950">
                    {renderRows(grupo.aulas)}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-slate-800 overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900/80">
                <TableRow className="border-slate-800 hover:bg-slate-900/80">
                  <TableHead className="text-slate-400">Título / Data</TableHead>
                  <TableHead className="text-slate-400">Professor</TableHead>
                  <TableHead className="text-slate-400">Monitor</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  {canWrite && <TableHead className="text-slate-400 text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-slate-950">
                {filteredAulas.length === 0 ? (
                  <TableRow className="border-slate-800 hover:bg-slate-900/50">
                    <TableCell colSpan={canWrite ? 5 : 4} className="h-24 text-center text-slate-500">
                      Nenhuma aula encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  renderRows(filteredAulas)
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDialog.action(); setConfirmDialog(prev => ({...prev, isOpen: false})); }} className="bg-red-600 hover:bg-red-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Importar Aulas"
        instructions={[
          "Salve sua planilha Excel como formato CSV (UTF-8).",
          "A coluna 'Nome do Professor' deve ter o nome EXATAMENTE igual ao cadastrado no sistema, caso contrário a importação será rejeitada.",
          "A coluna 'DataHora' é obrigatória no padrão ISO: YYYY-MM-DDTHH:MM (ex: 2026-12-01T15:30).",
          "Status aceitos: agendada, realizada, cancelada."
        ]}
        expectedColumns={['Nome do Professor', 'Titulo', 'DataHora', 'Duracao', 'Status', 'Link']}
        onImport={handleImport}
      />

      <AulaForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        aula={editingAula}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
