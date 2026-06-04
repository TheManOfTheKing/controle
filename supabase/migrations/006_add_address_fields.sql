-- Migration to add address fields to professores and pessoal tables

-- Add columns to professores
ALTER TABLE public.professores 
ADD COLUMN cep text,
ADD COLUMN logradouro text,
ADD COLUMN numero text,
ADD COLUMN complemento text,
ADD COLUMN bairro text,
ADD COLUMN cidade text,
ADD COLUMN estado text;

-- Add columns to pessoal
ALTER TABLE public.pessoal 
ADD COLUMN cep text,
ADD COLUMN logradouro text,
ADD COLUMN numero text,
ADD COLUMN complemento text,
ADD COLUMN bairro text,
ADD COLUMN cidade text,
ADD COLUMN estado text;
