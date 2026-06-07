import React, { useState, useMemo } from 'react';
import { usePessoal } from '@/hooks/usePessoal';
import { useAuth } from '@/auth/useAuth';
import { format, parseISO } from 'date-fns';
import { PessoalForm } from './PessoalForm';
import { ImportModal } from '@/components/shared/ImportModal';
import { ExportButton } from '@/components/shared/ExportButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit2, ShieldAlert, Power, Upload, MessageCircle } from 'lucide-react';
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
import type { Database } from '@/types/database';

type PessoalRow = Database['public']['Tables']['pessoal']['Row'];

const safeFormatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  try {
    return format(d, 'dd/MM/yyyy');
  } catch (e) {
    return '';
  }
};

export default function PessoalPage() {
  const { pessoal, loading: pessoalLoading, error, create, update, insertMany } = usePessoal();
  const { role, loading: authLoading } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<PessoalRow | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false, title: '', description: '', action: async () => {}
  });

  const filteredPessoal = useMemo(() => {
    return pessoal.filter(p => {
      const matchNome = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = 
        statusFilter === 'todos' ? true : 
        statusFilter === 'ativos' ? p.status === 'ativo' : 
        p.status === 'inativo';
      
      return matchNome && matchStatus;
    });
  }, [pessoal, searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    setEditingFuncionario(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (funcionario: PessoalRow) => {
    setEditingFuncionario(funcionario);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingFuncionario) {
      await update(editingFuncionario.id, data);
    } else {
      await create(data);
    }
  };

  const handleToggleStatus = async (funcionario: PessoalRow) => {
    const isDesativando = funcionario.status === 'ativo';
    setConfirmDialog({
      isOpen: true,
      title: isDesativando ? 'Desligar Funcionário' : 'Reativar Funcionário',
      description: `Deseja realmente ${isDesativando ? 'desligar' : 'reativar'} ${funcionario.nome}?`,
      action: async () => {
        try {
          await update(funcionario.id, { status: isDesativando ? 'inativo' : 'ativo' });
          toast.success(`Funcionário ${funcionario.nome} foi ${isDesativando ? 'desligado' : 'reativado'}.`);
        } catch (err: any) {
          toast.error(`Erro ao alterar status: ${err.message}`);
        }
      }
    });
  };

  const handleImport = async (data: any[]) => {
    try {
      const inserts = data.map(row => {
        let salario: number | null = null;
        if (row['Salario']) {
          const parsed = parseFloat(String(row['Salario']).replace(/[^0-9.-]+/g, ""));
          if (!isNaN(parsed)) salario = parsed;
        }
        
        let data_admissao: string | null = null;
        if (row['DataAdmissao']) {
          // simple check for yyyy-mm-dd or dd/mm/yyyy. Try to keep simple ISO string parsing if possible.
          try {
            const parts = String(row['DataAdmissao']).split('/');
            if (parts.length === 3) {
              data_admissao = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
              data_admissao = new Date(row['DataAdmissao']).toISOString().split('T')[0];
            }
          } catch(e) {}
        }

        return {
          nome: row['Nome'] || '',
          cargo: row['Cargo'] || null,
          email: row['Email'] || null,
          telefone: row['Telefone'] || null,
          documento: row['Documento'] || null,
          salario,
          data_admissao,
          status: 'ativo'
        };
      }).filter(row => row.nome.trim() !== '');

      if (inserts.length === 0) throw new Error("Nenhum dado válido encontrado para importar.");
      
      await insertMany(inserts);
      toast.success(`${inserts.length} funcionários importados com sucesso!`);
    } catch(err:any) {
      throw new Error(`Falha na importação: ${err.message}`);
    }
  };

  const exportColumns = [
    { key: 'nome', label: 'Nome' },
    { key: 'cargo', label: 'Cargo', format: (val: any) => val || '' },
    { key: 'email', label: 'Email', format: (val: any) => val || '' },
    { key: 'telefone', label: 'Telefone', format: (val: any) => val || '' },
    { key: 'documento', label: 'Documento', format: (val: any) => val || '' },
    { key: 'data_admissao', label: 'DataAdmissao', format: (val: any) => safeFormatDate(val) },
    { key: 'data_demissao', label: 'DataDemissao', format: (val: any) => safeFormatDate(val) },
    { key: 'status', label: 'Status', format: (val: any) => val === 'ativo' ? 'Ativo' : 'Desligado' },
    { key: 'observacoes', label: 'Observacoes', format: (val: any) => val || '' }
  ];

  if (authLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Verificação dupla de segurança
  if (role !== 'admin') {
    return (
      <div className="p-6 max-w-3xl mx-auto mt-10">
        <div className="bg-red-950/30 border border-red-900/50 p-8 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="bg-red-900/50 p-4 rounded-full mb-4">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Acesso Não Autorizado</h1>
          <p className="text-slate-400">
            A área de Gestão de Pessoal e RH é estritamente confidencial e limitada a Administradores.
          </p>
        </div>
      </div>
    );
  }



  if (pessoalLoading) {
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
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            Gestão de Pessoal <ShieldAlert className="h-4 w-4 text-amber-500" aria-label="Permissões de acesso não definidas. Contate o suporte." />
          </h1>
          <p className="text-slate-400 mt-1">Cadastro e contratos da equipe operacional e administrativa.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <ExportButton 
              data={filteredPessoal}
              filename="pessoal"
              columns={exportColumns}
            />
            <Button onClick={() => setIsImportOpen(true)} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Colaborador
            </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-200"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="todos">Todos os Status</option>
          <option value="ativos">Apenas Ativos</option>
          <option value="inativos">Apenas Desligados</option>
        </select>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-slate-900/80">
              <TableHead className="text-slate-400">Funcionário</TableHead>
              <TableHead className="text-slate-400">Contato</TableHead>
              <TableHead className="text-slate-400">Admissão</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-slate-950">
            {filteredPessoal.length === 0 ? (
              <TableRow className="border-slate-800 hover:bg-slate-900/50">
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  Nenhum funcionário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredPessoal.map((funcionario) => (
                <TableRow key={funcionario.id} className="border-slate-800 hover:bg-slate-900/50">
                  <TableCell>
                    <div className="font-medium text-slate-200">{funcionario.nome}</div>
                    <div className="text-xs text-slate-400 mt-1">{funcionario.cargo || 'Sem cargo'}</div>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    <div className="flex flex-col gap-1 text-xs">
                      {funcionario.email && <span>{funcionario.email}</span>}
                      {funcionario.telefone && (
                        funcionario.is_whatsapp ? (
                          <a 
                            href={`https://wa.me/55${funcionario.telefone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline truncate"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{funcionario.telefone}</span>
                          </a>
                        ) : (
                          <span className="truncate">{funcionario.telefone}</span>
                        )
                      )}
                      {!funcionario.email && !funcionario.telefone && <span className="text-slate-600">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {safeFormatDate(funcionario.data_admissao) || '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={funcionario.status || 'ativo'} ativo={funcionario.status === 'ativo'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenEdit(funcionario)}
                        className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10"
                        title="Editar Confidencial"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleToggleStatus(funcionario)}
                        className={funcionario.status === 'ativo' 
                          ? "text-slate-400 hover:text-red-400 hover:bg-red-400/10" 
                          : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                        }
                        title={funcionario.status === 'ativo' ? "Desligar" : "Reativar"}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
            <AlertDialogAction onClick={() => { confirmDialog.action(); setConfirmDialog(prev => ({...prev, isOpen: false})); }} className="bg-indigo-600 hover:bg-indigo-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Importar Pessoal"
        instructions={[
          "Salve sua planilha Excel como formato CSV (UTF-8).",
          "Mantenha a primeira linha exatamente com os nomes das colunas esperadas.",
          "Para o salário, use apenas números e ponto decimal (ex: 2500.50).",
          "DataAdmissao deve estar no formato DD/MM/YYYY ou YYYY-MM-DD.",
          "O campo 'Nome' é obrigatório, os demais são opcionais."
        ]}
        expectedColumns={['Nome', 'Cargo', 'Email', 'Telefone', 'Documento', 'DataAdmissao', 'Salario']}
        onImport={handleImport}
      />

      <PessoalForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        funcionario={editingFuncionario}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
