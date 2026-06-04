import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  ativo?: boolean;
  status?: string;
}

export function StatusBadge({ ativo, status }: StatusBadgeProps) {
  // Trata o caso de status string (Aulas, Pagamentos, etc)
  if (status) {
    switch (status.toLowerCase()) {
      case 'agendada':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none">Agendada</Badge>;
      case 'realizada':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Realizada</Badge>;
      case 'cancelada':
        return <Badge className="bg-slate-500 hover:bg-slate-600 text-white border-none">Cancelada</Badge>;
      case 'pendente':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none">Pendente</Badge>;
      case 'pago':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Pago</Badge>;
      case 'atrasado':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white border-none">Atrasado</Badge>;
      default:
        return <Badge className="bg-slate-700 hover:bg-slate-800 text-slate-300 border-none">{status}</Badge>;
    }
  }

  // Trata o caso de ativo boolean (Professores, Pessoal)
  if (ativo === true) {
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">
        Ativo
      </Badge>
    );
  }

  if (ativo === false) {
    return (
      <Badge className="bg-slate-700 hover:bg-slate-800 text-slate-300 border-none">
        Inativo
      </Badge>
    );
  }

  return null;
}
