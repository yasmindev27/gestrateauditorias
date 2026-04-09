import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Printer } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, HeadingLevel, ShadingType,
  Header, Footer, PageNumber, TableOfContents, ImageRun,
} from 'docx';
import type { Database } from '@/integrations/supabase/types';
import headerLogo from '@/assets/header-logo.png';

type AIHRow = Database['public']['Tables']['aih_registros']['Row'];

interface AuditReportProps {
  records: AIHRow[];
  dateFrom: string;
  dateTo: string;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcStats(records: AIHRow[]) {
  const total = records.length;
  const eletivos = records.filter(r => r.carater?.toUpperCase() === 'ELETIVO').length;
  const urgencia = records.filter(r => r.carater?.toUpperCase() === 'URGENCIA' || r.carater?.toUpperCase() === 'URGÊNCIA').length;
  const subsequentes = records.filter(r => r.subsequente != null && r.subsequente.trim() !== '').length;

  const totalFaturadoInicial = records.reduce((s, r) => s + (r.total ?? 0), 0);
  const totalFaturadoFinal = records.reduce((s, r) => {
    const v = r.total_final != null ? r.total_final : (r.total ?? 0);
    return s + v;
  }, 0);
  const totalOPME = records.reduce((s, r) => s + (r.valor_opme ?? 0), 0);
  const comPendencia = records.filter(r => r.pendencia?.trim()).length;
  const comCorrecao = records.filter(r => r.corrigido?.toUpperCase() === 'SIM').length;
  const falta = records.filter(r => r.corrigido?.toUpperCase() === 'FALTA').length;

  // By clínica
  const clinicaMap: Record<string, number> = {};
  records.forEach(r => {
    const c = r.clinica?.trim() || 'Não informado';
    clinicaMap[c] = (clinicaMap[c] ?? 0) + 1;
  });
  const byClinica = Object.entries(clinicaMap).sort((a, b) => b[1] - a[1]);

  // Pendências
  const pendMap: Record<string, number> = {};
  records.filter(r => r.pendencia?.trim()).forEach(r => {
    const key = r.pendencia!.trim();
    pendMap[key] = (pendMap[key] ?? 0) + 1;
  });
  const topPend = Object.entries(pendMap).sort((a, b) => b[1] - a[1]);

  // Procedimentos
  const procMap: Record<string, number> = {};
  records.forEach(r => {
    if (!r.procedimento?.trim()) return;
    procMap[r.procedimento.trim()] = (procMap[r.procedimento.trim()] ?? 0) + 1;
  });
  const topProc = Object.entries(procMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Encerramento
  const encMap: Record<string, number> = {};
  records.forEach(r => {
    if (!r.encerramento?.trim()) return;
    encMap[r.encerramento.trim()] = (encMap[r.encerramento.trim()] ?? 0) + 1;
  });
  const byEnc = Object.entries(encMap).sort((a, b) => b[1] - a[1]);

  // Avg permanência
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

  // Por mês de lançamento
  const monthMap: Record<string, number> = {};
  records.forEach(r => {
    const dt = (r as AIHRow & { data_lancamento?: string | null }).data_lancamento ?? r.created_at?.substring(0, 10);
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

  return {
    total, eletivos, urgencia, subsequentes,
    totalFaturadoInicial, totalFaturadoFinal, totalOPME,
    comPendencia, comCorrecao, falta,
    byClinica, topPend, topProc, byEnc, avgPerm, byMonth
  };
}

// ─── Report preview rendered in page ─────────────────────────
export function AuditReportPreview({ records, dateFrom, dateTo }: AuditReportProps) {
  const stats = calcStats(records);
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const periodo = dateFrom && dateTo
    ? `${fmtDate(dateFrom)} a ${fmtDate(dateTo)}`
    : dateFrom
    ? `a partir de ${fmtDate(dateFrom)}`
    : dateTo
    ? `até ${fmtDate(dateTo)}`
    : 'Todo o período';

  return (
    <div className="bg-white text-gray-900 font-serif text-sm leading-relaxed max-w-4xl mx-auto">
      {/* Letterhead */}
      <div className="border-b-2 border-gray-800 pb-3 mb-6">
        <img src={headerLogo} alt="Cabeçalho Prefeitura" className="w-full max-h-28 object-contain object-left" />
      </div>

      {/* Ofício header */}
      <div className="text-center mb-6 space-y-0.5">
        <p className="font-bold text-base">OFÍCIO DE AUDITORIA SUS</p>
        <p className="text-xs text-gray-600">Nova Serrana, {today}</p>
      </div>

      <div className="mb-4">
        <p>À</p>
        <p className="font-semibold">Superintendente da Regulação da Secretaria Municipal de Nova Serrana</p>
        <p className="italic">Sra. Kariny da Conceição Campos Alves</p>
      </div>

      <p className="font-bold underline mb-4">Assunto: Relatório de Auditoria SUS — {periodo}</p>

      <p className="mb-4">Prezada Senhora,</p>

      <p className="mb-4 text-justify">
        Viemos, por meio deste, apresentar informações acerca da auditoria realizada no período de <strong>{periodo}</strong>, compreendendo <strong>{stats.total} contas</strong> auditadas, sendo <strong>{stats.eletivos} eletivas</strong> e <strong>{stats.urgencia} de urgência</strong>{stats.subsequentes > 0 ? `, com ${stats.subsequentes} internações subsequentes` : ''}.
      </p>

      {/* Seção 1 – Resumo */}
      <h2 className="font-bold text-sm border-b border-gray-400 pb-1 mb-3 mt-5">1. RESUMO DO PERÍODO AUDITADO</h2>

      <table className="w-full border-collapse mb-4 text-xs">
        <tbody>
          {[
            ['Total de AIHs auditadas', stats.total],
            ['Caráter Eletivo', `${stats.eletivos} (${stats.total > 0 ? ((stats.eletivos / stats.total) * 100).toFixed(1) : 0}%)`],
            ['Caráter Urgência', `${stats.urgencia} (${stats.total > 0 ? ((stats.urgencia / stats.total) * 100).toFixed(1) : 0}%)`],
            ['Internações Subsequentes', stats.subsequentes],
            ['Faturamento Inicial', fmtCurrency(stats.totalFaturadoInicial)],
            ['Faturamento Final (pós auditoria)', fmtCurrency(stats.totalFaturadoFinal)],
            ['OPME Total', fmtCurrency(stats.totalOPME)],
            ['Permanência Média', `${stats.avgPerm} dias`],
            ['Contas com Pendências', `${stats.comPendencia} (${stats.total > 0 ? ((stats.comPendencia / stats.total) * 100).toFixed(1) : 0}%)`],
            ['Contas Corrigidas (SIM)', stats.comCorrecao],
            ['Aguardando Correção (FALTA)', stats.falta],
          ].map(([label, value], i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="border border-gray-300 px-2 py-1 font-medium w-64">{label}</td>
              <td className="border border-gray-300 px-2 py-1 tabular-nums">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Seção 2 – Distribuição por especialidade */}
      <h2 className="font-bold text-sm border-b border-gray-400 pb-1 mb-3 mt-5">2. DISTRIBUIÇÃO POR ESPECIALIDADE / CLÍNICA</h2>
      <table className="w-full border-collapse mb-4 text-xs">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-2 py-1 text-left">Clínica / Especialidade</th>
            <th className="border border-gray-300 px-2 py-1 text-right">Qtd. AIH</th>
            <th className="border border-gray-300 px-2 py-1 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {stats.byClinica.map(([name, count], i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-2 py-1">{name}</td>
              <td className="border border-gray-300 px-2 py-1 text-right tabular-nums">{count}</td>
              <td className="border border-gray-300 px-2 py-1 text-right tabular-nums">{stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%</td>
            </tr>
          ))}
          <tr className="bg-gray-200 font-bold">
            <td className="border border-gray-300 px-2 py-1">TOTAL</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{stats.total}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">100%</td>
          </tr>
        </tbody>
      </table>

      {/* Seção 3 – Lançamentos por mês */}
      <h2 className="font-bold text-sm border-b border-gray-400 pb-1 mb-3 mt-5">3. DISTRIBUIÇÃO POR MÊS DE LANÇAMENTO</h2>
      <table className="w-full border-collapse mb-4 text-xs">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-2 py-1 text-left">Mês/Ano</th>
            <th className="border border-gray-300 px-2 py-1 text-right">Qtd. AIH</th>
          </tr>
        </thead>
        <tbody>
          {stats.byMonth.map(([month, count], i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-2 py-1">{month}</td>
              <td className="border border-gray-300 px-2 py-1 text-right tabular-nums">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Seção 4 – Principais inconformidades/pendências */}
      {stats.topPend.length > 0 && (
        <>
          <h2 className="font-bold text-sm border-b border-gray-400 pb-1 mb-3 mt-5">4. PRINCIPAIS INCONFORMIDADES IDENTIFICADAS</h2>
          <table className="w-full border-collapse mb-4 text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-2 py-1 text-left">Tipo de Pendência</th>
                <th className="border border-gray-300 px-2 py-1 text-right">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              {stats.topPend.map(([pend, count], i) => (
                <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-2 py-1">{pend}</td>
                  <td className="border border-gray-300 px-2 py-1 text-right tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Seção 5 – Top Procedimentos */}
      {stats.topProc.length > 0 && (
        <>
          <h2 className="font-bold text-sm border-b border-gray-400 pb-1 mb-3 mt-5">5. PROCEDIMENTOS MAIS FREQUENTES</h2>
          <table className="w-full border-collapse mb-4 text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-2 py-1 text-left">Procedimento</th>
                <th className="border border-gray-300 px-2 py-1 text-right">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProc.map(([proc, count], i) => (
                <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-2 py-1 font-mono text-xs">{proc}</td>
                  <td className="border border-gray-300 px-2 py-1 text-right tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Seção 6 – Motivos de Encerramento */}
      {stats.byEnc.length > 0 && (
        <>
          <h2 className="font-bold text-sm border-b border-gray-400 pb-1 mb-3 mt-5">6. MOTIVOS DE ENCERRAMENTO</h2>
          <table className="w-full border-collapse mb-4 text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-2 py-1 text-left">Motivo</th>
                <th className="border border-gray-300 px-2 py-1 text-right">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              {stats.byEnc.map(([name, count], i) => (
                <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-2 py-1">{name}</td>
                  <td className="border border-gray-300 px-2 py-1 text-right tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Faturamento */}
      <h2 className="font-bold text-sm border-b border-gray-400 pb-1 mb-3 mt-5">7. FATURAMENTO</h2>
      <p className="mb-4 text-justify">
        O faturamento inicial totalizou <strong>{fmtCurrency(stats.totalFaturadoInicial)}</strong>. Após a auditoria, o valor final apurado foi de <strong>{fmtCurrency(stats.totalFaturadoFinal)}</strong>.
        {stats.totalOPME > 0 && ` O total de OPME computado foi de ${fmtCurrency(stats.totalOPME)}.`}
      </p>

      {/* Importância do prontuário */}
      <h2 className="font-bold text-sm border-b border-gray-400 pb-1 mb-3 mt-5">8. IMPORTÂNCIA DO PRONTUÁRIO COMPLETO</h2>
      <p className="mb-2 text-justify">
        Aproveitamos a oportunidade para reiterar a importância de um prontuário completo, contendo:
      </p>
      <ul className="list-disc ml-6 mb-4 space-y-1 text-xs">
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
      <p className="mb-6 text-justify text-xs">
        Ressaltamos que o prontuário médico é documento legal e deve permanecer arquivado na instituição por, no mínimo, 20 anos, conforme a Lei nº 13.787/2018, sendo obrigatória a manutenção de todos os seus componentes de forma íntegra.
      </p>

      <p className="mb-8">Colocamo-nos à disposição para quaisquer esclarecimentos.</p>
      <p className="mb-8">Atenciosamente,</p>

      {/* Assinaturas */}
      <div className="grid grid-cols-2 gap-8 mt-4 text-xs">
        <div>
          <div className="border-t border-gray-400 pt-2">
            <p className="font-bold">Dra. Isabela Corgosinho</p>
            <p>CRM MG73530</p>
            <p>Auditora Médica</p>
            <p>Secretaria Municipal de Saúde de Nova Serrana</p>
          </div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2">
            <p className="font-bold">Luiza Figueiredo</p>
            <p>COREN MG 717844</p>
            <p>Enfermeira Auditora</p>
            <p>Secretaria Municipal de Saúde de Nova Serrana</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-400 mt-8 pt-2 text-center text-xs text-gray-500">
        <p>Secretaria Municipal de Saúde</p>
        <p>Avenida Benjamim Martins do Espírito Santo Nº 2112 - Bairro Park Dona Gumercinda Martins - (37) 3225-8700</p>
        <p>secretariadesaude@novaserrana.mg.gov.br</p>
      </div>

      {/* Listagem completa dos registros */}
      {records.length > 0 && (
        <>
          <div className="mt-8 border-t-2 border-gray-800 pt-4">
            <h2 className="font-bold text-sm border-b border-gray-400 pb-1 mb-3">ANEXO I — LISTAGEM COMPLETA DAS AIHs AUDITADAS</h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-200">
                  {['AIH', 'Paciente', 'Admissão', 'Alta', 'Perm.', 'Clínica', 'Caráter', 'Procedimento', 'Faturado', 'Pendência', 'Corrigido'].map(h => (
                    <th key={h} className="border border-gray-300 px-1 py-1 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const perm = r.admissao && r.alta
                    ? Math.max(0, Math.round((new Date(r.alta).getTime() - new Date(r.admissao).getTime()) / 86400000))
                    : '—';
                  const fat = r.total_final != null ? r.total_final : (r.total ?? 0);
                  return (
                    <tr key={r.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-1 py-0.5 font-mono">{r.aih}</td>
                      <td className="border border-gray-300 px-1 py-0.5">{r.nome_paciente}</td>
                      <td className="border border-gray-300 px-1 py-0.5 whitespace-nowrap">{fmtDate(r.admissao)}</td>
                      <td className="border border-gray-300 px-1 py-0.5 whitespace-nowrap">{fmtDate(r.alta)}</td>
                      <td className="border border-gray-300 px-1 py-0.5 text-center">{perm}</td>
                      <td className="border border-gray-300 px-1 py-0.5">{r.clinica || '—'}</td>
                      <td className="border border-gray-300 px-1 py-0.5">{r.carater || '—'}</td>
                      <td className="border border-gray-300 px-1 py-0.5 font-mono">{r.procedimento || '—'}</td>
                      <td className="border border-gray-300 px-1 py-0.5 text-right tabular-nums">{fat > 0 ? fmtCurrency(fat) : '—'}</td>
                      <td className="border border-gray-300 px-1 py-0.5 text-xs">{r.pendencia || '—'}</td>
                      <td className="border border-gray-300 px-1 py-0.5 text-center">{r.corrigido || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Export to Word ───────────────────────────────────────────
async function exportToWord(records: AIHRow[], dateFrom: string, dateTo: string) {
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

  function makeCell(text: string, opts?: { bold?: boolean; shade?: typeof headerFill; align?: typeof AlignmentType.LEFT }) {
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
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '336699', space: 3 } },
      children: [new TextRun({ text, bold: true, size: 22, color: '336699', font: 'Arial' })]
    });
  }

  function makeRow(cols: string[], shade?: typeof headerFill) {
    return new TableRow({ children: cols.map(c => makeCell(c, { shade })) });
  }

  // Summary table
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

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 20 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '336699', space: 2 } },
            children: [new TextRun({ text: 'PREFEITURA MUNICIPAL DE NOVA SERRANA — SECRETARIA MUNICIPAL DE SAÚDE', size: 16, color: '336699', font: 'Arial' })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA', space: 2 } },
            children: [
              new TextRun({ text: 'Secretaria Municipal de Saúde — Av. Benjamim Martins do Espírito Santo, 2112 — (37) 3225-8700 — ', size: 16, color: '888888', font: 'Arial' }),
              new TextRun({ text: 'Página ', size: 16, color: '888888', font: 'Arial' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888', font: 'Arial' }),
            ]
          })]
        })
      },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: 'OFÍCIO DE AUDITORIA SUS', bold: true, size: 28, font: 'Arial' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: `Nova Serrana, ${today}`, size: 20, color: '555555', font: 'Arial' })]
        }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'À', size: 20, font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Superintendente da Regulação da Secretaria Municipal de Nova Serrana', bold: true, size: 20, font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: 'Sra. Kariny da Conceição Campos Alves', italics: true, size: 20, font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `Assunto: Relatório de Auditoria SUS — ${periodo}`, bold: true, underline: {}, size: 20, font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: 'Prezada Senhora,', size: 20, font: 'Arial' })] }),
        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: `Viemos, por meio deste, apresentar informações acerca da auditoria realizada no período de ${periodo}, compreendendo ${stats.total} contas auditadas, sendo ${stats.eletivos} eletivas e ${stats.urgencia} de urgência${stats.subsequentes > 0 ? `, com ${stats.subsequentes} internações subsequentes` : ''}.`, size: 20, font: 'Arial' })]
        }),

        // Section 1
        sectionHeading('1. RESUMO DO PERÍODO AUDITADO'),
        new Table({
          width: { size: 9638, type: WidthType.DXA },
          columnWidths: [5000, 4638],
          rows: summaryRows.map(([label, value], i) => new TableRow({
            children: [
              makeCell(label, { bold: true, shade: i % 2 !== 0 ? altFill : undefined }),
              makeCell(value, { shade: i % 2 !== 0 ? altFill : undefined }),
            ]
          }))
        }),

        // Section 2
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

        // Section 3
        sectionHeading('3. DISTRIBUIÇÃO POR MÊS DE LANÇAMENTO'),
        new Table({
          width: { size: 9638, type: WidthType.DXA },
          columnWidths: [7638, 2000],
          rows: [
            new TableRow({ children: ['Mês/Ano', 'Qtd. AIH'].map(h => makeCell(h, { bold: true, shade: headerFill })) }),
            ...stats.byMonth.map(([month, count], i) => new TableRow({
              children: [makeCell(month, { shade: i % 2 !== 0 ? altFill : undefined }), makeCell(String(count), { shade: i % 2 !== 0 ? altFill : undefined })]
            }))
          ]
        }),

        // Section 4 – Pendências
        ...(stats.topPend.length > 0 ? [
          sectionHeading('4. PRINCIPAIS INCONFORMIDADES IDENTIFICADAS'),
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

        // Section 5 – Procedimentos
        ...(stats.topProc.length > 0 ? [
          sectionHeading('5. PROCEDIMENTOS MAIS FREQUENTES'),
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

        // Section 6 – Encerramento
        ...(stats.byEnc.length > 0 ? [
          sectionHeading('6. MOTIVOS DE ENCERRAMENTO'),
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

        // Section 7 – Faturamento
        sectionHeading('7. FATURAMENTO'),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: `O faturamento inicial totalizou ${fmtCurrency(stats.totalFaturadoInicial)}. Após a auditoria, o valor final apurado foi de ${fmtCurrency(stats.totalFaturadoFinal)}.${stats.totalOPME > 0 ? ` O total de OPME computado foi de ${fmtCurrency(stats.totalOPME)}.` : ''}`, size: 20, font: 'Arial' })]
        }),

        // Section 8 – Prontuário
        sectionHeading('8. IMPORTÂNCIA DO PRONTUÁRIO COMPLETO'),
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
          spacing: { before: 200, after: 400 },
          children: [new TextRun({ text: 'Ressaltamos que o prontuário médico é documento legal e deve permanecer arquivado na instituição por, no mínimo, 20 anos, conforme a Lei nº 13.787/2018.', size: 20, font: 'Arial' })]
        }),

        new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: 'Colocamo-nos à disposição para quaisquer esclarecimentos.', size: 20, font: 'Arial' })] }),
        new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: 'Atenciosamente,', size: 20, font: 'Arial' })] }),

        // Signatures
        new Table({
          width: { size: 9638, type: WidthType.DXA },
          columnWidths: [4719, 4919],
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 60, bottom: 60, left: 60, right: 60 },
                  borders: { top: cellBorder, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Dra. Isabela Corgosinho', bold: true, size: 20, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'CRM MG73530', size: 18, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Auditora Médica', size: 18, font: 'Arial' })] }),
                    new Paragraph({ children: [new TextRun({ text: 'Secretaria Municipal de Saúde de Nova Serrana', size: 18, font: 'Arial' })] }),
                  ]
                }),
                new TableCell({
                  margins: { top: 60, bottom: 60, left: 60, right: 60 },
                  borders: { top: cellBorder, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
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

        // Annex – full listing
        ...(records.length > 0 ? [
          new Paragraph({ pageBreakBefore: true }),
          sectionHeading('ANEXO I — LISTAGEM COMPLETA DAS AIHs AUDITADAS'),
          new Table({
            width: { size: 9638, type: WidthType.DXA },
            columnWidths: [800, 1600, 700, 700, 500, 900, 700, 900, 900, 1200, 638],
            rows: [
              new TableRow({
                children: ['AIH', 'Paciente', 'Admissão', 'Alta', 'Perm.', 'Clínica', 'Caráter', 'Procedimento', 'Faturado', 'Pendência', 'Corrigido']
                  .map(h => makeCell(h, { bold: true, shade: headerFill }))
              }),
              ...records.map((r, i) => {
                const perm = r.admissao && r.alta
                  ? String(Math.max(0, Math.round((new Date(r.alta).getTime() - new Date(r.admissao).getTime()) / 86400000)))
                  : '—';
                const fat = r.total_final != null ? r.total_final : (r.total ?? 0);
                const shade = i % 2 !== 0 ? altFill : undefined;
                return new TableRow({
                  children: [
                    makeCell(r.aih, { shade }),
                    makeCell(r.nome_paciente, { shade }),
                    makeCell(fmtDate(r.admissao), { shade }),
                    makeCell(fmtDate(r.alta), { shade }),
                    makeCell(perm, { shade }),
                    makeCell(r.clinica || '—', { shade }),
                    makeCell(r.carater || '—', { shade }),
                    makeCell(r.procedimento || '—', { shade }),
                    makeCell(fat > 0 ? fmtCurrency(fat) : '—', { shade }),
                    makeCell(r.pendencia || '—', { shade }),
                    makeCell(r.corrigido || '—', { shade }),
                  ]
                });
              })
            ]
          }),
        ] : []),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const filename = `Relatorio_Auditoria_SUS_${dateFrom || 'completo'}_${dateTo || ''}.docx`.replace(/__+/g, '_');
  saveAs(blob, filename);
}

// ─── Export to Excel ──────────────────────────────────────────
function exportToExcel(records: AIHRow[], dateFrom: string, dateTo: string) {
  const stats = calcStats(records);
  const wb = XLSX.utils.book_new();
  const periodo = dateFrom && dateTo ? `${dateFrom} a ${dateTo}` : dateFrom || dateTo || 'Completo';

  // Sheet 1: Resumo
  const resumo = [
    ['RELATÓRIO DE AUDITORIA SUS'],
    ['Período:', periodo],
    ['Gerado em:', new Date().toLocaleString('pt-BR')],
    [],
    ['INDICADOR', 'VALOR'],
    ['Total de AIHs auditadas', stats.total],
    ['Caráter Eletivo', stats.eletivos],
    ['Caráter Urgência', stats.urgencia],
    ['Internações Subsequentes', stats.subsequentes],
    ['Faturamento Inicial (R$)', stats.totalFaturadoInicial],
    ['Faturamento Final (R$)', stats.totalFaturadoFinal],
    ['OPME Total (R$)', stats.totalOPME],
    ['Permanência Média (dias)', stats.avgPerm],
    ['Contas com Pendências', stats.comPendencia],
    ['Contas Corrigidas (SIM)', stats.comCorrecao],
    ['Aguardando Correção (FALTA)', stats.falta],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
  wsResumo['!cols'] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // Sheet 2: Por Clínica
  const clinData = [['Clínica', 'Qtd. AIH', '%'], ...stats.byClinica.map(([name, count]) => [name, count, stats.total > 0 ? +((count / stats.total) * 100).toFixed(1) : 0])];
  const wsClin = XLSX.utils.aoa_to_sheet(clinData);
  wsClin['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsClin, 'Por Clínica');

  // Sheet 3: Pendências
  if (stats.topPend.length > 0) {
    const pendData = [['Pendência', 'Qtd.'], ...stats.topPend.map(([p, c]) => [p, c])];
    const wsPend = XLSX.utils.aoa_to_sheet(pendData);
    wsPend['!cols'] = [{ wch: 50 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsPend, 'Pendências');
  }

  // Sheet 4: Procedimentos
  if (stats.topProc.length > 0) {
    const procData = [['Procedimento', 'Qtd.'], ...stats.topProc.map(([p, c]) => [p, c])];
    const wsProc = XLSX.utils.aoa_to_sheet(procData);
    wsProc['!cols'] = [{ wch: 30 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsProc, 'Procedimentos');
  }

  // Sheet 5: Listagem completa
  const headers = ['AIH', 'Paciente', 'Data Lançamento', 'Admissão', 'Alta', 'Permanência', 'Clínica', 'Caráter', 'Procedimento', 'Procedência', 'Encerramento', 'Pendência', 'Subsequente', 'OPME', 'Valor OPME', 'Total', 'Total Final', 'Corrigido', 'Troca Código'];
  const rows = records.map(r => {
    const perm = r.admissao && r.alta ? Math.max(0, Math.round((new Date(r.alta).getTime() - new Date(r.admissao).getTime()) / 86400000)) : '';
    return [
      r.aih, r.nome_paciente, r.data_lancamento || '', r.admissao || '', r.alta || '',
      perm, r.clinica || '', r.carater || '', r.procedimento || '',
      r.procedencia || '', r.encerramento || '', r.pendencia || '',
      r.subsequente || '', r.opme || '', r.valor_opme || '', r.total || '', r.total_final || '',
      r.corrigido || '', r.troca_codigo || ''
    ];
  });
  const wsList = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  wsList['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsList, 'Listagem Completa');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `Relatorio_Auditoria_SUS_${dateFrom || 'completo'}_${dateTo || ''}.xlsx`.replace(/__+/g, '_');
  saveAs(blob, filename);
}

// ─── Main wrapper with export buttons ────────────────────────
export function AuditReportSection({ records, dateFrom, dateTo, loading }: AuditReportProps & { loading: boolean }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Relatório Auditoria SUS</title>
      <style>
        body { font-family: serif; font-size: 11pt; color: #111; margin: 2cm; }
        table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        th, td { border: 1px solid #aaa; padding: 3px 6px; }
        th { background: #d5e8f0; }
        h2 { font-size: 11pt; border-bottom: 1.5pt solid #336699; color: #336699; margin-top: 18pt; }
        @page { size: A4; margin: 2cm; }
      </style></head><body>${content}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  if (loading) return null;

  return (
    <div className="mt-6">
      {/* Export action bar */}
      <div className="flex items-center justify-between mb-4 bg-card border border-border rounded-xl p-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-foreground">Relatório Auditável</p>
          <p className="text-xs text-muted-foreground">
            {dateFrom || dateTo ? `Período: ${dateFrom ? fmtDate(dateFrom) : '—'} até ${dateTo ? fmtDate(dateTo) : '—'}` : 'Todo o período disponível'}
            {' · '}{records.length} registros
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => exportToWord(records, dateFrom, dateTo)}
          >
            <FileText className="w-3.5 h-3.5" />
            Exportar Word
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => exportToExcel(records, dateFrom, dateTo)}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exportar Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Report preview */}
      <div ref={printRef} className="bg-white border border-border rounded-xl shadow-sm p-8">
        <AuditReportPreview records={records} dateFrom={dateFrom} dateTo={dateTo} />
      </div>
    </div>
  );
}
