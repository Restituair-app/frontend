import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Building2, Calendar, Receipt, X, Pencil, ChevronDown, ChevronRight, FileText, Download, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditNotaModal from './EditNotaModal';
import ResignedImage from '@/components/common/ResignedImage';
import { resignS3UrlOnClient } from '@/lib/s3SignedUrlClient';
import { getWarrantyStatus } from '@/utils/warranty';
import { canDownloadIndividualNota } from '@/utils/subscriptionPlan';

const isPdfUrl = (url) => String(url || '').split('?')[0].toLowerCase().endsWith('.pdf');
const MEMORY_PAGE_SIZE = 5;

const getNotaCreatedDate = (nota) => {
  const rawDate = nota?.createdAt || nota?.created_date || nota?.data_emissao;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

function ResignedDocumentLink({ src, label }) {
  const [href, setHref] = useState(src || '');

  useEffect(() => {
    let mounted = true;
    setHref(src || '');

    if (!src) {
      return () => {
        mounted = false;
      };
    }

    resignS3UrlOnClient(src)
      .then((nextUrl) => {
        if (mounted && nextUrl) {
          setHref(nextUrl);
        }
      })
      .catch(() => {
        // mantém a URL original como fallback
      });

    return () => {
      mounted = false;
    };
  }, [src]);

  if (!src) return null;

  return (
    <a
      href={href || src}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl border border-border bg-background/70 p-4 text-foreground shadow-sm transition hover:bg-muted"
    >
      <FileText className="h-6 w-6 text-blue-600" />
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

// Month header component
const MesHeader = memo(function MesHeader({ chave, notasDoMes, oculto, toggleMes }) {
  const [ano, mes] = chave.split('-');
  const labelMes = format(new Date(Number(ano), Number(mes) - 1, 1), 'MMMM yyyy', { locale: ptBR });
  const totalMes = notasDoMes.reduce((sum, n) => sum + (n.valor_total || 0), 0);
  return (
    <button
      className="flex items-center justify-between w-full bg-secondary hover:bg-muted transition-colors px-4 py-2.5 rounded-lg min-h-[44px] mb-2"
      onClick={() => toggleMes(chave)}
      aria-expanded={!oculto}
    >
      <div className="flex items-center gap-2">
        {oculto
          ? <ChevronRight className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        <span className="font-semibold text-foreground capitalize">{labelMes}</span>
        <span className="text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-full">
          {notasDoMes.length} nota{notasDoMes.length !== 1 ? 's' : ''}
        </span>
      </div>
      <span className="font-bold text-foreground text-sm">R$ {totalMes.toFixed(2)}</span>
    </button>
  );
});

const downloadFromUrl = async (url, fileName) => {
  const signedUrl = (await resignS3UrlOnClient(url)) || url;
  let response = await fetch(signedUrl);

  if (!response.ok) {
    const refreshedUrl = await resignS3UrlOnClient(signedUrl, true);
    if (refreshedUrl) {
      response = await fetch(refreshedUrl);
    }
  }

  if (!response.ok) {
    throw new Error('Não foi possível baixar o arquivo.');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};

const getNotaFileName = (nota, fallback = 'nota-fiscal') => {
  const sourceUrl = String(nota?.imagem_url || '').split('?')[0];
  const extension = sourceUrl.includes('.') ? sourceUrl.split('.').pop() : 'jpg';
  const safeName = (nota?.estabelecimento || fallback).replace(/[^a-zA-Z0-9]/g, '_');
  return `${safeName}_${nota?.data_emissao || 'sem-data'}.${extension || 'jpg'}`;
};

const getMemoryFileName = (nota, fallback = 'memoria') => {
  const sourceUrl = String(nota?.memoria_url || '').split('?')[0];
  const extension = sourceUrl.includes('.') ? sourceUrl.split('.').pop() : 'jpg';
  const safeName = (nota?.estabelecimento || fallback).replace(/[^a-zA-Z0-9]/g, '_');
  return `memoria_${safeName}_${nota?.data_emissao || 'sem-data'}.${extension || 'jpg'}`;
};

const NotaRow = memo(function NotaRow({ nota, categorias, onView, onEdit }) {
  const cat = categorias[nota.categoria];
  const Icon = cat?.icon;
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow mb-3">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
            onClick={() => onView(nota)}
          >
            <div className={cn("p-2.5 rounded-lg shrink-0", cat?.cor, "bg-opacity-20")}>
              {Icon ? (
                <Icon className={cn("w-5 h-5", cat?.iconColor || 'text-foreground')} aria-hidden="true" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <h3 className="font-semibold text-foreground truncate text-sm md:text-base">
                  {nota.estabelecimento || 'Estabelecimento não informado'}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-1 text-xs md:text-sm">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  {format(new Date(nota.data_emissao), "dd/MM/yyyy")}
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-xs md:text-sm font-medium", cat?.cor, "bg-opacity-20")}>
                  {cat?.nome}
                </span>
                {nota.memoria_url ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
                    <ImagePlus className="h-3 w-3" aria-hidden="true" />
                    Memória
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 shrink-0">
            <p className="text-lg sm:text-xl font-bold text-foreground">
              R$ {nota.valor_total?.toFixed(2)}
            </p>
            <div className="flex gap-1">
            <Button
              variant="ghost" size="sm" aria-label={`Ver detalhes de ${nota.estabelecimento || 'nota'}`}
              className="gap-1 min-h-[44px] px-2 text-xs md:text-sm"
              onClick={() => onView(nota)}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Ver
            </Button>
            <Button
              variant="ghost" size="sm" aria-label={`Editar nota de ${nota.estabelecimento || 'nota'}`}
              className="gap-1 min-h-[44px] px-2 text-xs md:text-sm text-blue-600 hover:text-blue-700"
              onClick={() => onEdit(nota)}
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Editar
            </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

function MemoryGallery({ notas, currentUser }) {
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [visibleCounts, setVisibleCounts] = useState({
    week: MEMORY_PAGE_SIZE,
    month: MEMORY_PAGE_SIZE,
    older: MEMORY_PAGE_SIZE,
  });

  const memorySections = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sections = [
      { key: 'week', title: 'Última semana de notas', items: [] },
      { key: 'month', title: 'Último mês de notas', items: [] },
      { key: 'older', title: 'Anteriores', items: [] },
    ];

    notas
      .filter((nota) => nota.memoria_url && canDownloadIndividualNota(currentUser, nota))
      .sort((a, b) => (getNotaCreatedDate(b)?.getTime() || 0) - (getNotaCreatedDate(a)?.getTime() || 0))
      .forEach((nota) => {
        const createdDate = getNotaCreatedDate(nota);
        if (!createdDate) {
          sections[2].items.push(nota);
          return;
        }

        if (createdDate >= sevenDaysAgo && createdDate <= now) {
          sections[0].items.push(nota);
          return;
        }

        if (createdDate >= thirtyDaysAgo && createdDate < sevenDaysAgo) {
          sections[1].items.push(nota);
          return;
        }

        sections[2].items.push(nota);
      });

    return sections.filter((section) => section.items.length > 0);
  }, [currentUser, notas]);

  const handleDownloadMemory = useCallback(async (nota) => {
    if (!nota?.memoria_url) {
      toast.info('Esta memória não possui arquivo anexado.');
      return;
    }

    if (!canDownloadIndividualNota(currentUser, nota)) {
      toast.info('No plano Free, as memórias seguem o limite de notas enviadas nos últimos 12 meses.');
      return;
    }

    try {
      await downloadFromUrl(nota.memoria_url, getMemoryFileName(nota));
      toast.success('Memória baixada com sucesso.');
    } catch {
      toast.error('Não foi possível baixar esta memória. Tente novamente.');
    }
  }, [currentUser]);

  if (memorySections.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="mt-4 border-amber-200/70 bg-amber-50/50 shadow-md dark:border-amber-300/20 dark:bg-amber-400/5">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            <h3 className="text-sm font-semibold text-foreground">Galeria de memórias</h3>
          </div>

          <div className="space-y-5">
            {memorySections.map((section) => {
              const visibleItems = section.items.slice(0, visibleCounts[section.key] || MEMORY_PAGE_SIZE);
              const hasMore = section.items.length > visibleItems.length;

              return (
                <section key={section.key} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{section.title}</h4>
                    <span className="text-[11px] font-semibold text-muted-foreground">{section.items.length} memória{section.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {visibleItems.map((nota) => (
                      <button
                        key={`memory-${section.key}-${nota.id}`}
                        type="button"
                        onClick={() => setSelectedMemory(nota)}
                        className="overflow-hidden rounded-xl border border-border bg-background text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {isPdfUrl(nota.memoria_url) ? (
                          <div className="flex h-28 items-center justify-center bg-muted">
                            <FileText className="h-8 w-8 text-blue-600" />
                          </div>
                        ) : (
                          <ResignedImage src={nota.memoria_url} alt={`Memória de ${nota.estabelecimento || 'nota'}`} className="h-28 w-full object-cover" />
                        )}
                        <div className="p-2">
                          <p className="truncate text-xs font-semibold text-foreground">{nota.estabelecimento || 'Nota fiscal'}</p>
                          <p className="text-[11px] text-muted-foreground">{nota.data_emissao || '-'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {hasMore ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        setVisibleCounts((current) => ({
                          ...current,
                          [section.key]: (current[section.key] || MEMORY_PAGE_SIZE) + MEMORY_PAGE_SIZE,
                        }))
                      }
                    >
                      Carregar mais memórias
                    </Button>
                  ) : null}
                </section>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedMemory)} onOpenChange={(open) => !open && setSelectedMemory(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Memória da Nota
              <Button variant="ghost" size="icon" aria-label="Fechar memória" onClick={() => setSelectedMemory(null)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedMemory ? (
            <div className="space-y-4">
              {isPdfUrl(selectedMemory.memoria_url) ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-border bg-muted p-8 text-center">
                  <FileText className="mb-3 h-12 w-12 text-blue-600" />
                  <p className="text-sm font-semibold text-foreground">Memória em PDF</p>
                </div>
              ) : (
                <ResignedImage src={selectedMemory.memoria_url} alt="Memória da nota" className="max-h-[70vh] w-full rounded-2xl object-contain" />
              )}
              <Button className="w-full gap-2" onClick={() => handleDownloadMemory(selectedMemory)}>
                <Download className="h-4 w-4" />
                Baixar memória
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function NotasList({ notas, categorias, currentUser, showMemoryGallery = false }) {
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [notaEditando, setNotaEditando] = useState(null);
  const [mesesOcultos, setMesesOcultos] = useState({});

  const handleView = useCallback((nota) => setNotaSelecionada(nota), []);
  const handleEdit = useCallback((nota) => setNotaEditando(nota), []);
  const handleDownloadNota = useCallback(async (nota) => {
    if (!nota?.imagem_url) {
      toast.info('Esta nota não possui arquivo anexado.');
      return;
    }

    if (!canDownloadIndividualNota(currentUser, nota)) {
      toast.info('No plano Free, o download individual libera apenas notas enviadas nos últimos 12 meses.');
      return;
    }

    try {
      await downloadFromUrl(nota.imagem_url, getNotaFileName(nota));
      toast.success('Nota baixada com sucesso.');
    } catch {
      toast.error('Não foi possível baixar esta nota. Tente novamente.');
    }
  }, [currentUser]);

  // Group by month
  const notasPorMes = useMemo(() => {
    const groups = {};
    notas.forEach((nota) => {
      const chave = format(new Date(nota.data_emissao), 'yyyy-MM');
      if (!groups[chave]) groups[chave] = [];
      groups[chave].push(nota);
    });
    return groups;
  }, [notas]);

  const mesesOrdenados = useMemo(() =>
    Object.keys(notasPorMes).sort((a, b) => b.localeCompare(a)),
  [notasPorMes]);

  // Inicializa todos os meses como ocultos
  useEffect(() => {
    if (mesesOrdenados.length === 0) return;
    setMesesOcultos(
      Object.fromEntries(mesesOrdenados.map((m) => [m, true]))
    );
  }, [mesesOrdenados.join(',')]);

  const toggleMes = useCallback((chave) =>
    setMesesOcultos((prev) => ({ ...prev, [chave]: !prev[chave] })), []);

  if (notas.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">Nenhuma nota fiscal encontrada</p>
          <p className="text-muted-foreground text-sm mt-2">
            Adicione sua primeira nota fiscal para começar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {mesesOrdenados.map((chave) => {
          const notasDoMes = notasPorMes[chave];
          const oculto = mesesOcultos[chave] === true;
          return (
            <div key={chave}>
              <MesHeader chave={chave} notasDoMes={notasDoMes} oculto={oculto} toggleMes={toggleMes} />
              {!oculto && (
                <div className="space-y-3">
                  {notasDoMes.map((nota) => (
                    <NotaRow key={nota.id} nota={nota} categorias={categorias} onView={handleView} onEdit={handleEdit} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {showMemoryGallery ? <MemoryGallery notas={notas} currentUser={currentUser} /> : null}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={!!notaSelecionada} onOpenChange={() => setNotaSelecionada(null)}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-modal="true"
          aria-label={notaSelecionada ? `Detalhes da nota fiscal de ${notaSelecionada.estabelecimento || 'estabelecimento'}` : 'Detalhes da nota fiscal'}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalhes da Nota Fiscal
              <Button variant="ghost" size="icon" aria-label="Fechar detalhes da nota fiscal" onClick={() => setNotaSelecionada(null)}>
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {notaSelecionada && (
            <div className="space-y-6">
              {notaSelecionada.imagem_url && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Imagem da Nota</h4>
                  <ResignedImage
                    src={notaSelecionada.imagem_url}
                    alt="Nota fiscal"
                    className="w-full rounded-lg shadow-md"
                  />
                  <Button
                    variant="outline"
                    className="mt-3 w-full gap-2"
                    onClick={() => handleDownloadNota(notaSelecionada)}
                  >
                    <Download className="h-4 w-4" />
                    Baixar esta nota
                  </Button>
                </div>
              )}
              {notaSelecionada.memoria_url && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Memória da Nota</h4>
                  {isPdfUrl(notaSelecionada.memoria_url) ? (
                    <ResignedDocumentLink src={notaSelecionada.memoria_url} label="Abrir memória em PDF" />
                  ) : (
                    <ResignedImage
                      src={notaSelecionada.memoria_url}
                      alt="Memória da nota"
                      className="w-full rounded-lg shadow-md"
                    />
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Estabelecimento', notaSelecionada.estabelecimento],
                  ['CNPJ', notaSelecionada.cnpj],
                  ['Data de Emissão', format(new Date(notaSelecionada.data_emissao), "dd/MM/yyyy")],
                  ['Valor Total', `R$ ${notaSelecionada.valor_total?.toFixed(2)}`],
                  ['Categoria', categorias[notaSelecionada.categoria]?.nome],
                  ['Número da Nota', notaSelecionada.numero_nota],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground">{value || '-'}</p>
                  </div>
                ))}
              </div>

              {notaSelecionada.categoria === 'eletronicos' && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-400/20 dark:bg-slate-900">
                  <p className="text-sm text-muted-foreground">Garantia</p>
                  <p className="font-semibold text-foreground">
                    {notaSelecionada.garantia_meses ? `${notaSelecionada.garantia_meses} meses` : 'Não informada'}
                  </p>
                  <p className="mt-1 text-sm font-medium text-blue-800 dark:text-blue-200">
                    {getWarrantyStatus(notaSelecionada.data_emissao, notaSelecionada.garantia_meses)}
                  </p>
                </div>
              )}

              {notaSelecionada.itens?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Itens da Nota</h4>
                  <div className="space-y-2">
                    {notaSelecionada.itens.map((item, idx) => (
                      <div key={idx} className="p-3 bg-secondary rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">{item.descricao}</p>
                            <p className="text-sm text-muted-foreground">{item.quantidade} x R$ {item.valor_unitario?.toFixed(2)}</p>
                          </div>
                          <p className="font-semibold text-foreground">R$ {item.valor_total?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {notaSelecionada.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-foreground mt-1">{notaSelecionada.observacoes}</p>
                </div>
              )}

              <Button
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => { setNotaSelecionada(null); setNotaEditando(notaSelecionada); }}
              >
                <Pencil className="w-4 h-4" />
                Editar esta nota
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {notaEditando && (
        <EditNotaModal nota={notaEditando} onClose={() => setNotaEditando(null)} />
      )}
    </>
  );
}
