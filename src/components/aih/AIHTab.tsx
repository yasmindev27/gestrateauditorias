import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AIHForm } from '@/components/aih/AIHForm';
import { Plus, Pencil, Trash2, Search, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type AIHRow = Database['public']['Tables']['aih_registros']['Row'];

function permanencia(admissao: string | null, alta: string | null): number | null {
  if (!admissao || !alta) return null;
  const a = new Date(admissao);
  const b = new Date(alta);
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtCurrency(v: number | null): string {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function AIHTab() {
  const [records, setRecords] = useState<AIHRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [competenciaFilter, setCompetenciaFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AIHRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);

    let countQuery = supabase
      .from('aih_registros')
      .select('*', { count: 'exact', head: true });

    let query = supabase
      .from('aih_registros')
      .select('*')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      const filter = `aih.ilike.%${search}%,nome_paciente.ilike.%${search}%,procedimento.ilike.%${search}%,clinica.ilike.%${search}%`;
      countQuery = countQuery.or(filter);
      query = query.or(filter);
    }

    if (competenciaFilter.trim()) {
      countQuery = countQuery.ilike('competencia', `%${competenciaFilter.trim()}%`);
      query = query.ilike('competencia', `%${competenciaFilter.trim()}%`);
    }

    const [{ count }, { data, error }] = await Promise.all([countQuery, query.limit(200)]);

    if (error) {
      toast({ title: 'Erro ao carregar registros', description: error.message, variant: 'destructive' });
    } else {
      setRecords(data ?? []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [search, competenciaFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  // Realtime: atualiza lista quando novos registros são adicionados/editados/removidos
  useEffect(() => {
    const channel = supabase
      .channel('aih-tab-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aih_registros' }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Confirmar exclusão deste registro?')) return;
    setDeletingId(id);
    const { error } = await supabase.from('aih_registros').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registro excluído.' });
      load();
    }
    setDeletingId(null);
  };

  const openNew = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (row: AIHRow) => { setEditItem(row); setFormOpen(true); };

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Controle de AIH</span>
          <Badge variant="secondary" className="ml-1 text-xs">{totalCount} registros</Badge>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="Buscar AIH, paciente, procedimento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Input
            className="h-9 text-sm w-36"
            placeholder="Competência..."
            value={competenciaFilter}
            onChange={e => setCompetenciaFilter(e.target.value)}
          />
          <Button size="sm" variant="secondary" onClick={load} disabled={loading} title="Atualizar" className="shrink-0">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="w-4 h-4 mr-1" /> Novo
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto table-container">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Carregando...
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
            <FileSpreadsheet className="w-8 h-8 opacity-30" />
            <p className="text-sm">Nenhum registro encontrado.</p>
            <Button size="sm" onClick={openNew} className="mt-1">Adicionar primeiro registro</Button>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-hospital-header-bg text-primary-foreground">
                <th className="sticky left-0 z-20 bg-hospital-header-bg text-left px-2 py-2.5 font-semibold whitespace-nowrap border-r border-white/10 w-32">AIH</th>
                <th className="sticky left-32 z-20 bg-hospital-header-bg text-left px-2 py-2.5 font-semibold whitespace-nowrap border-r border-white/10 w-40">Paciente</th>
                {['Admissão', 'Alta', 'P.', 'Procedimento', 'Clínica', 'Caráter', 'Procedência', 'Encerramento', 'Pendência', 'Total Final', 'Corrig.'].map(h => (
                  <th key={h} className="text-left px-2 py-2.5 font-semibold whitespace-nowrap border-r border-white/10">{h}</th>
                ))}
                <th className="sticky right-0 z-20 bg-hospital-header-bg text-left px-2 py-2.5 font-semibold whitespace-nowrap w-20">Ações</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, i) => {
                const perm = permanencia(row.admissao, row.alta);
                const rowBg = i % 2 === 1 ? 'bg-hospital-row-alt' : 'bg-white';
                return (
                  <tr
                    key={row.id}
                    className={cn("border-b border-border transition-colors hover:bg-hospital-blue-light/50", rowBg)}
                  >
                    <td className={cn("sticky left-0 z-10 px-2 py-1.5 font-mono font-medium text-primary whitespace-nowrap border-r border-border", rowBg)}>{row.aih}</td>
                    <td className={cn("sticky left-32 z-10 px-2 py-1.5 whitespace-nowrap w-40 truncate border-r border-border", rowBg)} title={row.nome_paciente}>{row.nome_paciente}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap tabular-nums">{fmtDate(row.admissao)}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap tabular-nums">{fmtDate(row.alta)}</td>
                    <td className="px-2 py-1.5 text-center tabular-nums font-medium">
                      {perm !== null ? <span>{perm}</span> : '—'}
                    </td>
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">{row.procedimento ?? '—'}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.clinica ?? '—'}</td>
                    <td className="px-2 py-1.5">
                      {row.carater ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                          row.carater === 'URGENCIA' ? 'bg-hospital-urgencia/15 text-hospital-urgencia' : 'bg-hospital-eletivo/15 text-hospital-eletivo'
                        )}>{row.carater}</span>
                      ) : '—'}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.procedencia ?? '—'}</td>
                    <td className="px-2 py-1.5 max-w-[130px] truncate" title={row.encerramento ?? ''}>{row.encerramento ?? '—'}</td>
                    <td className="px-2 py-1.5 max-w-[140px] truncate" title={row.pendencia ?? ''}>{row.pendencia ?? '—'}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap tabular-nums text-right font-semibold text-primary">{fmtCurrency(row.total_final)}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      {row.corrigido ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium",
                          row.corrigido === 'SIM' ? 'bg-hospital-green/15 text-hospital-green' :
                          row.corrigido === 'FALTA' ? 'bg-hospital-amber/15 text-hospital-amber' :
                          'bg-muted text-muted-foreground'
                        )}>{row.corrigido}</span>
                      ) : '—'}
                    </td>
                    <td className={cn("sticky right-0 z-10 px-2 py-1.5 whitespace-nowrap border-l border-border", rowBg)}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors border border-primary/20"
                          title="Editar"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          disabled={deletingId === row.id}
                          className="p-1 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors border border-destructive/20"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AIHForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        editItem={editItem}
      />
    </div>
  );
}
