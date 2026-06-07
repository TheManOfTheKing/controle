export const AULA_STATUS = [
  { value: 'agendada',        label: 'Agendada',        cor: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { value: 'confirmada',      label: 'Confirmada',      cor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' },
  { value: 'material_enviado',label: 'Material Enviado',cor: 'bg-violet-500/10 text-violet-600 border-violet-500/30' },
  { value: 'material_postado',label: 'Material Postado',cor: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { value: 'aula_postada',    label: 'Aula Postada',    cor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  { value: 'cancelada',       label: 'Cancelada',       cor: 'bg-slate-500/10 text-slate-500 border-slate-500/30' },
  { value: 'realizada',       label: 'Realizada (Legado)', cor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  { value: 'reagendada',      label: 'Reagendada (Legado)',cor: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  { value: 'em_andamento',    label: 'Em Andamento (Legado)', cor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' },
] as const;

export type AulaStatusValue = typeof AULA_STATUS[number]['value'];

// Utilitários
export const getStatusConfig = (status: string) =>
  AULA_STATUS.find(s => s.value === status) ?? AULA_STATUS[0];
