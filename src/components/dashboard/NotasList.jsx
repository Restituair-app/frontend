import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Building2, Calendar, Receipt, X, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditNotaModal from './EditNotaModal';
import ResignedImage from '@/components/common/ResignedImage';

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

export default function NotasList({ notas, categorias }) {
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [notaEditando, setNotaEditando] = useState(null);
  const [mesesOcultos, setMesesOcultos] = useState({});

  const handleView = useCallback((nota) => setNotaSelecionada(nota), []);
  const handleEdit = useCallback((nota) => setNotaEditando(nota), []);

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
