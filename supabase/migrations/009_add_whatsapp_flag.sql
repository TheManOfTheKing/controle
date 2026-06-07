-- Adição da flag is_whatsapp nas tabelas professores e pessoal

ALTER TABLE public.professores
ADD COLUMN is_whatsapp BOOLEAN DEFAULT false;

ALTER TABLE public.pessoal
ADD COLUMN is_whatsapp BOOLEAN DEFAULT false;