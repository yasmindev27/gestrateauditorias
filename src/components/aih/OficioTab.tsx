import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, FileText, Download, Printer, FileSpreadsheet, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, HeadingLevel, ShadingType,
  Header, Footer, PageNumber,
} from 'docx';
import type { Database } from '@/integrations/supabase/types';
import headerLogo from '@/assets/header-logo.png';

type AIHRow = Database['public']['Tables']['aih_registros']['Row'];

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface OficioConfig {
  numero: string;
  destinatario: string;
  cargo: string;
  assunto: string;
  observacoes: string;
}

function calcStats(records: AIHRow[]) {
  const total = records.length;
  const eletivos = records.filter(r => r.carater?.toUpperCase() === 'ELETIVO').length;
  const urgencia = records.filter(r => ['URGENCIA', 'URGÊNCIA'].includes(r.carater?.toUpperCase() ?? '')).length;
  const subsequentes = records.filter(r => r.subsequente?.trim()).length;

  const totalFaturadoInicial = records.reduce((s, r) => s + (r.total ?? 0), 0);
  const totalFaturadoFinal = records.reduce((s, r) => s + (r.total_final != null ? r.total_final : (r.total ?? 0)), 0);
  const totalOPME = records.reduce((s, r) => s + (r.valor_opme ?? 0), 0);
  const comPendencia = records.filter(r => r.pendencia?.trim()).length;
  const comCorrecao = records.filter(r => r.corrigido?.toUpperCase() === 'SIM').length;
  const falta = records.filter(r => r.corrigido?.toUpperCase() === 'FALTA').length;

  const clinicaMap: Record<string, number> = {};
  records.forEach(r => {
    const c = r.clinica?.trim() || 'Não informado';
    clinicaMap[c] = (clinicaMap[c] ?? 0) + 1;
  });
  const byClinica = Object.entries(clinicaMap).sort((a, b) => b[1] - a[1]);

  const pendMap: Record<string, number> = {};
  records.filter(r => r.pendencia?.trim()).forEach(r => {
    const key = r.pendencia!.trim();
    pendMap[key] = (pendMap[key] ?? 0) + 1;
  });
  const topPend = Object.entries(pendMap).sort((a, b) => b[1] - a[1]);

  const procMap: Record<string, number> = {};
  records.forEach(r => {
    if (!r.procedimento?.trim()) return;
    procMap[r.procedimento.trim()] = (procMap[r.procedimento.trim()] ?? 0) + 1;
  });
  const topProc = Object.entries(procMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const encMap: Record<string, number> = {};
  records.forEach(r => {
    if (!r.encerramento?.trim()) return;
    encMap[r.encerramento.trim()] = (encMap[r.encerramento.trim()] ?? 0) + 1;
  });
  const byEnc = Object.entries(encMap).sort((a, b) => b[1] - a[1]);

  const permList = records
    .filter(r => r.admissao && r.alta)
    .map(r => {
      const dA = new Date(r.admissao!);
      const dB = new Date(r.alta!);
      const diff = Math.round((dB.getTime() - dA.getTime()) / 86400000);
      return diff >= 0 ? diff : 0;
    });
  const avgPerm = permList.length
    ? (permList.reduce((a, b) => a + b, 0) / permList.length).toFixed(1)
    : '—';

  const monthMap: Record<string, number> = {};
  records.forEach(r => {
    const dt = r.data_lancamento ?? r.created_at?.substring(0, 10);
    if (!dt) return;
    const [y, m] = dt.split('-');
    const label = `${m}/${y}`;
    monthMap[label] = (monthMap[label] ?? 0) + 1;
  });
  const byMonth = Object.entries(monthMap).sort(([a], [b]) => {
    const [am, ay] = a.split('/');
    const [bm, by] = b.split('/');
    return `${ay}-${am}`.localeCompare(`${by}-${bm}`);
  });

  // Nova Serrana vs outros municípios
  const novaSerrana = records.filter(r => r.procedencia?.toUpperCase().includes('NOVA SERRANA')).length;
  const outros = records.filter(r => r.procedencia?.trim() && !r.procedencia.toUpperCase().includes('NOVA SERRANA')).length;
  const semProcedencia = total - novaSerrana - outros;

  return {
    total, eletivos, urgencia, subsequentes,
    totalFaturadoInicial, totalFaturadoFinal, totalOPME,
    comPendencia, comCorrecao, falta,
    byClinica, topPend, topProc, byEnc, avgPerm, byMonth,
    novaSerrana, outros, semProcedencia,
  };
}

// ─── Preview Component ────────────────────────────────────────
function OficioPreview({ records, dateFrom, dateTo, config }: {
  records: AIHRow[];
  dateFrom: string;
  dateTo: string;
  config: OficioConfig;
}) {
  const stats = calcStats(records);
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const periodo = dateFrom && dateTo
    ? `${fmtDate(dateFrom)} a ${fmtDate(dateTo)}`
    : dateFrom ? `a partir de ${fmtDate(dateFrom)}`
    : dateTo ? `até ${fmtDate(dateTo)}`
    : 'Todo o período';

  const summaryRows = [
    ['Total de AIHs auditadas', String(stats.total)],
    ['Caráter Eletivo', `${stats.eletivos} (${stats.total > 0 ? ((stats.eletivos / stats.total) * 100).toFixed(1) : 0}%)`],
    ['Caráter Urgência', `${stats.urgencia} (${stats.total > 0 ? ((stats.urgencia / stats.total) * 100).toFixed(1) : 0}%)`],
    ['Internações Subsequentes', String(stats.subsequentes)],
    ['Faturamento Inicial', fmtCurrency(stats.totalFaturadoInicial)],
    ['Faturamento Final (pós auditoria)', fmtCurrency(stats.totalFaturadoFinal)],
    ['OPME Total', fmtCurrency(stats.totalOPME)],
    ['Permanência Média', `${stats.avgPerm} dias`],
    ['Contas com Pendências', `${stats.comPendencia} (${stats.total > 0 ? ((stats.comPendencia / stats.total) * 100).toFixed(1) : 0}%)`],
    ['Contas Corrigidas (SIM)', String(stats.comCorrecao)],
    ['Aguardando Correção (FALTA)', String(stats.falta)],
  ];

  return (
    <div id="oficio-preview" className="bg-white text-gray-900 font-serif text-sm leading-relaxed print:text-xs">
      {/* Cabeçalho */}
      <div className="border-b-2 border-gray-700 pb-3 mb-5">
        <img src={headerLogo} alt="Cabeçalho Prefeitura" className="w-full max-h-28 object-contain object-left" />
      </div>

      {/* Número do ofício e data */}
      <div className="text-right mb-3 text-xs text-gray-600">
        {config.numero && <p>Ofício nº {config.numero}</p>}
        <p>Nova Serrana, {today}</p>
      </div>

      {/* Destinatário */}
      <div className="mb-5">
        <p>À</p>
        <p className="font-semibold">{config.destinatario || 'Superintendente da Regulação da Secretaria Municipal de Nova Serrana'}</p>
        <p className="italic">{config.cargo || 'Sra. Kariny da Conceição Campos Alves'}</p>
      </div>

      <p className="font-bold underline mb-5">
        Assunto: {config.assunto || `Relatório de Auditoria SUS — ${periodo}`}
      </p>

      <p className="mb-4">Prezada Senhora,</p>

      <p className="mb-4 text-justify">
        Viemos, por meio deste, apresentar informações acerca da auditoria realizada no período de <strong>{periodo}</strong>, compreendendo <strong>{stats.total} contas</strong> auditadas, sendo <strong>{stats.eletivos} eletivas</strong> e <strong>{stats.urgencia} de urgência</strong>{stats.subsequentes > 0 ? `, com ${stats.subsequentes} internações subsequentes` : ''}.
      </p>

      {/* Seção 1 */}
      <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
        1. RESUMO DO PERÍODO AUDITADO
      </h2>
      <table className="w-full border-collapse mb-5 text-xs">
        <tbody>
          {summaryRows.map(([label, value], i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="border border-gray-300 px-3 py-1.5 font-medium w-72">{label}</td>
              <td className="border border-gray-300 px-3 py-1.5 tabular-nums">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Seção 2 */}
      <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
        2. DISTRIBUIÇÃO POR ESPECIALIDADE / CLÍNICA
      </h2>
      <table className="w-full border-collapse mb-5 text-xs">
        <thead>
          <tr className="bg-blue-50">
            <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Clínica / Especialidade</th>
            <th className="border border-gray-300 px-3 py-1.5 text-right font-semibold w-20">Qtd. AIH</th>
            <th className="border border-gray-300 px-3 py-1.5 text-right font-semibold w-16">%</th>
          </tr>
        </thead>
        <tbody>
          {stats.byClinica.map(([name, count], i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-3 py-1.5">{name}</td>
              <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums">{count}</td>
              <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums">{stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%</td>
            </tr>
          ))}
          <tr className="bg-blue-50 font-bold">
            <td className="border border-gray-300 px-3 py-1.5">TOTAL</td>
            <td className="border border-gray-300 px-3 py-1.5 text-right">{stats.total}</td>
            <td className="border border-gray-300 px-3 py-1.5 text-right">100%</td>
          </tr>
        </tbody>
      </table>

      {/* Seção 3 */}
      <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
        3. DISTRIBUIÇÃO POR MÊS DE LANÇAMENTO
      </h2>
      <table className="w-full border-collapse mb-5 text-xs">
        <thead>
          <tr className="bg-blue-50">
            <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Mês/Ano</th>
            <th className="border border-gray-300 px-3 py-1.5 text-right font-semibold w-24">Qtd. AIH</th>
          </tr>
        </thead>
        <tbody>
          {stats.byMonth.map(([month, count], i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-3 py-1.5">{month}</td>
              <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums">{count}</td>
            </tr>
          ))}
          <tr className="bg-blue-50 font-bold">
            <td className="border border-gray-300 px-3 py-1.5">TOTAL</td>
            <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums">{stats.total}</td>
          </tr>
        </tbody>
      </table>

      {/* Seção 4 – Procedência */}
      <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
        4. DISTRIBUIÇÃO POR MUNICÍPIO DE PROCEDÊNCIA
      </h2>
      <table className="w-full border-collapse mb-5 text-xs">
        <thead>
          <tr className="bg-blue-50">
            <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Município</th>
            <th className="border border-gray-300 px-3 py-1.5 text-right font-semibold w-20">Qtd.</th>
            <th className="border border-gray-300 px-3 py-1.5 text-right font-semibold w-16">%</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Nova Serrana', stats.novaSerrana],
            ['Outros Municípios', stats.outros],
            ...(stats.semProcedencia > 0 ? [['Não informado', stats.semProcedencia]] : []),
          ].map(([name, count], i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-3 py-1.5">{name}</td>
              <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums">{count}</td>
              <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums">{stats.total > 0 ? (((count as number) / stats.total) * 100).toFixed(1) : 0}%</td>
            </tr>
          ))}
          <tr className="bg-blue-50 font-bold">
            <td className="border border-gray-300 px-3 py-1.5">TOTAL</td>
            <td className="border border-gray-300 px-3 py-1.5 text-right">{stats.total}</td>
            <td className="border border-gray-300 px-3 py-1.5 text-right">100%</td>
          </tr>
        </tbody>
      </table>

      {/* Seção 5 – Pendências */}
      {stats.topPend.length > 0 && (
        <>
          <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
            5. PRINCIPAIS INCONFORMIDADES IDENTIFICADAS
          </h2>
          <table className="w-full border-collapse mb-5 text-xs">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Tipo de Pendência</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right font-semibold w-20">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              {stats.topPend.map(([pend, count], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-1.5">{pend}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Seção 6 – Procedimentos */}
      {stats.topProc.length > 0 && (
        <>
          <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
            6. PROCEDIMENTOS MAIS FREQUENTES
          </h2>
          <table className="w-full border-collapse mb-5 text-xs">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Procedimento</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right font-semibold w-20">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProc.map(([proc, count], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-1.5 font-mono text-xs">{proc}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Seção 7 – Motivos de Encerramento */}
      {stats.byEnc.length > 0 && (
        <>
          <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
            7. MOTIVOS DE ENCERRAMENTO
          </h2>
          <table className="w-full border-collapse mb-5 text-xs">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-3 py-1.5 text-left font-semibold">Motivo</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right font-semibold w-20">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              {stats.byEnc.map(([name, count], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-1.5">{name}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Seção 8 – Faturamento */}
      <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
        8. FATURAMENTO
      </h2>
      <p className="mb-5 text-justify text-xs">
        O faturamento inicial totalizou <strong>{fmtCurrency(stats.totalFaturadoInicial)}</strong>. Após a auditoria, o valor final apurado foi de <strong>{fmtCurrency(stats.totalFaturadoFinal)}</strong>.
        {stats.totalOPME > 0 && ` O total de OPME computado foi de ${fmtCurrency(stats.totalOPME)}.`}
      </p>

      {/* Seção 9 – Prontuário */}
      <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
        9. IMPORTÂNCIA DO PRONTUÁRIO COMPLETO
      </h2>
      <p className="mb-2 text-justify text-xs">
        Aproveitamos a oportunidade para reiterar a importância de um prontuário completo, contendo:
      </p>
      <ul className="list-disc ml-6 mb-3 space-y-0.5 text-xs">
        {[
          'Identificação do paciente e assinatura deste ou de seu responsável;',
          'Assinatura de todos os profissionais envolvidos na assistência;',
          'Evoluções e prescrições realizadas diariamente;',
          'Documentação completa de OPME (nota fiscal e RX de conferência);',
          'Laudos dos exames realizados (inclusive os disponibilizados virtualmente);',
          'Pedido e laudo anatomopatológico;',
          'Registro no SUSFÁCIL;',
          'Laudo de mudança de procedimento, quando aplicável.',
        ].map((item, i) => <li key={i}>{item}</li>)}
      </ul>
      <p className="mb-5 text-justify text-xs">
        Ressaltamos que o prontuário médico é documento legal e deve permanecer arquivado na instituição por, no mínimo, 20 anos, conforme a Lei nº 13.787/2018, sendo obrigatória a manutenção de todos os seus componentes de forma íntegra.
      </p>

      {/* Observações adicionais */}
      {config.observacoes && (
        <>
          <h2 className="font-bold text-sm bg-gray-100 px-2 py-1 border-l-4 border-blue-700 mb-3 mt-5">
            10. OBSERVAÇÕES ADICIONAIS
          </h2>
          <p className="mb-5 text-justify text-xs whitespace-pre-line">{config.observacoes}</p>
        </>
      )}

      <p className="mb-6 text-xs">Colocamo-nos à disposição para quaisquer esclarecimentos.</p>
      <p className="mb-8 text-xs">Atenciosamente,</p>

      {/* Assinaturas */}
      <div className="grid grid-cols-2 gap-12 mt-4 text-xs">
        <div className="border-t border-gray-500 pt-2">
          <p className="font-bold">Dra. Isabela Corgosinho</p>
          <p>CRM MG73530</p>
          <p>Auditora Médica</p>
          <p>Secretaria Municipal de Saúde de Nova Serrana</p>
        </div>
        <div className="border-t border-gray-500 pt-2">
          <p className="font-bold">Luiza Figueiredo</p>
          <p>COREN MG 717844</p>
          <p>Enfermeira Auditora</p>
          <p>Secretaria Municipal de Saúde de Nova Serrana</p>
        </div>
      </div>

      {/* Rodapé */}
      <div className="border-t border-gray-300 mt-8 pt-2 text-center text-xs text-gray-500">
        <p>Secretaria Municipal de Saúde</p>
        <p>Avenida Benjamim Martins do Espírito Santo Nº 2112 - Bairro Park Dona Gumercinda Martins - (37) 3225-8700</p>
        <p>secretariadesaude@novaserrana.mg.gov.br</p>
      </div>
    </div>
  );
}

// ─── Export to Word ───────────────────────────────────────────
async function exportToWord(records: AIHRow[], dateFrom: string, dateTo: string, config: OficioConfig) {
  const stats = calcStats(records);
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const periodo = dateFrom && dateTo
    ? `${fmtDate(dateFrom)} a ${fmtDate(dateTo)}`
    : dateFrom ? `a partir de ${fmtDate(dateFrom)}`
    : dateTo ? `até ${fmtDate(dateTo)}`
    : 'Todo o período';

  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const cellPad = { top: 60, bottom: 60, left: 100, right: 100 };
  const headerFill = { fill: 'D5E8F0', type: ShadingType.CLEAR };
  const altFill = { fill: 'F5F5F5', type: ShadingType.CLEAR };

  function makeCell(text: string, opts?: { bold?: boolean; shade?: typeof headerFill; align?: typeof AlignmentType.RIGHT }) {
    return new TableCell({
      borders,
      shading: opts?.shade,
      margins: cellPad,
      children: [new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        children: [new TextRun({ text, bold: opts?.bold ?? false, size: 18, font: 'Arial' })]
      })]
    });
  }

  function sectionHeading(text: string) {
    return new Paragraph({
      spacing: { before: 280, after: 100 },
      shading: { fill: 'EEF3F8', type: ShadingType.CLEAR },
      border: { left: { style: BorderStyle.SINGLE, size: 20, color: '1B4F8A', space: 5 } },
      indent: { left: 140 },
      children: [new TextRun({ text, bold: true, size: 20, color: '1B4F8A', font: 'Arial' })]
    });
  }

  // Fetch logo for Word
  let logoData: ArrayBuffer | undefined;
  try {
    const resp = await fetch(headerLogo);
    logoData = await resp.arrayBuffer();
  } catch {
    logoData = undefined;
  }

  const summaryRows = [
    ['Total de AIHs auditadas', String(stats.total)],
    ['Caráter Eletivo', `${stats.eletivos} (${stats.total > 0 ? ((stats.eletivos / stats.total) * 100).toFixed(1) : 0}%)`],
    ['Caráter Urgência', `${stats.urgencia} (${stats.total > 0 ? ((stats.urgencia / stats.total) * 100).toFixed(1) : 0}%)`],
    ['Internações Subsequentes', String(stats.subsequentes)],
    ['Faturamento Inicial', fmtCurrency(stats.totalFaturadoInicial)],
    ['Faturamento Final (pós auditoria)', fmtCurrency(stats.totalFaturadoFinal)],
    ['OPME Total', fmtCurrency(stats.totalOPME)],
    ['Permanência Média', `${stats.avgPerm} dias`],
    ['Contas com Pendências', `${stats.comPendencia} (${stats.total > 0 ? ((stats.comPendencia / stats.total) * 100).toFixed(1) : 0}%)`],
    ['Contas Corrigidas (SIM)', String(stats.comCorrecao)],
    ['Aguardando Correção (FALTA)', String(stats.falta)],
  ];

  const headerChildren: Paragraph[] = [];
  if (logoData) {
    headerChildren.push(new Paragraph({
      children: [new (await import('docx')).ImageRun({
        type: 'png',
        data: logoData,
        transformation: { width: 500, height: 80 },
        altText: { title: 'Logo', description: 'Logo Prefeitura', name: 'Logo' },
      })]
    }));
  }
  headerChildren.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1B4F8A', space: 2 } },
    children: [new TextRun({ text: '', size: 4 })]
  }));

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        }
      },
      headers: { default: new Header({ children: headerChildren }) },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA', space: 2 } },
            children: [
              new TextRun({ text: 'Secretaria Municipal de Saúde — Av. Benjamim Martins do Espírito Santo, 2112 — (37) 3225-8700    Pág. ', size: 16, color: '888888', font: 'Arial' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888', font: 'Arial' }),
            ]
          })]
        })
      },
      children: [
        // Número do ofício + data
        ...(config.numero ? [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 60 },
          children: [new TextRun({ text: `Ofício nº ${config.numero}`, size: 18, font: 'Arial' })]
        })] : []),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 280 },
          children: [new TextRun({ text: `Nova Serrana, ${today}`, size: 18, color: '555555', font: 'Arial' })]
        }),
        // Destinatário
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'À', size: 20, font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: config.destinatario || 'Superintendente da Regulação da Secretaria Municipal de Nova Serrana', bold: true, size: 20, font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 280 }, children: [new TextRun({ text: config.cargo || 'Sra. Kariny da Conceição Campos Alves', italics: true, size: 20, font: 'Arial' })] }),
        // Assunto
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: `Assunto: ${config.assunto || `Relatório de Auditoria SUS — ${periodo}`}`, bold: true, underline: {}, size: 20, font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 220 }, children: [new TextRun({ text: 'Prezada Senhora,', size: 20, font: 'Arial' })] }),
        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: `Viemos, por meio deste, apresentar informações acerca da auditoria realizada no período de ${periodo}, compreendendo ${stats.total} contas auditadas, sendo ${stats.eletivos} eletivas e ${stats.urgencia} de urgência${stats.subsequentes > 0 ? `, com ${stats.subsequentes} internações subsequentes` : ''}.`, size: 20, font: 'Arial' })]
        }),

        // 1. Resumo
        sectionHeading('1. RESUMO DO PERÍODO AUDITADO'),
        new Table({
          width: { size: 9638, type: WidthType.DXA },
          columnWidths: [5200, 4438],
          rows: summaryRows.map(([label, value], i) => new TableRow({
            children: [
              makeCell(label, { bold: true, shade: i % 2 !== 0 ? altFill : undefined }),
              makeCell(value, { shade: i % 2 !== 0 ? altFill : undefined }),
            ]
          }))
        }),

        // 2. Clínica
        sectionHeading('2. DISTRIBUIÇÃO POR ESPECIALIDADE / CLÍNICA'),
        new Table({
          width: { size: 9638, type: WidthType.DXA },
          columnWidths: [5638, 2000, 2000],
          rows: [
            new TableRow({ children: ['Clínica / Especialidade', 'Qtd. AIH', '%'].map(h => makeCell(h, { bold: true, shade: headerFill })) }),
            ...stats.byClinica.map(([name, count], i) => new TableRow({
              children: [
                makeCell(name, { shade: i % 2 !== 0 ? altFill : undefined }),
                makeCell(String(count), { shade: i % 2 !== 0 ? altFill : undefined }),
                makeCell(`${stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%`, { shade: i % 2 !== 0 ? altFill : undefined }),
              ]
            })),
            new TableRow({ children: [makeCell('TOTAL', { bold: true, shade: headerFill }), makeCell(String(stats.total), { bold: true, shade: headerFill }), makeCell('100%', { bold: true, shade: headerFill })] }),
          ]
        }),

        // 3. Mês de lançamento
        sectionHeading('3. DISTRIBUIÇÃO POR MÊS DE LANÇAMENTO'),
        new Table({
          width: { size: 9638, type: WidthType.DXA },
          columnWidths: [7638, 2000],
          rows: [
            new TableRow({ children: ['Mês/Ano', 'Qtd. AIH'].map(h => makeCell(h, { bold: true, shade: headerFill })) }),
            ...stats.byMonth.map(([month, count], i) => new TableRow({
              children: [makeCell(month, { shade: i % 2 !== 0 ? altFill : undefined }), makeCell(String(count), { shade: i % 2 !== 0 ? altFill : undefined })]
            })),
            new TableRow({ children: [makeCell('TOTAL', { bold: true, shade: headerFill }), makeCell(String(stats.total), { bold: true, shade: headerFill })] }),
          ]
        }),

        // 4. Procedência
        sectionHeading('4. DISTRIBUIÇÃO POR MUNICÍPIO DE PROCEDÊNCIA'),
        new Table({
          width: { size: 9638, type: WidthType.DXA },
          columnWidths: [5638, 2000, 2000],
          rows: [
            new TableRow({ children: ['Município', 'Qtd.', '%'].map(h => makeCell(h, { bold: true, shade: headerFill })) }),
            ...([
              ['Nova Serrana', stats.novaSerrana],
              ['Outros Municípios', stats.outros],
              ...(stats.semProcedencia > 0 ? [['Não informado', stats.semProcedencia]] : []),
            ] as [string, number][]).map(([name, count], i) => new TableRow({
              children: [
                makeCell(name, { shade: i % 2 !== 0 ? altFill : undefined }),
                makeCell(String(count), { shade: i % 2 !== 0 ? altFill : undefined }),
                makeCell(`${stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%`, { shade: i % 2 !== 0 ? altFill : undefined }),
              ]
            })),
            new TableRow({ children: [makeCell('TOTAL', { bold: true, shade: headerFill }), makeCell(String(stats.total), { bold: true, shade: headerFill }), makeCell('100%', { bold: true, shade: headerFill })] }),
          ]
        }),

        // 5. Pendências
        ...(stats.topPend.length > 0 ? [
          sectionHeading('5. PRINCIPAIS INCONFORMIDADES IDENTIFICADAS'),
          new Table({
            width: { size: 9638, type: WidthType.DXA },
            columnWidths: [7638, 2000],
            rows: [
              new TableRow({ children: ['Tipo de Pendência', 'Qtd.'].map(h => makeCell(h, { bold: true, shade: headerFill })) }),
              ...stats.topPend.map(([pend, count], i) => new TableRow({
                children: [makeCell(pend, { shade: i % 2 !== 0 ? altFill : undefined }), makeCell(String(count), { shade: i % 2 !== 0 ? altFill : undefined })]
              }))
            ]
          }),
        ] : []),

        // 6. Procedimentos
        ...(stats.topProc.length > 0 ? [
          sectionHeading('6. PROCEDIMENTOS MAIS FREQUENTES'),
          new Table({
            width: { size: 9638, type: WidthType.DXA },
            columnWidths: [7638, 2000],
            rows: [
              new TableRow({ children: ['Procedimento', 'Qtd.'].map(h => makeCell(h, { bold: true, shade: headerFill })) }),
              ...stats.topProc.map(([proc, count], i) => new TableRow({
                children: [makeCell(proc, { shade: i % 2 !== 0 ? altFill : undefined }), makeCell(String(count), { shade: i % 2 !== 0 ? altFill : undefined })]
              }))
            ]
          }),
        ] : []),

        // 7. Encerramento
        ...(stats.byEnc.length > 0 ? [
          sectionHeading('7. MOTIVOS DE ENCERRAMENTO'),
          new Table({
            width: { size: 9638, type: WidthType.DXA },
            columnWidths: [7638, 2000],
            rows: [
              new TableRow({ children: ['Motivo', 'Qtd.'].map(h => makeCell(h, { bold: true, shade: headerFill })) }),
              ...stats.byEnc.map(([name, count], i) => new TableRow({
                children: [makeCell(name, { shade: i % 2 !== 0 ? altFill : undefined }), makeCell(String(count), { shade: i % 2 !== 0 ? altFill : undefined })]
              }))
            ]
          }),
        ] : []),

        // 8. Faturamento
        sectionHeading('8. FATURAMENTO'),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: `O faturamento inicial totalizou ${fmtCurrency(stats.totalFaturadoInicial)}. Após a auditoria, o valor final apurado foi de ${fmtCurrency(stats.totalFaturadoFinal)}.${stats.totalOPME > 0 ? ` O total de OPME computado foi de ${fmtCurrency(stats.totalOPME)}.` : ''}`, size: 20, font: 'Arial' })]
        }),

        // 9. Prontuário
        sectionHeading('9. IMPORTÂNCIA DO PRONTUÁRIO COMPLETO'),
        new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Aproveitamos a oportunidade para reiterar a importância de um prontuário completo, contendo:', size: 20, font: 'Arial' })] }),
        ...[
          'Identificação do paciente e assinatura deste ou de seu responsável;',
          'Assinatura de todos os profissionais envolvidos na assistência;',
          'Evoluções e prescrições realizadas diariamente;',
          'Documentação completa de OPME (nota fiscal e RX de conferência);',
          'Laudos dos exames realizados (inclusive os disponibilizados virtualmente);',
          'Pedido e laudo anatomopatológico;',
          'Registro no SUSFÁCIL;',
          'Laudo de mudança de procedimento, quando aplicável.',
        ].map(item => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: item, size: 20, font: 'Arial' })] })),
        new Paragraph({
          spacing: { before: 160, after: 200 },
          children: [new TextRun({ text: 'Ressaltamos que o prontuário médico é documento legal e deve permanecer arquivado na instituição por, no mínimo, 20 anos, conforme a Lei nº 13.787/2018.', size: 20, font: 'Arial' })]
        }),

        // Observações
        ...(config.observacoes ? [
          sectionHeading('10. OBSERVAÇÕES ADICIONAIS'),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: config.observacoes, size: 20, font: 'Arial' })] }),
        ] : []),

        // Fechamento
        new Paragraph({ spacing: { before: 400, after: 600 }, children: [new TextRun({ text: 'Colocamo-nos à disposição para quaisquer esclarecimentos.', size: 20, font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 900 }, children: [new TextRun({ text: 'Atenciosamente,', size: 20, font: 'Arial' })] }),

        // Assinaturas
        new Table({
          width: { size: 9638, type: WidthType.DXA },
          columnWidths: [4719, 4919],
          borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  margins: cellPad,
                  borders: { top: cellBorder, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Dra. Isabela Corgosinho', bold: true, size: 20, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'CRM MG73530', size: 18, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Auditora Médica', size: 18, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Secretaria Municipal de Saúde de Nova Serrana', size: 18, font: 'Arial' })] }),
                  ]
                }),
                new TableCell({
                  margins: cellPad,
                  borders: { top: cellBorder, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Luiza Figueiredo', bold: true, size: 20, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'COREN MG 717844', size: 18, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Enfermeira Auditora', size: 18, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Secretaria Municipal de Saúde de Nova Serrana', size: 18, font: 'Arial' })] }),
                  ]
                }),
              ]
            })
          ]
        }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Oficio_Auditoria_SUS${config.numero ? `_${config.numero.replace(/\//g, '-')}` : ''}_${dateFrom || 'completo'}.docx`.replace(/__+/g, '_');
  saveAs(blob, filename);
}

// ─── Export to Excel ──────────────────────────────────────────
function exportToExcel(records: AIHRow[], dateFrom: string, dateTo: string, config: OficioConfig) {
  const stats = calcStats(records);
  const wb = XLSX.utils.book_new();
  const periodo = dateFrom && dateTo ? `${fmtDate(dateFrom)} a ${fmtDate(dateTo)}` : dateFrom || dateTo || 'Completo';

  // Resumo
  const resumo = [
    ['OFÍCIO DE AUDITORIA SUS'],
    config.numero ? ['Ofício nº:', config.numero] : [],
    ['Período:', periodo],
    ['Gerado em:', new Date().toLocaleString('pt-BR')],
    [],
    ['INDICADOR', 'VALOR'],
    ['Total de AIHs auditadas', stats.total],
    ['Caráter Eletivo', stats.eletivos],
    ['Caráter Urgência', stats.urgencia],
    ['Internações Subsequentes', stats.subsequentes],
    ['Faturamento Inicial', stats.totalFaturadoInicial],
    ['Faturamento Final', stats.totalFaturadoFinal],
    ['OPME Total', stats.totalOPME],
    ['Permanência Média (dias)', stats.avgPerm],
    ['Contas com Pendências', stats.comPendencia],
    ['Contas Corrigidas (SIM)', stats.comCorrecao],
    ['Aguardando Correção (FALTA)', stats.falta],
  ].filter(r => r.length > 0);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), 'Resumo');

  // Clínicas
  const clinicas = [
    ['DISTRIBUIÇÃO POR CLÍNICA'],
    ['Clínica / Especialidade', 'Qtd. AIH', '%'],
    ...stats.byClinica.map(([name, count]) => [name, count, stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) + '%' : '0%']),
    ['TOTAL', stats.total, '100%'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(clinicas), 'Clínicas');

  // Procedência
  const procedencia = [
    ['DISTRIBUIÇÃO POR MUNICÍPIO DE PROCEDÊNCIA'],
    ['Município', 'Qtd.', '%'],
    ['Nova Serrana', stats.novaSerrana, stats.total > 0 ? ((stats.novaSerrana / stats.total) * 100).toFixed(1) + '%' : '0%'],
    ['Outros Municípios', stats.outros, stats.total > 0 ? ((stats.outros / stats.total) * 100).toFixed(1) + '%' : '0%'],
    ...(stats.semProcedencia > 0 ? [['Não informado', stats.semProcedencia, stats.total > 0 ? ((stats.semProcedencia / stats.total) * 100).toFixed(1) + '%' : '0%']] : []),
    ['TOTAL', stats.total, '100%'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(procedencia), 'Procedência');

  // Pendências
  if (stats.topPend.length > 0) {
    const pend = [
      ['PRINCIPAIS INCONFORMIDADES'],
      ['Tipo de Pendência', 'Qtd.'],
      ...stats.topPend,
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pend), 'Pendências');
  }

  // Procedimentos
  if (stats.topProc.length > 0) {
    const proc = [
      ['PROCEDIMENTOS MAIS FREQUENTES'],
      ['Procedimento', 'Qtd.'],
      ...stats.topProc,
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(proc), 'Procedimentos');
  }

  // Mês de Lançamento
  const meses = [
    ['DISTRIBUIÇÃO POR MÊS DE LANÇAMENTO'],
    ['Mês/Ano', 'Qtd. AIH'],
    ...stats.byMonth,
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meses), 'Por Mês');

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const filename = `Oficio_Auditoria_SUS${config.numero ? `_${config.numero.replace(/\//g, '-')}` : ''}_${dateFrom || 'completo'}.xlsx`.replace(/__+/g, '_');
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), filename);
}

// ─── Main Tab Component ───────────────────────────────────────
export function OficioTab() {
  const [records, setRecords] = useState<AIHRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<OficioConfig>({
    numero: '',
    destinatario: 'Superintendente da Regulação da Secretaria Municipal de Nova Serrana',
    cargo: 'Sra. Kariny da Conceição Campos Alves',
    assunto: '',
    observacoes: '',
  });

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
        .order('data_lancamento', { ascending: false })
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

  const handleExportWord = async () => {
    setExporting(true);
    try {
      await exportToWord(records, dateFrom, dateTo, config);
      toast({ title: 'Word exportado com sucesso!' });
    } catch (e) {
      toast({ title: 'Erro ao exportar Word', variant: 'destructive' });
    }
    setExporting(false);
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(records, dateFrom, dateTo, config);
      toast({ title: 'Excel exportado com sucesso!' });
    } catch (e) {
      toast({ title: 'Erro ao exportar Excel', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted/20">
      {/* Header / Toolbar */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Criar Ofício</span>
          <Badge variant="secondary" className="text-xs">{records.length} registros</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <Button size="sm" variant="outline" className="h-8" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setShowPreview(v => !v)}>
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? 'Ocultar' : 'Visualizar'}
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExportWord} disabled={exporting}>
            {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Word (.docx)
          </Button>
          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-5 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          {/* Config panel */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Dados do Ofício</h3>

              <div className="space-y-1.5">
                <Label className="text-xs">Número do Ofício</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Ex: 02/2026"
                  value={config.numero}
                  onChange={e => setConfig(c => ({ ...c, numero: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Destinatário</Label>
                <Input
                  className="h-8 text-xs"
                  value={config.destinatario}
                  onChange={e => setConfig(c => ({ ...c, destinatario: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Cargo / Nome</Label>
                <Input
                  className="h-8 text-xs"
                  value={config.cargo}
                  onChange={e => setConfig(c => ({ ...c, cargo: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Assunto (deixe em branco para automático)</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Relatório de Auditoria SUS — período"
                  value={config.assunto}
                  onChange={e => setConfig(c => ({ ...c, assunto: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Observações adicionais</Label>
                <Textarea
                  className="text-xs min-h-[80px] resize-y"
                  placeholder="Texto adicional que aparecerá ao final do relatório..."
                  value={config.observacoes}
                  onChange={e => setConfig(c => ({ ...c, observacoes: e.target.value }))}
                />
              </div>
            </div>

            {/* Stats summary */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="font-semibold text-sm text-foreground mb-3">Resumo do Período</h3>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Carregando...
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {[
                    ['Total de AIHs', records.length],
                    ['Eletivos', records.filter(r => r.carater?.toUpperCase() === 'ELETIVO').length],
                    ['Urgência', records.filter(r => ['URGENCIA', 'URGÊNCIA'].includes(r.carater?.toUpperCase() ?? '')).length],
                    ['Com pendência', records.filter(r => r.pendencia?.trim()).length],
                    ['Corrigidos', records.filter(r => r.corrigido?.toUpperCase() === 'SIM').length],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-bold tabular-nums text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Pré-visualização do Ofício</span>
                {loading && <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin ml-auto" />}
              </div>
              <div ref={printRef} className="p-8 print:p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Carregando dados...
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                    <FileText className="w-8 h-8 opacity-30" />
                    <p>Nenhum registro no período selecionado.</p>
                    <p className="text-xs">Ajuste o filtro de datas ou carregue todos os dados.</p>
                  </div>
                ) : (
                  <OficioPreview
                    records={records}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    config={config}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
