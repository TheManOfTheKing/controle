import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Upload, Instagram, QrCode } from 'lucide-react';
import type { Database } from '@/types/database';

type Professor = Database['public']['Tables']['professores']['Row'];

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.preprocess(v => (typeof v === 'string' ? v.trim() : v), z.union([z.string().email('E-mail inválido'), z.literal('')]).nullable().optional().transform(v => (!v || v === '') ? null : v)),
  telefone: z.string().optional().nullable(),
  especialidade: z.string().optional().nullable(),
  documento: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  instagram_handle: z.preprocess(v => (typeof v === 'string' ? v.trim() : v), z.string().nullable().optional().transform(v => (!v || v === '') ? null : v).refine(v => v === null || /^[a-zA-Z0-9_.]{1,30}$/.test(v), 'Handle inválido')),
  foto_url: z.string().nullable().optional().transform(v => (!v || v.trim() === '') ? null : v),
  pix_tipo: z.preprocess(v => (typeof v === 'string' ? v.trim() : v), z.union([z.enum(['cpf','cnpj','email','telefone','aleatoria']), z.literal('')]).nullable().optional().transform(v => (!v || v === '') ? null : v)),
  pix_chave: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface ProfessorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professor?: Professor | null;
  onSubmit: (data: any, file?: File) => Promise<void>;
}

export function ProfessorForm({ open, onOpenChange, professor, onSubmit }: ProfessorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | undefined>(undefined);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      especialidade: '',
      documento: '',
      endereco: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      observacoes: '',
      instagram_handle: '',
      foto_url: '',
      pix_tipo: null,
      pix_chave: '',
    }
  });

  const watchHandle = watch('instagram_handle');
  const watchPixTipo = watch('pix_tipo');

  useEffect(() => {
    if (open) {
      if (professor) {
        reset({
          nome: professor.nome,
          email: professor.email || '',
          telefone: professor.telefone || '',
          especialidade: professor.especialidade || '',
          documento: professor.documento || '',
          endereco: professor.endereco || '',
          cep: professor.cep || '',
          logradouro: professor.logradouro || '',
          numero: professor.numero || '',
          complemento: professor.complemento || '',
          bairro: professor.bairro || '',
          cidade: professor.cidade || '',
          estado: professor.estado || '',
          observacoes: professor.observacoes || '',
          instagram_handle: professor.instagram_handle || '',
          foto_url: professor.foto_url || '',
          pix_tipo: (professor.pix_tipo as any) || '',
          pix_chave: professor.pix_chave || '',
        });
        setFotoPreview(professor.foto_url || null);
      } else {
        reset({
          nome: '',
          email: '',
          telefone: '',
          especialidade: '',
          documento: '',
          endereco: '',
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          observacoes: '',
          instagram_handle: '',
          foto_url: '',
          pix_tipo: '',
          pix_chave: '',
        });
        setFotoPreview(null);
      }
      setFotoFile(undefined);
    }
  }, [open, professor, reset]);

  const cepValue = watch('cep');

  useEffect(() => {
    if (cepValue && cepValue.replace(/\D/g, '').length === 8) {
      const fetchAddress = async () => {
        try {
          const cleanCep = cepValue.replace(/\D/g, '');
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await res.json();
          if (!data.erro) {
            setValue('logradouro', data.logradouro || '', { shouldValidate: true });
            setValue('bairro', data.bairro || '', { shouldValidate: true });
            setValue('cidade', data.localidade || '', { shouldValidate: true });
            setValue('estado', data.uf || '', { shouldValidate: true });
          }
        } catch (err) {
          console.error("Erro ao buscar CEP", err);
        }
      };
      fetchAddress();
    }
  }, [cepValue, setValue]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const initials = watch('nome') ? watch('nome').substring(0, 2).toUpperCase() : 'PR';

  let pixPlaceholder = "Chave PIX";
  if (watchPixTipo === 'cpf') pixPlaceholder = "000.000.000-00";
  if (watchPixTipo === 'cnpj') pixPlaceholder = "00.000.000/0000-00";
  if (watchPixTipo === 'telefone') pixPlaceholder = "(00) 90000-0000";
  if (watchPixTipo === 'email') pixPlaceholder = "email@exemplo.com";

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data, fotoFile);
      toast.success(professor ? 'Professor atualizado com sucesso!' : 'Professor cadastrado com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (formErrors: any) => {
    console.error("Erros de validação Zod:", formErrors);
    
    // Pega a primeira mensagem de erro para exibir ao usuário
    const firstErrorMsg = Object.values(formErrors)[0] 
      ? (Object.values(formErrors)[0] as any).message 
      : "Algum campo preenchido está inválido";
      
    import('sonner').then(({ toast }) => {
      toast.error(`Não foi possível salvar: ${firstErrorMsg}`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 text-slate-100 border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{professor ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Preencha os dados do professor abaixo. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit, onInvalid)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register('nome')} placeholder="Ex: João da Silva" className="bg-slate-900 border-slate-800" />
            {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} placeholder="Ex: joao@email.com" className="bg-slate-900 border-slate-800" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register('telefone')} placeholder="Ex: (11) 99999-9999" className="bg-slate-900 border-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>@ Instagram</Label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">instagram.com/</span>
                <Input {...register("instagram_handle")}
                  placeholder="profsoares"
                  className="bg-slate-900 border-slate-800" />
              </div>
              {watchHandle && (
                <a href={`https://instagram.com/${watchHandle}`} target="_blank"
                   className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> Ver perfil no Instagram
                </a>
              )}
              {errors.instagram_handle && <p className="text-sm text-red-500">{errors.instagram_handle.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  {fotoPreview
                    ? <img src={fotoPreview} className="w-full h-full object-cover" />
                    : <span className="text-slate-400 text-xl font-bold">{initials}</span>}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={handleFotoChange} className="hidden" ref={fileInputRef} />
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-slate-700 text-slate-300">
                      <Upload className="w-4 h-4 mr-2" /> Selecionar foto
                    </Button>
                    {fotoPreview && (
                      <Button type="button" variant="ghost" size="sm"
                        onClick={() => {
                          setFotoFile(undefined);
                          setFotoPreview(null);
                          setValue('foto_url', '', { shouldValidate: true, shouldDirty: true });
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        Remover
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG ou WebP. Max 2MB.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input id="especialidade" {...register('especialidade')} placeholder="Ex: Matemática" className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">Documento (CPF)</Label>
              <Input id="documento" {...register('documento')} placeholder="000.000.000-00" className="bg-slate-900 border-slate-800" />
            </div>
          </div>

          <div className="space-y-4 border border-slate-800 rounded-md p-4 bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-300">Endereço</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" {...register('cep')} placeholder="00000-000" className="bg-slate-950 border-slate-800" maxLength={9} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" {...register('logradouro')} placeholder="Rua, Avenida..." className="bg-slate-950 border-slate-800" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" {...register('numero')} placeholder="123" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" {...register('complemento')} placeholder="Apto, Sala, Bloco..." className="bg-slate-950 border-slate-800" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" {...register('bairro')} placeholder="Bairro" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" {...register('cidade')} placeholder="Cidade" className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input id="estado" {...register('estado')} placeholder="UF" className="bg-slate-950 border-slate-800" maxLength={2} />
              </div>
            </div>
          </div>

          <div className="border border-slate-800 rounded-md p-4 bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-400" /> Dados PIX
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo da Chave</Label>
                <select {...register("pix_tipo")}
                  className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Selecione...</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
                {errors.pix_tipo && (
                  <p className="text-xs text-red-500">{errors.pix_tipo.message as string}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input {...register("pix_chave")}
                  placeholder={pixPlaceholder}
                  className="bg-slate-950 border-slate-800" />
                {errors.pix_chave && (
                  <p className="text-xs text-red-500">{errors.pix_chave.message}</p>
                )}
              </div>
            </div>
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
