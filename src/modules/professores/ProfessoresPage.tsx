import React, { useState, useMemo } from 'react';
import { useProfessores } from '@/hooks/useProfessores';
import { useAuth } from '@/auth/useAuth';
import { ProfessorForm } from './ProfessorForm';
import { PixModal } from '@/components/shared/PixModal';
import { ImportModal } from '@/components/shared/ImportModal';
import { ExportButton } from '@/components/shared/ExportButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit2, Ban, CheckCircle2, Upload, Instagram, QrCode } from 'lucide-react';
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

type Professor = Database['public']['Tables']['professores']['Row'];

export default function ProfessoresPage() {
  const { professores, loading, error, create, update, toggleAtivo, insertMany, uploadFoto } = useProfessores();
  const { role } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [pixProfessor, setPixProfessor] = useState<Professor | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false, title: '', description: '', action: async () => {}
  });

  const canWrite = role === 'admin' || role === 'editor';

  const handleImport = async (data: any[]) => {
    try {
      const inserts = data.map(row => ({
        nome: row['Nome'] || '',
        email: row['Email'] || null,
        telefone: row['Telefone'] || null,
        especialidade: row['Especialidade'] || null,
        documento: row['Documento'] || null,
        ativo: true
      })).filter(row => row.nome.trim() !== '');

      if (inserts.length === 0) throw new Error("Nenhum dado válido encontrado para importar.");
      
      await insertMany(inserts);
      toast.success(`${inserts.length} professores importados com sucesso!`);
    } catch (err: any) {
      throw new Error(`Falha na importação: ${err.message}`);
    }
  };

  const exportColumns = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'especialidade', label: 'Especialidade' },
    { key: 'ativo', label: 'Status', format: (val: any) => val ? 'Ativo' : 'Inativo' }
  ];

  const filteredProfessores = useMemo(() => {
    return professores.filter(p => {
      const matchName = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = 
        statusFilter === 'todos' ? true : 
        statusFilter === 'ativos' ? p.ativo === true : 
        p.ativo === false;
      return matchName && matchStatus;
    });
  }, [professores, searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    setEditingProfessor(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: any, file?: File) => {
    let professorId = editingProfessor?.id;
    if (editingProfessor) {
      await update(editingProfessor.id, data);
    } else {
      const created = await create(data);
      professorId = created?.id;
    }

    if (file && professorId) {
      const foto_url = await uploadFoto(professorId, file);
      await update(professorId, { foto_url });
    }
  };

  const getInitials = (nome: string) => nome ? nome.substring(0, 2).toUpperCase() : 'PR';

  const handleToggleStatus = async (professor: Professor) => {
    const isDesativando = professor.ativo;
    setConfirmDialog({
      isOpen: true,
      title: isDesativando ? 'Desativar Professor' : 'Reativar Professor',
      description: `Deseja realmente ${isDesativando ? 'desativar' : 'ativar'} o professor ${professor.nome}?`,
      action: async () => {
        try {
          await toggleAtivo(professor.id, professor.ativo);
          toast.success(`Professor ${professor.nome} foi ${isDesativando ? 'desativado' : 'reativado'}.`);
        } catch (err: any) {
          toast.error(`Erro ao alterar status: ${err.message}`);
        }
      }
    });
  };

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
          <h1 className="text-3xl font-bold text-slate-100">Professores</h1>
          <p className="text-slate-400 mt-1">Gerencie o cadastro de professores do sistema.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <ExportButton 
            data={filteredProfessores} 
            filename="professores" 
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
                Novo Professor
              </Button>
            </>
          )}
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
          <option value="inativos">Apenas Inativos</option>
        </select>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-slate-900/80">
              <TableHead className="text-slate-400 w-[30%]">Nome</TableHead>
              <TableHead className="text-slate-400 w-[20%]">Contato</TableHead>
              <TableHead className="text-slate-400 hidden sm:table-cell w-[25%]">Especialidade</TableHead>
              <TableHead className="text-slate-400 w-[10%]">Status</TableHead>
              {canWrite && <TableHead className="text-slate-400 text-right w-[15%]">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-slate-950">
            {filteredProfessores.length === 0 ? (
              <TableRow className="border-slate-800 hover:bg-slate-900/50">
                <TableCell colSpan={canWrite ? 5 : 4} className="h-24 text-center text-slate-500">
                  Nenhum professor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProfessores.map((professor) => (
                <TableRow key={professor.id} className="border-slate-800 hover:bg-slate-900/50">
                  <TableCell className="font-medium text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex-shrink-0">
                        {professor.foto_url
                          ? <img src={professor.foto_url} className="w-full h-full object-cover" />
                          : <span className="text-xs font-bold text-slate-400 flex items-center justify-center h-full">{getInitials(professor.nome)}</span>
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-200 truncate" title={professor.nome}>{professor.nome}</div>
                        {professor.instagram_handle && (
                          <a href={`https://instagram.com/${professor.instagram_handle}`}
                             target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-0.5 truncate" title={`@${professor.instagram_handle}`}>
                            <Instagram className="w-3 h-3 flex-shrink-0" /> <span className="truncate">@{professor.instagram_handle}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    <div className="flex flex-col gap-1 text-xs min-w-0">
                      {professor.email && <span className="truncate" title={professor.email}>{professor.email}</span>}
                      {professor.telefone && <span className="truncate">{professor.telefone}</span>}
                      {!professor.email && !professor.telefone && <span className="text-slate-600">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 hidden sm:table-cell">
                    <div className="truncate" title={professor.especialidade || ''}>
                      {professor.especialidade || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge ativo={professor.ativo} />
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {professor.pix_chave && (
                          <Button variant="ghost" size="icon"
                            onClick={() => { setPixProfessor(professor); setPixOpen(true); }}
                            className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                            title="Ver PIX">
                            <QrCode className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEdit(professor)}
                          className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleStatus(professor)}
                          className={professor.ativo 
                            ? "text-slate-400 hover:text-red-400 hover:bg-red-400/10" 
                            : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                          }
                          title={professor.ativo ? "Desativar" : "Reativar"}
                        >
                          {professor.ativo ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  )}
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
        title="Importar Professores"
        instructions={[
          "Salve sua planilha Excel como formato CSV (UTF-8).",
          "Mantenha a primeira linha exatamente com os nomes das colunas esperadas.",
          "O campo 'Nome' é obrigatório, os demais são opcionais."
        ]}
        expectedColumns={['Nome', 'Email', 'Telefone', 'Especialidade', 'Documento']}
        onImport={handleImport}
      />

      <ProfessorForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        professor={editingProfessor}
        onSubmit={handleFormSubmit}
      />

      <PixModal
        professor={pixProfessor ? { nome: pixProfessor.nome, pix_tipo: pixProfessor.pix_tipo || '', pix_chave: pixProfessor.pix_chave || '', cidade: pixProfessor.cidade || '' } : null}
        open={pixOpen}
        onOpenChange={setPixOpen}
      />
    </div>
  );
}
