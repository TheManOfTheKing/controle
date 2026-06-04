import React, { useMemo } from 'react';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useAulas } from '@/hooks/useAulas';
import { useProfessores } from '@/hooks/useProfessores';
import { usePessoal } from '@/hooks/usePessoal';
import { formatCurrencyExport } from '@/lib/export';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { DollarSign, BookOpen, Users, Briefcase } from 'lucide-react';

export default function DashboardPage() {
  const { pagamentos, loading: pLoading } = usePagamentos();
  const { aulas, loading: aLoading } = useAulas();
  const { professores, loading: profLoading } = useProfessores();
  const { pessoal, loading: pessLoading } = usePessoal();

  const loading = pLoading || aLoading || profLoading || pessLoading;

  const kpis = useMemo(() => {
    let receitaRealizada = 0;
    let receitaPendente = 0;
    let aulasRealizadas = 0;
    let equipeAtiva = 0;

    pagamentos.forEach(p => {
      if (p.status === 'pago') receitaRealizada += p.valor;
      if (p.status === 'pendente' || p.status === 'atrasado') receitaPendente += p.valor;
    });

    aulas.forEach(a => {
      if (a.status === 'realizada') aulasRealizadas++;
    });

    professores.forEach(p => {
      if (p.ativo) equipeAtiva++;
    });

    pessoal.forEach(p => {
      if (p.status === 'ativo') equipeAtiva++;
    });

    return { receitaRealizada, receitaPendente, aulasRealizadas, equipeAtiva };
  }, [pagamentos, aulas, professores, pessoal]);

  // Agrupar pagamentos por mês
  const chartDataFinanceiro = useMemo(() => {
    const meses: Record<string, { name: string; Pago: number; Inadimplente: number }> = {};
    
    // Inicializar os últimos 6 meses até o atual
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = format(d, 'yyyy-MM');
      meses[key] = {
        name: format(d, 'MMM', { locale: ptBR }).toUpperCase(),
        Pago: 0,
        Inadimplente: 0
      };
    }

    pagamentos.forEach(p => {
      if (!p.data_vencimento) return;
      const key = p.data_vencimento.substring(0, 7); // YYYY-MM
      if (meses[key]) {
        if (p.status === 'pago') meses[key].Pago += p.valor;
        if (p.status === 'atrasado') meses[key].Inadimplente += p.valor;
      }
    });

    return Object.values(meses);
  }, [pagamentos]);

  // Agrupar aulas por mês
  const chartDataAulas = useMemo(() => {
    const meses: Record<string, { name: string; Realizadas: number; Agendadas: number; Canceladas: number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = format(d, 'yyyy-MM');
      meses[key] = {
        name: format(d, 'MMM', { locale: ptBR }).toUpperCase(),
        Realizadas: 0,
        Agendadas: 0,
        Canceladas: 0
      };
    }

    aulas.forEach(a => {
      const key = a.data_hora.substring(0, 7); // YYYY-MM
      if (meses[key]) {
        if (a.status === 'realizada') meses[key].Realizadas++;
        if (a.status === 'agendada') meses[key].Agendadas++;
        if (a.status === 'cancelada') meses[key].Canceladas++;
      }
    });

    return Object.values(meses);
  }, [aulas]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Visão geral e indicadores de performance.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Receita Global</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrencyExport(kpis.receitaRealizada)}</p>
          </div>
          <div className="bg-emerald-400/10 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Contas a Receber</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrencyExport(kpis.receitaPendente)}</p>
          </div>
          <div className="bg-amber-400/10 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Aulas Realizadas</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{kpis.aulasRealizadas}</p>
          </div>
          <div className="bg-indigo-400/10 p-3 rounded-full">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Equipe Ativa</p>
            <p className="text-2xl font-bold text-sky-400 mt-1">{kpis.equipeAtiva}</p>
          </div>
          <div className="bg-sky-400/10 p-3 rounded-full">
            <Users className="w-6 h-6 text-sky-400" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Receita x Inadimplência */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold text-slate-200 mb-6">Receita vs Inadimplência (6 meses)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataFinanceiro} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInadimplente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} tickFormatter={(val) => `R$${val/1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  formatter={(value: number) => formatCurrencyExport(value)}
                />
                <Legend />
                <Area type="monotone" dataKey="Pago" stroke="#34d399" fillOpacity={1} fill="url(#colorPago)" />
                <Area type="monotone" dataKey="Inadimplente" stroke="#f87171" fillOpacity={1} fill="url(#colorInadimplente)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume de Aulas */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-lg font-bold text-slate-200 mb-6">Volume de Aulas (6 meses)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataAulas} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  cursor={{fill: '#1e293b'}}
                />
                <Legend />
                <Bar dataKey="Realizadas" stackId="a" fill="#818cf8" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Agendadas" stackId="a" fill="#38bdf8" />
                <Bar dataKey="Canceladas" stackId="a" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
