import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, RefreshCw, FileText, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type MovRow = Database['public']['Tables']['mov_doc_comp']['Row'];
type MovInsert = Database['public']['Tables']['mov_doc_comp']['Insert'];

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const emptyForm = (): MovInsert => ({
  data_entrada: new Date().toISOString().split('T')[0],
  qtd_aih: 0,
  qtd_saida: 0,
  data_devolucao: null,
  observacao: null,
});

interface MovFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editItem?: MovRow | null;
}

function MovForm({ open, onClose, onSaved, editItem }: MovFormProps) {
  const [form, setForm] = useState<MovInsert>(emptyForm());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editItem) {
      setForm({
        data_entrada: editItem.data_entrada,
        qtd_aih: editItem.qtd_aih,
        qtd_saida: editItem.qtd_saida,
        data_devolucao: editItem.data_devolucao,
        observacao: editItem.observacao,
      });
    } else {
      setForm(emptyForm());
    }
  }, [editItem, open]);

  const set = (field: keyof MovInsert, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.data_entrada) {
      toast({ title: 'Data de entrada obrigatória.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        const { error } = await supabase.from('mov_doc_comp').update(form).eq('id', editItem.id);
        if (error) throw error;
        toast({ title: 'Registro atualizado!' });
      } else {
        const { error } = await supabase.from('mov_doc_comp').insert(form);
        if (error) throw error;
        toast({ title: 'Registro salvo!' });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">{editItem ? 'Editar Movimentação' : 'Nova Movimentação'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data de Entrada *</Label>
            <Input type="date" value={form.data_entrada} onChange={e => set('data_entrada', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qtd. AIH Recebidas</Label>
            <Input type="number" min="0" value={form.qtd_aih} onChange={e => set('qtd_aih', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qtd. Saídas</Label>
            <Input type="number" min="0" value={form.qtd_saida} onChange={e => set('qtd_saida', parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data de Devolução</Label>
            <Input type="date" value={form.data_devolucao ?? ''} onChange={e => set('data_devolucao', e.target.value || null)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observação</Label>
            <Input value={form.observacao ?? ''} onChange={e => set('observacao', e.target.value || null)} placeholder="Observações..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? 'Salvando...' : editItem ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MovDocTab({ readOnly = false }: { readOnly?: boolean }) {
  const [records, setRecords] = useState<MovRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MovRow | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mov_doc_comp')
      .select('*')
      .order('data_entrada', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    } else {
      setRecords(data ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Confirmar exclusão?')) return;
    const { error } = await supabase.from('mov_doc_comp').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registro excluído.' });
      load();
    }
  };

  const totalEntradas = records.reduce((s, r) => s + r.qtd_aih, 0);
  const totalSaidas = records.reduce((s, r) => s + r.qtd_saida, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Mov. Doc. Comp. 01</span>
          <Badge variant="secondary" className="ml-1 text-xs">{records.length} lançamentos</Badge>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} title="Atualizar" className="h-9 w-9 flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
            <RefreshCw className={cn("w-4 h-4 text-gray-600", loading && "animate-spin")} />
          </button>
          {!readOnly && (
            <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1" /> Novo
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-muted/40 border-b border-border">
        <div className="bg-card rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-hospital-green/15 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-hospital-green" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Entradas</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{totalEntradas}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-hospital-urgencia/15 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-hospital-urgencia" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Saídas</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{totalSaidas}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={cn("text-xl font-bold tabular-nums", saldo > 0 ? "text-hospital-green" : "text-foreground")}>{saldo}</p>
          </div>
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
            <FileText className="w-8 h-8 opacity-30" />
            <p className="text-sm">Nenhum lançamento encontrado.</p>
            <Button size="sm" onClick={() => { setEditItem(null); setFormOpen(true); }}>Adicionar primeiro lançamento</Button>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-hospital-header-bg text-primary-foreground">
                {['Data de Entrada', 'Qtd. AIH Recebidas', 'Qtd. Saídas', 'Data de Devolução', 'Observação', ...(readOnly ? [] : ['Ações'])].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap border-r border-white/10 last:border-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((row, i) => (
                <tr key={row.id} className={cn(
                  "border-b border-border transition-colors hover:bg-hospital-blue-light/50",
                  i % 2 === 1 && "bg-hospital-row-alt"
                )}>
                  <td className="px-4 py-2.5 font-medium tabular-nums">{fmtDate(row.data_entrada)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-hospital-green">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {row.qtd_aih}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-hospital-urgencia">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {row.qtd_saida}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{fmtDate(row.data_devolucao)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[200px] truncate">{row.observacao ?? '—'}</td>
                  {!readOnly && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditItem(row); setFormOpen(true); }} className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors" title="Excluir">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <MovForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} editItem={editItem} />
    </div>
  );
}
