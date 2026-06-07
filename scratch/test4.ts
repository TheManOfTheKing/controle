import * as z from 'zod';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.union([z.string().email('E-mail inválido'), z.literal('')]).nullable().optional().transform(v => (!v || v.trim() === '') ? null : v),
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
  instagram_handle: z.string().nullable().optional().transform(v => (!v || v.trim() === '') ? null : v).refine(v => v === null || /^[a-zA-Z0-9_.]{1,30}$/.test(v), 'Handle inválido'),
  foto_url: z.union([z.string().url('URL inválida'), z.literal('')]).nullable().optional().transform(v => (!v || v.trim() === '') ? null : v),
  pix_tipo: z.union([z.enum(['cpf','cnpj','email','telefone','aleatoria']), z.literal('')]).nullable().optional().transform(v => (!v || v === '') ? null : v),
  pix_chave: z.string().optional().nullable(),
});

const professorMock = {
  nome: "Adelmo",
  email: "",
  telefone: "",
  especialidade: "",
  documento: "",
  endereco: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  observacoes: "",
  instagram_handle: "",
  foto_url: "",
  pix_tipo: "",
  pix_chave: ""
};

console.log(JSON.stringify(schema.safeParse(professorMock), null, 2));

