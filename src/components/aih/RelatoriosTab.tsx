import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, BarChart3, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type AIHRow = Database['public']['Tables']['aih_registros']['Row'];

const COLORS_CHART = [
  'hsl(var(--hospital-blue))',
  'hsl(var(--hospital-green))',
  'hsl(var(--hospital-amber))',
  'hsl(var(--hospital-urgencia))',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtShortCurrency(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
}

// ── Tooltips separados por tipo ───────────────────────────────
const TooltipQtd = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">
          {p.name}: <span className="font-bold">{p.value} AIH{p.value !== 1 ? 's' : ''}</span>
        </p>
      ))}
    </div>
  );
};

const TooltipCurrency = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">
          {p.name}: <span className="font-bold">{fmtCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

const TooltipFreq = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">
          {p.name}: <span className="font-bold">{p.value} ocorrência{p.value !== 1 ? 's' : ''}</span>
        </p>
      ))}
    </div>
  );
};

// ── KPI Card ─────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}
function KPICard({ label, value, icon: Icon, color, sub }: KPICardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide leading-none mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function RelatoriosTab() {
  const [records, setRecords] = useState<AIHRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const PAGE_SIZE = 1000;
    let allData: AIHRow[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('aih_registros')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (dateFrom) query = query.gte('data_lancamento' as never, dateFrom);
      if (dateTo) query = query.lte('data_lancamento' as never, dateTo);
      const { data, error } = await query;
      if (error) {
        toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
        hasMore = false;
      } else {
        const rows = (data ?? []) as AIHRow[];
        allData = [...allData, ...rows];
        hasMore = rows.length === PAGE_SIZE;
      }
      page++;
    }

    setRecords(allData);
    setLoading(false);
  }, [dateFrom, dateTo, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('relatorios-aih-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aih_registros' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  // ── KPIs ──────────────────────────────────────────────────────
  const total = records.length;

  const totalFaturado = records.reduce((s, r) => {
    const v = r.total_final != null ? r.total_final : (r.total ?? 0);
    return s + v;
  }, 0);

  const totalOPME = records.reduce((s, r) => s + (r.valor_opme ?? 0), 0);
  const qtdComOPME = records.filter(r => r.valor_opme != null && r.valor_opme > 0).length;

  const comPendencia = records.filter(r => r.pendencia != null && r.pendencia.trim() !== '').length;

  const eletivos = records.filter(r => r.carater?.toUpperCase() === 'ELETIVO').length;
  const urgencia = records.filter(r => r.carater?.toUpperCase() === 'URGENCIA').length;
  const semCarater = total - eletivos - urgencia;

  const permList = records
    .filter(r => r.admissao && r.alta)
    .map(r => {
      const [ay, am, ad] = r.admissao!.split('-').map(Number);
      const [by, bm, bd] = r.alta!.split('-').map(Number);
      const dA = new Date(ay, am - 1, ad);
      const dB = new Date(by, bm - 1, bd);
      const diff = Math.round((dB.getTime() - dA.getTime()) / 86400000);
      return diff >= 0 ? diff : 0;
    });
  const avgPerm = permList.length
    ? (permList.reduce((a, b) => a + b, 0) / permList.length).toFixed(1)
    : '—';

  // ── Lançamentos por mês (data_lancamento) ────────────────────
  const lancMonthMap: Record<string, number> = {};
  records.forEach(r => {
    const row = r as AIHRow & { data_lancamento?: string | null };
    const dt = row.data_lancamento ?? r.created_at?.substring(0, 10);
    if (!dt) return;
    const [y, m] = dt.split('-');
    const key = `${y}-${m}`;
    lancMonthMap[key] = (lancMonthMap[key] ?? 0) + 1;
  });
  const byLancMonth = Object.entries(lancMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const [y, m] = key.split('-');
      return { name: `${m}/${y}`, count };
    });

  // ── Admissões por mês ────────────────────────────────────────
  const admMonthMap: Record<string, number> = {};
  records.forEach(r => {
    if (!r.admissao) return;
    const [y, m] = r.admissao.split('-');
    const key = `${y}-${m}`;
    admMonthMap[key] = (admMonthMap[key] ?? 0) + 1;
  });
  const byAdmMonth = Object.entries(admMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      const [y, m] = key.split('-');
      return { name: `${m}/${y}`, count };
    });

  // ── Por Clínica ──────────────────────────────────────────────
  const clinicaMap: Record<string, { count: number; total: number }> = {};
  records.forEach(r => {
    const c = r.clinica?.trim() || 'Não informado';
    if (!clinicaMap[c]) clinicaMap[c] = { count: 0, total: 0 };
    clinicaMap[c].count++;
    const v = r.total_final != null ? r.total_final : (r.total ?? 0);
    clinicaMap[c].total += v;
  });
  const byClinica = Object.entries(clinicaMap)
    .map(([name, v]) => ({ name, count: v.count, total: Math.round(v.total) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // ── Caráter pie ──────────────────────────────────────────────
  const caratData = [
    { name: 'Eletivo', value: eletivos },
    { name: 'Urgência', value: urgencia },
    ...(semCarater > 0 ? [{ name: 'Não informado', value: semCarater }] : []),
  ].filter(d => d.value > 0);

  // ── Top procedimentos ────────────────────────────────────────
  const procMap: Record<string, number> = {};
  records.forEach(r => {
    if (!r.procedimento?.trim()) return;
    procMap[r.procedimento.trim()] = (procMap[r.procedimento.trim()] ?? 0) + 1;
  });
  const topProc = Object.entries(procMap)
    .map(([proc, count]) => ({ proc, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Pendências ───────────────────────────────────────────────
  const pendMap: Record<string, number> = {};
  records.filter(r => r.pendencia?.trim()).forEach(r => {
    const key = r.pendencia!.substring(0, 40).trim();
    pendMap[key] = (pendMap[key] ?? 0) + 1;
  });
  const topPend = Object.entries(pendMap)
    .map(([pend, count]) => ({ pend, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ── Encerramento ─────────────────────────────────────────────
  const encMap: Record<string, number> = {};
  records.forEach(r => {
    if (!r.encerramento?.trim()) return;
    const key = r.encerramento.substring(0, 35).trim();
    encMap[key] = (encMap[key] ?? 0) + 1;
  });
  const byEnc = Object.entries(encMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // ── Corrigido ────────────────────────────────────────────────
  const corrigidoMap: Record<string, number> = {};
  records.forEach(r => {
    const key = r.corrigido?.trim() || null;
    if (key) {
      corrigidoMap[key] = (corrigidoMap[key] ?? 0) + 1;
    }
  });
  // Contar registros com pendência
  const totalComPendencia = records.filter(r => r.pendencia && r.pendencia.trim() !== '').length;
  if (totalComPendencia > 0) {
    corrigidoMap['Com Pendência'] = totalComPendencia;
  }
  const byCorrigido = Object.entries(corrigidoMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col h-full overflow-auto bg-muted/20">
      {/* Header + Filters */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Relatórios & Análises</span>
          <Badge variant="secondary" className="text-xs">{total} registros</Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Lançamento de:</Label>
            <Input type="date" className="h-8 text-xs w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">até:</Label>
            <Input type="date" className="h-8 text-xs w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo) && (
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Limpar
            </Button>
          )}
          <Button size="sm" variant="secondary" className="h-8" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Carregando relatório...
        </div>
      ) : (
        <div className="p-5 space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard label="Total AIH" value={total} icon={Users} color="bg-primary/10 text-primary" />
            <KPICard label="Faturamento" value={fmtShortCurrency(totalFaturado)} icon={DollarSign} color="bg-hospital-green/10 text-hospital-green" sub={fmtCurrency(totalFaturado)} />
            <KPICard label="OPME Total" value={fmtShortCurrency(totalOPME)} icon={TrendingUp} color="bg-hospital-amber/10 text-hospital-amber" sub={`${qtdComOPME} registros`} />
            <KPICard label="Com Pendência" value={comPendencia} icon={AlertCircle} color="bg-hospital-urgencia/10 text-hospital-urgencia" sub={`${total > 0 ? ((comPendencia / total) * 100).toFixed(1) : 0}% do total`} />
            <KPICard label="Eletivos" value={eletivos} icon={CheckCircle2} color="bg-hospital-eletivo/10 text-hospital-eletivo" sub={`${total > 0 ? ((eletivos / total) * 100).toFixed(1) : 0}% do total`} />
            <KPICard label="Perm. Média" value={avgPerm !== '—' ? `${avgPerm}d` : '—'} icon={Activity} color="bg-muted text-muted-foreground" sub="dias de internação" />
          </div>

          {/* Row 1: Lançamentos por mês + Admissões por mês */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-1">AIHs Lançadas por Mês</h3>
              <p className="text-xs text-muted-foreground mb-3">Quantidade de registros por data de lançamento</p>
              {byLancMonth.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={byLancMonth} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <Tooltip content={<TooltipQtd />} />
                    <Line type="monotone" dataKey="count" name="AIHs lançadas" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-1">Internações por Mês (Admissão)</h3>
              <p className="text-xs text-muted-foreground mb-3">Quantidade de admissões por mês</p>
              {byAdmMonth.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={byAdmMonth} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <Tooltip content={<TooltipQtd />} />
                    <Line type="monotone" dataKey="count" name="Admissões" stroke="hsl(var(--hospital-green))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--hospital-green))' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 2: Caráter + Corrigido */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">Caráter do Atendimento</h3>
              {caratData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={caratData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {caratData.map((_, index) => (
                          <Cell key={index} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number, n: string) => [`${v} AIH${v !== 1 ? 's' : ''}`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-1 flex-wrap">
                    {caratData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS_CHART[i % COLORS_CHART.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-bold text-foreground">{d.value}</span>
                        <span className="text-muted-foreground">({total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">Status de Correção (Corrigido)</h3>
              {byCorrigido.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={byCorrigido} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="name">
                        {byCorrigido.map((_, index) => (
                          <Cell key={index} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number, n: string) => [`${v} AIH${v !== 1 ? 's' : ''}`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-3 mt-1 flex-wrap">
                    {byCorrigido.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS_CHART[i % COLORS_CHART.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-bold text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 3: AIH por Clínica (quantidade) */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-1">Internações por Clínica</h3>
            <p className="text-xs text-muted-foreground mb-3">Quantidade de AIHs por clínica</p>
            {byClinica.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem dados no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byClinica} margin={{ top: 4, right: 16, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip content={<TooltipQtd />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name="Qtd. AIH" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    {byClinica.map((_, i) => (
                      <Cell key={i} fill={COLORS_CHART[i % COLORS_CHART.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Row 4: Faturamento por clínica + Top Procedimentos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-1">Faturamento por Clínica</h3>
              <p className="text-xs text-muted-foreground mb-3">Valor em R$ por clínica (total final)</p>
              {byClinica.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byClinica} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={65} />
                    <Tooltip content={<TooltipCurrency />} />
                    <Bar dataKey="total" name="Faturamento" fill="hsl(var(--hospital-green))" radius={[0, 4, 4, 0]}>
                      {byClinica.map((_, i) => (
                        <Cell key={i} fill={COLORS_CHART[i % COLORS_CHART.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-1">Top Procedimentos</h3>
              <p className="text-xs text-muted-foreground mb-3">Procedimentos mais frequentes por quantidade</p>
              {topProc.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProc} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 110 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <YAxis dataKey="proc" type="category" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={105} />
                    <Tooltip content={<TooltipFreq />} />
                    <Bar dataKey="count" name="Frequência" radius={[0, 4, 4, 0]}>
                      {topProc.map((_, index) => (
                        <Cell key={index} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Row 5: Pendências + Motivos de Encerramento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Principais Pendências
                <Badge variant="outline" className="ml-2 text-xs font-normal">{comPendencia} registros</Badge>
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Quantidade por tipo de pendência</p>
              {topPend.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Nenhuma pendência no período</div>
              ) : (
                <div className="space-y-2.5">
                  {topPend.map(({ pend, count }, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-foreground truncate" title={pend}>{pend}</p>
                          <span className="text-xs font-bold text-hospital-urgencia tabular-nums ml-2 flex-shrink-0">{count} AIH{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-hospital-urgencia/80"
                            style={{ width: `${(count / topPend[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-1">Motivos de Encerramento</h3>
              <p className="text-xs text-muted-foreground mb-3">Distribuição por tipo de encerramento</p>
              {byEnc.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={byEnc} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={85} />
                    <Tooltip content={<TooltipQtd />} />
                    <Bar dataKey="value" name="Qtd. AIH" radius={[0, 4, 4, 0]}>
                      {byEnc.map((_, i) => (
                        <Cell key={i} fill={COLORS_CHART[i % COLORS_CHART.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>


        </div>
      )}
    </div>
  );
}
