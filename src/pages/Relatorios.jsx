import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, FileDown, FolderDown, Loader2 } from 'lucide-react';
// jsPDF and JSZip are loaded on-demand to keep the initial bundle small
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { resignS3UrlOnClient } from '@/lib/s3SignedUrlClient';
import appLogo from '../../assets/logo.png';

const categorias = {
  saude: { nome: 'Médico/Saúde', cor: '#ef4444' },
  dentista: { nome: 'Dentista/Saúde', cor: '#06b6d4' },
  educacao: { nome: 'Educação', cor: '#3b82f6' },
  previdencia_privada: { nome: 'Previdência Privada', cor: '#059669' },
  pensao_alimenticia: { nome: 'Pensão Alimentícia', cor: '#f97316' },
  dependentes: { nome: 'Dependentes', cor: '#14b8a6' },
  alimentacao: { nome: 'Alimentação', cor: '#22c55e' },
  transporte: { nome: 'Transporte', cor: '#eab308' },
  moradia: { nome: 'Moradia', cor: '#a855f7' },
  servicos: { nome: 'Serviços', cor: '#6366f1' },
  vestuario: { nome: 'Vestuário', cor: '#ec4899' },
  pets: { nome: 'Pets', cor: '#f59e0b' },
  farmacia: { nome: 'Farmácia', cor: '#84cc16' },
  outros: { nome: 'Outros', cor: '#6b7280' }
};

const CATEGORIAS_DEDUTIVEIS = ['saude', 'dentista', 'educacao', 'previdencia_privada', 'pensao_alimenticia', 'dependentes'];

export default function Relatorios() {
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [mostrarInforme, setMostrarInforme] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userData, setUserData] = useState({ nome_completo: '', cpf: '' });
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    base44.auth.me().then((me) => {
      setUserEmail(me.email);
      setUserData({ nome_completo: me.nome_completo || '', cpf: me.cpf || '' });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDarkMode(root.classList.contains('dark'));
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const { data: notas = [] } = useQuery({
    queryKey: ['notas', userEmail],
    queryFn: () => base44.entities.NotaFiscal.filter({ created_by: userEmail }, '-data_emissao'),
    enabled: !!userEmail
  });

  const notasAno = notas.filter((nota) =>
  new Date(nota.data_emissao).getFullYear() === anoSelecionado
  );

  const totalPorCategoria = {};
  Object.keys(categorias).forEach((cat) => {
    totalPorCategoria[cat] = notasAno.
    filter((n) => n.categoria === cat).
    reduce((sum, n) => sum + (n.valor_total || 0), 0);
  });

  const dadosGrafico = Object.entries(categorias).map(([key, cat]) => ({
    nome: cat.nome,
    valor: totalPorCategoria[key],
    cor: cat.cor
  })).filter((d) => d.valor > 0);

  const totalGeral = Object.values(totalPorCategoria).reduce((sum, val) => sum + val, 0);
  const dedutiveis = CATEGORIAS_DEDUTIVEIS.reduce((sum, cat) => sum + (totalPorCategoria[cat] || 0), 0);

  // Dados por mês para informe de restituição
  const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];


  const dadosPorMes = meses.map((mes, index) => {
    const notasMes = notasAno.filter((nota) => {
      const mesNota = new Date(nota.data_emissao).getMonth();
      return mesNota === index && CATEGORIAS_DEDUTIVEIS.includes(nota.categoria);
    });

    const saude = notasMes.filter((n) => n.categoria === 'saude').reduce((sum, n) => sum + (n.valor_total || 0), 0);
    const dentista = notasMes.filter((n) => n.categoria === 'dentista').reduce((sum, n) => sum + (n.valor_total || 0), 0);
    const educacao = notasMes.filter((n) => n.categoria === 'educacao').reduce((sum, n) => sum + (n.valor_total || 0), 0);
    const previdencia = notasMes.filter((n) => n.categoria === 'previdencia_privada').reduce((sum, n) => sum + (n.valor_total || 0), 0);
    const pensao = notasMes.filter((n) => n.categoria === 'pensao_alimenticia').reduce((sum, n) => sum + (n.valor_total || 0), 0);
    const dependentes = notasMes.filter((n) => n.categoria === 'dependentes').reduce((sum, n) => sum + (n.valor_total || 0), 0);

    return {
      mes,
      saude,
      dentista,
      educacao,
      previdencia,
      pensao,
      dependentes,
      total: saude + dentista + educacao + previdencia + pensao + dependentes,
      quantidade: notasMes.length
    };
  }).filter((m) => m.total > 0);

  const exportarCSV = () => {
    const headers = ['Data', 'Estabelecimento', 'Categoria', 'Valor', 'CNPJ', 'Número Nota'];
    const rows = notasAno.map((nota) => [
    nota.data_emissao,
    nota.estabelecimento || '',
    categorias[nota.categoria]?.nome || nota.categoria,
    nota.valor_total.toFixed(2),
    nota.cnpj || '',
    nota.numero_nota || '']
    );

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notas-fiscais-${anoSelecionado}.csv`;
    a.click();
  };

  const exportarInformePDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape' });

    // Logo
    try {
      const logoUrl = appLogo;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = logoUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      doc.addImage(dataUrl, 'PNG', 14, 4, 22, 22);
    } catch (e) {
      doc.setFontSize(10);
      doc.setTextColor(30, 100, 200);
      doc.setFont('helvetica', 'bold');
      doc.text('Restitua', 14, 14);
    }

    // Título
    doc.setFontSize(16);
    doc.setTextColor(30, 100, 200);
    doc.text(`Informe de Despesas Dedutiveis estimadas - ${anoSelecionado}`, 40, 13);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}   |   Total estimado de dedutiveis: R$ ${dedutiveis.toFixed(2)}`, 40, 20);

    if (userData.nome_completo) {
      doc.text(`Nome: ${userData.nome_completo}`, 40, 26);
    }
    if (userData.cpf) {
      doc.text(`CPF: ${userData.cpf}`, 40, userData.nome_completo ? 31 : 26);
    }

    const cols = ['Mes', 'Saude', 'Dentista', 'Educacao', 'Prev.Privada', 'Pensao', 'Dependentes', 'Total', 'Notas'];
    const colW = [28, 26, 24, 24, 28, 24, 28, 28, 14];
    const startX = 14;
    const rowH = 8;
    let y = 38;

    const drawRow = (cells, bgR, bgG, bgB, textR, textG, textB, bold) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      let x = startX;
      cells.forEach((cell, i) => {
        doc.setFillColor(bgR, bgG, bgB);
        doc.rect(x, y, colW[i], rowH, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, colW[i], rowH, 'S');
        doc.setTextColor(textR, textG, textB);
        doc.text(String(cell), x + 2, y + 5.5);
        x += colW[i];
      });
      y += rowH;
    };

    // Header
    drawRow(cols, 88, 28, 135, 255, 255, 255, true);

    // Data rows
    dadosPorMes.forEach((m, ri) => {
      const bg = ri % 2 === 0 ? [255, 255, 255] : [248, 245, 255];
      drawRow(
        [m.mes, `R$${m.saude.toFixed(2)}`, `R$${m.dentista.toFixed(2)}`, `R$${m.educacao.toFixed(2)}`,
        `R$${m.previdencia.toFixed(2)}`, `R$${m.pensao.toFixed(2)}`, `R$${m.dependentes.toFixed(2)}`,
        `R$${m.total.toFixed(2)}`, String(m.quantidade)],
        bg[0], bg[1], bg[2], 60, 60, 60, false
      );
    });

    // Total row
    drawRow(
      ['TOTAL ANUAL',
      `R$${dadosPorMes.reduce((s, m) => s + m.saude, 0).toFixed(2)}`,
      `R$${dadosPorMes.reduce((s, m) => s + m.dentista, 0).toFixed(2)}`,
      `R$${dadosPorMes.reduce((s, m) => s + m.educacao, 0).toFixed(2)}`,
      `R$${dadosPorMes.reduce((s, m) => s + m.previdencia, 0).toFixed(2)}`,
      `R$${dadosPorMes.reduce((s, m) => s + m.pensao, 0).toFixed(2)}`,
      `R$${dadosPorMes.reduce((s, m) => s + m.dependentes, 0).toFixed(2)}`,
      `R$${dedutiveis.toFixed(2)}`,
      String(dadosPorMes.reduce((s, m) => s + m.quantidade, 0))],
      237, 233, 254, 30, 30, 30, true
    );

    doc.save(`informe-dedutiveis-${anoSelecionado}.pdf`);
  };

  const exportarInformeRestituicao = () => {
    const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    const notasDedutiveis = notasAno
      .filter((n) => CATEGORIAS_DEDUTIVEIS.includes(n.categoria))
      .sort((a, b) => new Date(a.data_emissao) - new Date(b.data_emissao));

    const header1 = `Informe de Despesas Dedutiveis estimadas - ${anoSelecionado}`;
    const header2 = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} | Total estimado de dedutiveis: R$ ${dedutiveis.toFixed(2)}`;
    const header3 = `Nome: ${userData.nome_completo || ''}    CPF: ${userData.cpf || ''}`;
    const blank = '';

    const cols = ['Mês','CNPJ/CPF','Nome/Razão Social','Tipo da despesa dedutível','Valor'];

    const rows = notasDedutiveis.map((nota) => {
      const d = new Date(nota.data_emissao);
      const mes = mesesNomes[d.getMonth()];
      return [
        mes,
        nota.cnpj || '',
        nota.estabelecimento || '',
        categorias[nota.categoria]?.nome || nota.categoria,
        `R$ ${nota.valor_total?.toFixed(2) || '0.00'}`
      ];
    });

    const lines = [
      [header1],
      [header2],
      [header3],
      [blank],
      cols,
      ...rows
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));

    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-dedutiveis-${anoSelecionado}.csv`;
    a.click();
  };

  const [baixandoArquivos, setBaixandoArquivos] = useState(false);

  const downloadArquivosDedutiveis = async () => {
    const notasComImagem = notasAno.filter(
      (n) => CATEGORIAS_DEDUTIVEIS.includes(n.categoria) && n.imagem_url
    );

    if (notasComImagem.length === 0) {
      alert('Nenhuma nota dedutível com arquivo anexado encontrada para este ano.');
      return;
    }

    setBaixandoArquivos(true);
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const pasta = zip.folder(`dedutiveis-${anoSelecionado}`);

    await Promise.all(
      notasComImagem.map(async (nota, idx) => {
        const sourceUrl = (await resignS3UrlOnClient(nota.imagem_url)) || nota.imagem_url;
        let resp = await fetch(sourceUrl);
        if (!resp.ok) {
          const refreshedUrl = await resignS3UrlOnClient(sourceUrl, true);
          if (refreshedUrl) {
            resp = await fetch(refreshedUrl);
          }
        }
        if (!resp.ok) {
          return;
        }
        const blob = await resp.blob();
        const ext = sourceUrl.split('.').pop().split('?')[0] || 'jpg';
        const nomeArq = `${String(idx + 1).padStart(3, '0')}_${(nota.estabelecimento || 'nota').replace(/[^a-zA-Z0-9]/g, '_')}_${nota.data_emissao}.${ext}`;
        pasta.file(nomeArq, blob);
      })
    );

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprovantes-dedutiveis-${anoSelecionado}.zip`;
    a.click();
    setBaixandoArquivos(false);
  };

  const chartGridColor = isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.25)';
  const chartAxisColor = isDarkMode ? '#cbd5e1' : '#334155';
  const chartTooltipStyle = {
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    border: isDarkMode ? '1px solid #334155' : '1px solid #d1d5db',
    borderRadius: '10px',
    color: isDarkMode ? '#e2e8f0' : '#0f172a',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-border/70 bg-card/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <Button
                variant="ghost"
                onClick={() => { window.location.href = '/dashboard'; }}
                aria-label="Voltar ao dashboard"
                className="gap-2 min-h-[44px] w-full md:w-auto justify-start"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>

              <div className="flex w-full md:w-auto flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={String(anoSelecionado)} onValueChange={(v) => setAnoSelecionado(Number(v))}>
                  <SelectTrigger className="w-full sm:w-[120px] min-h-[44px] bg-background/70" aria-label="Selecionar ano">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2026, 2025, 2024, 2023, 2022].map((ano) => (
                      <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setMostrarInforme(!mostrarInforme)}
                  aria-label={mostrarInforme ? 'Fechar informe de restituição' : 'Abrir informe de restituição'}
                  className={`gap-2 min-h-[44px] w-full sm:w-auto ${
                    mostrarInforme
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {mostrarInforme ? 'Fechar Informe' : 'Informe de Restituição'}
                </Button>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300 mb-2">
                Painel Financeiro
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {mostrarInforme ? `Informe de Restituição ${anoSelecionado}` : `Relatório Anual ${anoSelecionado}`}
              </h1>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-3xl">
                {mostrarInforme
                  ? 'Despesas dedutíveis organizadas mês a mês para restituição do IR.'
                  : 'Resumo completo das suas despesas para declaração de IR, com visão por categoria e distribuição anual.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/90 text-xs tracking-wide uppercase">Total Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-[2rem] font-bold">R$ {totalGeral.toFixed(2)}</p>
              <p className="text-xs text-white/85 mt-1">{notasAno.length} notas fiscais</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/90 text-xs tracking-wide uppercase">Estimativo Dedutível</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-[2rem] font-bold">R$ {dedutiveis.toFixed(2)}</p>
              <p className="text-xs text-white/85 mt-1">Saúde, educação e similares</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-900/85 text-xs tracking-wide uppercase">Outras Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-[2rem] font-bold">R$ {(totalGeral - dedutiveis).toFixed(2)}</p>
              <p className="text-xs text-slate-900/80 mt-1">Não dedutíveis</p>
            </CardContent>
          </Card>
        </div>

        {mostrarInforme && (
          <>
            <Card className="border-border/70 bg-card/90 shadow-lg">
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle className="text-foreground text-lg">Despesas Dedutíveis por Mês</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={exportarInformePDF} aria-label="Exportar PDF" className="gap-2 min-h-[44px] bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                    <FileDown className="w-4 h-4" />
                    Exportar PDF
                  </Button>
                  <Button onClick={exportarInformeRestituicao} aria-label="Exportar CSV" className="gap-2 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </Button>
                  <Button onClick={downloadArquivosDedutiveis} disabled={baixandoArquivos} aria-label="Baixar comprovantes dedutíveis" className="gap-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
                    {baixandoArquivos ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderDown className="w-4 h-4" />}
                    {baixandoArquivos ? 'Baixando...' : 'Baixar Comprovantes'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="block md:hidden space-y-3">
                  {dadosPorMes.map((mes) => (
                    <div key={mes.mes} className="rounded-xl border border-border bg-background/70 p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-foreground">{mes.mes}</span>
                        <span className="font-bold text-sm text-blue-700 dark:text-blue-300">R$ {mes.total.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {mes.saude > 0 && <><span className="text-muted-foreground">Saúde</span><span className="text-right text-foreground">R$ {mes.saude.toFixed(2)}</span></>}
                        {mes.dentista > 0 && <><span className="text-muted-foreground">Dentista</span><span className="text-right text-foreground">R$ {mes.dentista.toFixed(2)}</span></>}
                        {mes.educacao > 0 && <><span className="text-muted-foreground">Educação</span><span className="text-right text-foreground">R$ {mes.educacao.toFixed(2)}</span></>}
                        {mes.previdencia > 0 && <><span className="text-muted-foreground">Prev. Privada</span><span className="text-right text-foreground">R$ {mes.previdencia.toFixed(2)}</span></>}
                        {mes.pensao > 0 && <><span className="text-muted-foreground">Pensão</span><span className="text-right text-foreground">R$ {mes.pensao.toFixed(2)}</span></>}
                        {mes.dependentes > 0 && <><span className="text-muted-foreground">Dependentes</span><span className="text-right text-foreground">R$ {mes.dependentes.toFixed(2)}</span></>}
                      </div>
                      <p className="text-xs text-muted-foreground">{mes.quantidade} nota{mes.quantidade !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
                  {dadosPorMes.length > 0 && (
                    <div className="rounded-xl bg-secondary p-4 flex justify-between font-bold text-sm text-foreground">
                      <span>TOTAL ANUAL</span>
                      <span>R$ {dedutiveis.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                  <table className="w-full">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="text-left p-3 font-semibold text-foreground">Mês</th>
                        <th className="text-right p-3 text-sm font-semibold text-foreground">Saúde</th>
                        <th className="text-right p-3 text-sm font-semibold text-foreground">Dentista</th>
                        <th className="text-right p-3 text-sm font-semibold text-foreground">Educação</th>
                        <th className="text-right p-3 text-sm font-semibold text-foreground">Prev. Privada</th>
                        <th className="text-right p-3 text-sm font-semibold text-foreground">Pensão</th>
                        <th className="text-right p-3 text-sm font-semibold text-foreground">Dependentes</th>
                        <th className="text-right p-3 text-sm font-semibold text-foreground">Total Dedutível</th>
                        <th className="text-center p-3 text-sm font-semibold text-foreground">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosPorMes.map((mes) => (
                        <tr key={mes.mes} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3 text-sm font-medium text-foreground">{mes.mes}</td>
                          <td className="text-right p-3 text-sm text-muted-foreground">R$ {mes.saude.toFixed(2)}</td>
                          <td className="text-right p-3 text-sm text-muted-foreground">R$ {mes.dentista.toFixed(2)}</td>
                          <td className="text-right p-3 text-sm text-muted-foreground">R$ {mes.educacao.toFixed(2)}</td>
                          <td className="text-right p-3 text-sm text-muted-foreground">R$ {mes.previdencia.toFixed(2)}</td>
                          <td className="text-right p-3 text-sm text-muted-foreground">R$ {mes.pensao.toFixed(2)}</td>
                          <td className="text-right p-3 text-sm text-muted-foreground">R$ {mes.dependentes.toFixed(2)}</td>
                          <td className="text-right p-3 text-sm font-semibold text-blue-700 dark:text-blue-300">R$ {mes.total.toFixed(2)}</td>
                          <td className="text-center p-3 text-sm text-muted-foreground">{mes.quantidade}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-secondary font-bold">
                      <tr>
                        <td className="p-3 text-foreground">TOTAL ANUAL</td>
                        <td className="text-right p-3 text-foreground">R$ {dadosPorMes.reduce((sum, m) => sum + m.saude, 0).toFixed(2)}</td>
                        <td className="text-right p-3 text-foreground">R$ {dadosPorMes.reduce((sum, m) => sum + m.dentista, 0).toFixed(2)}</td>
                        <td className="text-right p-3 text-foreground">R$ {dadosPorMes.reduce((sum, m) => sum + m.educacao, 0).toFixed(2)}</td>
                        <td className="text-right p-3 text-foreground">R$ {dadosPorMes.reduce((sum, m) => sum + m.previdencia, 0).toFixed(2)}</td>
                        <td className="text-right p-3 text-foreground">R$ {dadosPorMes.reduce((sum, m) => sum + m.pensao, 0).toFixed(2)}</td>
                        <td className="text-right p-3 text-foreground">R$ {dadosPorMes.reduce((sum, m) => sum + m.dependentes, 0).toFixed(2)}</td>
                        <td className="text-right p-3 text-blue-700 dark:text-blue-300">R$ {dedutiveis.toFixed(2)}</td>
                        <td className="text-center p-3 text-foreground">{dadosPorMes.reduce((sum, m) => sum + m.quantidade, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {dadosPorMes.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/60" />
                    <p>Nenhuma despesa dedutível registrada em {anoSelecionado}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/90 shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Gráfico de Despesas Dedutíveis por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container overflow-hidden" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dadosPorMes}>
                      <CartesianGrid stroke={chartGridColor} strokeDasharray="4 4" />
                      <XAxis dataKey="mes" angle={-45} textAnchor="end" height={100} tick={{ fill: chartAxisColor, fontSize: 12 }} />
                      <YAxis width={60} tick={{ fill: chartAxisColor, fontSize: 12 }} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `R$ ${value.toFixed(2)}`} />
                      <Legend wrapperStyle={{ color: chartAxisColor }} />
                      <Bar dataKey="saude" fill="#ef4444" name="Saúde" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="dentista" fill="#06b6d4" name="Dentista" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="educacao" fill="#3b82f6" name="Educação" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="previdencia" fill="#059669" name="Prev. Privada" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="pensao" fill="#f97316" name="Pensão" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="dependentes" fill="#14b8a6" name="Dependentes" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!mostrarInforme && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/70 bg-card/90 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="chart-container overflow-hidden" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={dadosGrafico}>
                        <CartesianGrid stroke={chartGridColor} strokeDasharray="4 4" />
                        <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} tick={{ fill: chartAxisColor, fontSize: 12 }} />
                        <YAxis width={60} tick={{ fill: chartAxisColor, fontSize: 12 }} />
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `R$ ${value.toFixed(2)}`} />
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                          {dadosGrafico.map((entry, index) => (
                            <Cell key={index} fill={entry.cor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/90 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Distribuição por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="chart-container overflow-hidden" style={{ minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={dadosGrafico}
                          dataKey="valor"
                          nameKey="nome"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          label={false}
                        >
                          {dadosGrafico.map((entry, index) => (
                            <Cell key={index} fill={entry.cor} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `R$ ${value.toFixed(2)}`} />
                        <Legend formatter={(value) => <span className="text-sm" style={{ color: chartAxisColor }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/70 bg-card/90 shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Detalhamento por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                <div className="block sm:hidden divide-y divide-border">
                  {Object.entries(categorias).map(([key, cat]) => {
                    const total = totalPorCategoria[key];
                    const quantidade = notasAno.filter((n) => n.categoria === key).length;
                    const percentual = totalGeral > 0 ? total / totalGeral * 100 : 0;
                    if (total === 0) return null;
                    return (
                      <div key={key} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.cor }} />
                          <span className="font-medium text-sm text-foreground">{cat.nome}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-foreground">R$ {total.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{quantidade} nota{quantidade !== 1 ? 's' : ''} · {percentual.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between px-4 py-3 bg-secondary font-bold">
                    <span className="text-sm text-foreground">TOTAL</span>
                    <div className="text-right">
                      <p className="text-sm text-foreground">R$ {totalGeral.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{notasAno.length} notas · 100%</p>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block overflow-x-auto rounded-lg border border-border">
                  <table className="w-full">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="text-left p-3 font-semibold text-foreground">Categoria</th>
                        <th className="text-right p-3 font-semibold text-foreground">Quantidade</th>
                        <th className="text-right p-3 font-semibold text-foreground">Total</th>
                        <th className="text-right p-3 font-semibold text-foreground">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(categorias).map(([key, cat]) => {
                        const total = totalPorCategoria[key];
                        const quantidade = notasAno.filter((n) => n.categoria === key).length;
                        const percentual = totalGeral > 0 ? total / totalGeral * 100 : 0;
                        if (total === 0) return null;
                        return (
                          <tr key={key} className="border-b border-border hover:bg-muted/30">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                                <span className="font-medium text-foreground">{cat.nome}</span>
                              </div>
                            </td>
                            <td className="text-right p-3 text-muted-foreground">{quantidade}</td>
                            <td className="text-right p-3 font-semibold text-foreground">R$ {total.toFixed(2)}</td>
                            <td className="text-right p-3 text-muted-foreground">{percentual.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-secondary font-bold">
                      <tr>
                        <td className="p-3 text-foreground">TOTAL</td>
                        <td className="text-right p-3 text-foreground">{notasAno.length}</td>
                        <td className="text-right p-3 text-foreground">R$ {totalGeral.toFixed(2)}</td>
                        <td className="text-right p-3 text-foreground">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
