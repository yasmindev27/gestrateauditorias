import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProcedimentoAutocomplete } from '@/components/aih/ProcedimentoAutocomplete';
import { X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AIHRow = Database['public']['Tables']['aih_registros']['Row'];

// Tipo estendido para incluir data_lancamento (campo adicionado via migration)
interface AIHFormData {
  aih: string;
  nome_paciente: string;
  data_lancamento: string | null;
  competencia: string | null;
  admissao: string | null;
  alta: string | null;
  procedimento: string | null;
  clinica: string | null;
  carater: string | null;
  procedencia: string | null;
  encerramento: string | null;
  pendencia: string | null;
  subsequente: string | null;
  opme: string | null;
  valor_opme: number | null;
  total: number | null;
  troca_codigo: string | null;
  total_final: number | null;
  corrigido: string | null;
}

interface AIHFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editItem?: AIHRow | null;
}

const emptyForm = (): AIHFormData => ({
  aih: '',
  nome_paciente: '',
  data_lancamento: new Date().toISOString().split('T')[0],
  competencia: null,
  admissao: null,
  alta: null,
  procedimento: null,
  clinica: null,
  carater: null,
  procedencia: null,
  encerramento: null,
  pendencia: null,
  subsequente: null,
  opme: null,
  valor_opme: null,
  total: null,
  troca_codigo: null,
  total_final: null,
  corrigido: null,
});

function calcPermanencia(admissao: string | null, alta: string | null): number | null {
  if (!admissao || !alta) return null;
  const [ay, am, ad] = admissao.split('-').map(Number);
  const [by, bm, bd] = alta.split('-').map(Number);
  const dA = new Date(ay, am - 1, ad);
  const dB = new Date(by, bm - 1, bd);
  const diff = Math.round((dB.getTime() - dA.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

export function AIHForm({ open, onClose, onSaved, editItem }: AIHFormProps) {
  const [form, setForm] = useState<AIHFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editItem) {
      const row = editItem as AIHRow & { data_lancamento?: string | null; competencia?: string | null };
      setForm({
        aih: row.aih,
        nome_paciente: row.nome_paciente,
        data_lancamento: row.data_lancamento ?? null,
        competencia: row.competencia ?? null,
        admissao: row.admissao,
        alta: row.alta,
        procedimento: row.procedimento,
        clinica: row.clinica,
        carater: row.carater,
        procedencia: row.procedencia,
        encerramento: row.encerramento,
        pendencia: row.pendencia,
        subsequente: row.subsequente,
        opme: row.opme,
        valor_opme: row.valor_opme,
        total: row.total,
        troca_codigo: row.troca_codigo,
        total_final: row.total_final,
        corrigido: row.corrigido,
      });
    } else {
      setForm(emptyForm());
    }
  }, [editItem, open]);

  const permanencia = calcPermanencia(form.admissao, form.alta);

  const set = <K extends keyof AIHFormData>(field: K, value: AIHFormData[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.aih.trim() || !form.nome_paciente.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'AIH e Nome do Paciente são obrigatórios.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...form };
      if (editItem) {
        const { error } = await supabase.from('aih_registros').update(payload).eq('id', editItem.id);
        if (error) throw error;
        toast({ title: 'Registro atualizado com sucesso!' });
      } else {
        const { error } = await supabase.from('aih_registros').insert(payload);
        if (error) throw error;
        toast({ title: 'Registro salvo com sucesso!' });
        if (form.procedimento) {
          await supabase.from('procedimento_codigos')
            .upsert({ codigo: form.procedimento }, { onConflict: 'codigo', ignoreDuplicates: false });
        }
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar';
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = "space-y-1";
  const labelClass = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary text-lg font-semibold">
            {editItem ? 'Editar Registro AIH' : 'Novo Registro AIH'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">

          {/* Data de Lançamento e Competência */}
          <div className={`${fieldClass} pb-3 border-b border-border`}>
            <Label className={labelClass}>Data de Lançamento</Label>
            <Input
              type="date"
              value={form.data_lancamento ?? ''}
              onChange={e => set('data_lancamento', e.target.value || null)}
            />
          </div>
          <div className={`${fieldClass} pb-3 border-b border-border`}>
            <Label className={labelClass}>Competência</Label>
            <Input
              value={form.competencia ?? ''}
              onChange={e => set('competencia', e.target.value || null)}
              placeholder="Ex: 02/2026, ABR/2025"
            />
          </div>

          {/* AIH */}
          <div className={fieldClass}>
            <Label className={labelClass}>AIH *</Label>
            <Input value={form.aih} onChange={e => set('aih', e.target.value)} placeholder="Número da AIH" />
          </div>

          {/* Nome do Paciente */}
          <div className={fieldClass}>
            <Label className={labelClass}>Nome do Paciente *</Label>
            <Input value={form.nome_paciente} onChange={e => set('nome_paciente', e.target.value)} placeholder="Nome completo" />
          </div>

          {/* Admissão */}
          <div className={fieldClass}>
            <Label className={labelClass}>Admissão</Label>
            <Input type="date" value={form.admissao ?? ''} onChange={e => set('admissao', e.target.value || null)} />
          </div>

          {/* Alta */}
          <div className={fieldClass}>
            <Label className={labelClass}>Alta</Label>
            <Input type="date" value={form.alta ?? ''} onChange={e => set('alta', e.target.value || null)} />
          </div>

          {/* Permanência (calculado) */}
          <div className={fieldClass}>
            <Label className={labelClass}>Permanência (dias)</Label>
            <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted text-sm font-medium text-foreground">
              {permanencia !== null ? `${permanencia} dia${permanencia !== 1 ? 's' : ''}` : '—'}
            </div>
          </div>

          {/* Procedimento */}
          <div className={fieldClass}>
            <Label className={labelClass}>Procedimento</Label>
            <ProcedimentoAutocomplete
              value={form.procedimento ?? ''}
              onChange={v => set('procedimento', v || null)}
              placeholder="Código do procedimento"
            />
          </div>

          {/* Clínica */}
          <div className={fieldClass}>
            <Label className={labelClass}>Clínica</Label>
            <Input value={form.clinica ?? ''} onChange={e => set('clinica', e.target.value || null)} placeholder="Clínica" />
          </div>

          {/* Caráter */}
          <div className={fieldClass}>
            <Label className={labelClass}>Caráter</Label>
            <Select value={form.carater ?? ''} onValueChange={v => set('carater', v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ELETIVO">Eletivo</SelectItem>
                <SelectItem value="URGENCIA">Urgência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Procedência */}
          <div className={fieldClass}>
            <Label className={labelClass}>Procedência</Label>
            <Input value={form.procedencia ?? ''} onChange={e => set('procedencia', e.target.value || null)} placeholder="Cidade/Município" />
          </div>

          {/* Encerramento */}
          <div className={fieldClass}>
            <Label className={labelClass}>Encerramento</Label>
            <Input value={form.encerramento ?? ''} onChange={e => set('encerramento', e.target.value || null)} placeholder="Motivo de encerramento" />
          </div>

          {/* Pendência */}
          <div className={`${fieldClass} col-span-2`}>
            <Label className={labelClass}>Pendência</Label>
            <Input value={form.pendencia ?? ''} onChange={e => set('pendencia', e.target.value || null)} placeholder="Pendências" />
          </div>

          {/* Subsequente */}
          <div className={fieldClass}>
            <Label className={labelClass}>Subsequente</Label>
            <Input value={form.subsequente ?? ''} onChange={e => set('subsequente', e.target.value || null)} placeholder="Subsequente" />
          </div>

          {/* OPME */}
          <div className={fieldClass}>
            <Label className={labelClass}>OPME</Label>
            <Input value={form.opme ?? ''} onChange={e => set('opme', e.target.value || null)} placeholder="Material OPME" />
          </div>

          {/* Valor OPME */}
          <div className={fieldClass}>
            <Label className={labelClass}>Valor OPME (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.valor_opme ?? ''}
              onChange={e => set('valor_opme', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0,00"
            />
          </div>

          {/* Total */}
          <div className={fieldClass}>
            <Label className={labelClass}>Total (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.total ?? ''}
              onChange={e => set('total', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0,00"
            />
          </div>

          {/* Troca de Código */}
          <div className={fieldClass}>
            <Label className={labelClass}>Troca de Código / Código Atual</Label>
            <Input value={form.troca_codigo ?? ''} onChange={e => set('troca_codigo', e.target.value || null)} placeholder="Código novo" />
          </div>

          {/* Total Final */}
          <div className={fieldClass}>
            <Label className={labelClass}>Total Final (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.total_final ?? ''}
              onChange={e => set('total_final', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0,00"
            />
          </div>

          {/* Corrigido */}
          <div className={fieldClass}>
            <Label className={labelClass}>Corrigido</Label>
            <Select value={form.corrigido ?? ''} onValueChange={v => set('corrigido', v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIM">SIM</SelectItem>
                <SelectItem value="FALTA">FALTA</SelectItem>
                <SelectItem value="NAO">NÃO</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Salvando...' : editItem ? 'Salvar Alterações' : 'Salvar Registro'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
