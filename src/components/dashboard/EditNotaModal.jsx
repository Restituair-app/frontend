import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Camera, Loader2, Save, Trash2 } from 'lucide-react';
import ResignedImage from '@/components/common/ResignedImage';
import { hasPremiumAccess } from '@/utils/subscriptionPlan';

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_SIZE_ERROR_MESSAGE = 'O arquivo selecionado tem mais de 10 MB. Escolha uma imagem menor para continuar.';
const PREMIUM_MEMORY_TOOLTIP = 'Memória da Nota é uma funcionalidade Premium. Assine um plano no site do Restitua para acessar.';
const ACCEPTED_MEMORY_FILE_TYPES = 'image/*,.heic,.heif';

const categorias = {
  saude: { nome: 'Médico / Saúde', icon: '🏥' },
  dentista: { nome: 'Dentista / Saúde', icon: '🦷' },
  educacao: { nome: 'Educação', icon: '📚' },
  previdencia_privada: { nome: 'Previdência Privada', icon: '🏦' },
  pensao_alimenticia: { nome: 'Pensão Alimentícia', icon: '⚖️' },
  dependentes: { nome: 'Dependentes', icon: '👨‍👩‍👧' },
  alimentacao: { nome: 'Alimentação', icon: '🍽️' },
  transporte: { nome: 'Transporte', icon: '🚗' },
  moradia: { nome: 'Moradia', icon: '🏠' },
  servicos: { nome: 'Serviços', icon: '🔧' },
  vestuario: { nome: 'Vestuário', icon: '👔' },
  pets: { nome: 'Pets', icon: '🐾' },
  farmacia: { nome: 'Farmácia', icon: '💊' },
  estetica_beleza: { nome: 'Estética / Beleza', icon: '✨' },
  lazer_diversao: { nome: 'Lazer / Diversão', icon: '🎮' },
  eletronicos: { nome: 'Eletrônicos', icon: '💻' },
  outros: { nome: 'Outros', icon: '📦' },
};

export default function EditNotaModal({ nota, onClose }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const memoriaInputRef = useRef(null);
  const isPremium = hasPremiumAccess(user);
  const [dados, setDados] = useState({ ...nota });
  const [confirmarDelete, setConfirmarDelete] = useState(false);
  const [memoriaArquivo, setMemoriaArquivo] = useState(null);
  const [memoriaPreview, setMemoriaPreview] = useState(null);
  const [salvandoMemoria, setSalvandoMemoria] = useState(false);

  const handleChange = (field, value) => {
    setDados(prev => ({ ...prev, [field]: value }));
  };

  const updateMutation = useMutation({
    mutationFn: (updated) => base44.entities.NotaFiscal.update(nota.id, updated),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['notas'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['notas'] });
      queryClient.setQueriesData({ queryKey: ['notas'] }, (old) =>
        old ? old.map((n) => (n.id === nota.id ? { ...n, ...updated } : n)) : old
      );
      return { snapshots };
    },
    onError: (_err, _updated, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error('Erro ao salvar a nota. As alterações foram revertidas.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notas'] }),
    onSuccess: () => onClose(),
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.NotaFiscal.delete(nota.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notas'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['notas'] });
      queryClient.setQueriesData({ queryKey: ['notas'] }, (old) =>
        old ? old.filter((n) => n.id !== nota.id) : old
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error('Erro ao deletar a nota. A operação foi revertida.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notas'] }),
    onSuccess: () => onClose(),
  });

  const salvando = updateMutation.isPending || salvandoMemoria;
  const deletando = deleteMutation.isPending;

  const isUploadSizeError = (error) => {
    const message = String(error?.message || error?.data?.message?.message || '').toLowerCase();
    return error?.status === 413 || message.includes('10 mb') || message.includes('file too large') || message.includes('limit_file_size');
  };

  const handleMemoriaSelect = (event) => {
    if (!isPremium) {
      toast.info(PREMIUM_MEMORY_TOOLTIP);
      event.target.value = '';
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error(UPLOAD_SIZE_ERROR_MESSAGE);
      event.target.value = '';
      return;
    }

    setMemoriaArquivo(file);
    setMemoriaPreview(URL.createObjectURL(file));
  };

  const handleSalvar = async () => {
    let payload = dados;

    if (isPremium && memoriaArquivo) {
      try {
        setSalvandoMemoria(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: memoriaArquivo });
        payload = { ...dados, memoria_url: file_url };
        setDados(payload);
      } catch (error) {
        toast.error(isUploadSizeError(error) ? UPLOAD_SIZE_ERROR_MESSAGE : 'Erro ao enviar a memória da nota. Tente novamente.');
        return;
      } finally {
        setSalvandoMemoria(false);
      }
    }

    updateMutation.mutate(payload);
  };
  const handleDeletar = () => deleteMutation.mutate();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl flex flex-col max-h-[90vh] p-0 gap-0"
        aria-modal="true"
        aria-label={`Editar nota fiscal de ${nota.estabelecimento || 'estabelecimento'}`}
        aria-describedby="edit-nota-desc"
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle id="edit-nota-desc">Editar Nota Fiscal</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {nota.imagem_url && (
            <ResignedImage
              src={nota.imagem_url}
              alt="Nota fiscal"
              className="w-full max-h-48 object-contain rounded-lg shadow-md"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-estabelecimento">Estabelecimento</Label>
              <Input id="edit-estabelecimento" value={dados.estabelecimento || ''} onChange={e => handleChange('estabelecimento', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-cnpj">CNPJ</Label>
              <Input id="edit-cnpj" value={dados.cnpj || ''} onChange={e => handleChange('cnpj', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-valor">Valor Total (R$)</Label>
              <Input id="edit-valor" type="number" step="0.01" value={dados.valor_total || ''} onChange={e => handleChange('valor_total', parseFloat(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="edit-data">Data de Emissão</Label>
              <Input id="edit-data" type="date" value={dados.data_emissao || ''} onChange={e => handleChange('data_emissao', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-numero">Número da Nota</Label>
              <Input id="edit-numero" value={dados.numero_nota || ''} onChange={e => handleChange('numero_nota', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Select value={dados.categoria} onValueChange={val => handleChange('categoria', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categorias).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>{cat.icon} {cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-obs">Observações</Label>
            <Textarea id="edit-obs" value={dados.observacoes || ''} onChange={e => handleChange('observacoes', e.target.value)} rows={3} />
          </div>

          <div
            className={`rounded-2xl border border-dashed p-4 transition ${
              isPremium
                ? 'border-slate-300 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/50'
                : 'border-slate-200 bg-slate-100/80 opacity-70 dark:border-slate-700 dark:bg-slate-800/70'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label className={!isPremium ? 'text-slate-500 dark:text-slate-400' : ''}>Memória da Nota</Label>
                <p className="text-sm text-muted-foreground">
                  {isPremium ? 'Foto extra relacionada a essa despesa.' : 'Disponível para assinantes Premium.'}
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      onClick={() => {
                        if (!isPremium) {
                          toast.info(PREMIUM_MEMORY_TOOLTIP);
                        }
                      }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        aria-disabled={!isPremium}
                        className={`gap-2 ${!isPremium ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300' : ''}`}
                        onClick={() => {
                          if (!isPremium) {
                            toast.info(PREMIUM_MEMORY_TOOLTIP);
                            return;
                          }
                          memoriaInputRef.current?.click();
                        }}
                      >
                        <Camera className="h-4 w-4" />
                        {memoriaArquivo || dados.memoria_url ? 'Trocar memória' : 'Adicionar memória'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!isPremium ? <TooltipContent>{PREMIUM_MEMORY_TOOLTIP}</TooltipContent> : null}
                </Tooltip>
              </TooltipProvider>
              <input
                ref={memoriaInputRef}
                type="file"
                accept={ACCEPTED_MEMORY_FILE_TYPES}
                capture="environment"
                onChange={handleMemoriaSelect}
                className="hidden"
              />
            </div>

            {(memoriaPreview || dados.memoria_url) && (
              <div className="mt-4">
                {memoriaPreview ? (
                  <img
                    src={memoriaPreview}
                    alt="Memória da nota"
                    className="max-h-48 rounded-xl border border-slate-200 object-contain shadow-sm dark:border-slate-700"
                  />
                ) : (
                  <ResignedImage
                    src={dados.memoria_url}
                    alt="Memória da nota"
                    className="max-h-48 rounded-xl border border-slate-200 object-contain shadow-sm dark:border-slate-700"
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 text-slate-500"
                  onClick={() => {
                    setMemoriaArquivo(null);
                    setMemoriaPreview(null);
                    handleChange('memoria_url', null);
                  }}
                >
                  Remover memória
                </Button>
              </div>
            )}
          </div>

        </div>

        {/* Rodapé fixo — sempre visível independente do scroll */}
        <div className="flex justify-between px-6 py-4 border-t bg-background">
            {!confirmarDelete ? (
              <Button variant="destructive" aria-label="Deletar nota fiscal" onClick={() => setConfirmarDelete(true)} className="gap-2 min-h-[44px]">
                <Trash2 className="w-4 h-4" />
                Deletar Nota
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-destructive">Tem certeza?</span>
                <Button variant="destructive" aria-label="Confirmar exclusão" onClick={handleDeletar} disabled={deletando} size="sm" className="min-h-[44px]">
                  {deletando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, deletar'}
                </Button>
                <Button variant="ghost" aria-label="Cancelar exclusão" onClick={() => setConfirmarDelete(false)} size="sm" className="min-h-[44px]">Cancelar</Button>
              </div>
            )}

            <Button onClick={handleSalvar} disabled={salvando} aria-label="Salvar alterações" className="gap-2 min-h-[44px] bg-blue-600 hover:bg-blue-700">
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {salvandoMemoria ? 'Enviando memória...' : 'Salvar'}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
