import { getDay } from "date-fns";

export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo',    cor: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  { value: 1, label: 'Segunda-feira', cor: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  { value: 2, label: 'Terça-feira', cor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' },
  { value: 3, label: 'Quarta-feira', cor: 'bg-violet-500/10 text-violet-500 border-violet-500/30' },
  { value: 4, label: 'Quinta-feira', cor: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  { value: 5, label: 'Sexta-feira', cor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  { value: 6, label: 'Sábado',     cor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
] as const;

export const getDiaSemana = (dateStr: string) => {
  const dia = getDay(new Date(dateStr));
  return DIAS_SEMANA[dia];
};
