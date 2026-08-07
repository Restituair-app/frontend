import React, { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, Camera, Loader2, ArrowLeft, CheckCircle, Crown, Infinity, Archive, ShieldCheck } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import { hasPremiumAccess } from '@/utils/subscriptionPlan';

const PREMIUM_UPGRADE_URL = 'https://restitua.com/premium';
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_SIZE_LABEL = '10 MB';
const PREMIUM_MEMORY_TOOLTIP = 'Memória da Nota é uma funcionalidade Premium. Assine um plano no site do Restitua para acessar.';
const ACCEPTED_NOTE_FILE_TYPES = 'image/*,.heic,.heif,application/pdf,.pdf';
const ACCEPTED_MEMORY_FILE_TYPES = 'image/*,.heic,.heif';

const categorias = {
  saude: { nome: 'Saúde/Médica', icon: '🏥' },
  dentista: { nome: 'Dentista', icon: '🦷' },
  educacao: { nome: 'Educação', icon: '📚' },
  previdencia_privada: { nome: 'Previdência Privada', icon: '🏦' },
  pensao_alimenticia: { nome: 'Pensão Alimentícia Judicial', icon: '⚖️' },
  dependentes: { nome: 'Despesas com Dependentes', icon: '👨‍👩‍👧' },
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
  outros: { nome: 'Outros', icon: '📦' }
};

export default function UploadPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const memoriaInputRef = useRef(null);
  const isPremium = hasPremiumAccess(user);
  const [processando, setProcessando] = useState(false);
  const [etapa, setEtapa] = useState('upload'); // upload, extraindo, revisao, concluido
  const [imagemPreview, setImagemPreview] = useState(null);
  const [arquivo, setArquivo] = useState(null);
  const [dadosExtraidos, setDadosExtraidos] = useState(null);
  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [modalLimitePremiumAberto, setModalLimitePremiumAberto] = useState(false);
  const [memoriaArquivo, setMemoriaArquivo] = useState(null);
  const [memoriaPreview, setMemoriaPreview] = useState(null);
  const [salvandoMemoria, setSalvandoMemoria] = useState(false);

  const validateAttachmentSize = useCallback((file, label = 'arquivo') => {
    if (file?.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error(`O ${label} deve ter no máximo ${MAX_ATTACHMENT_SIZE_LABEL}.`);
      return false;
    }

    return true;
  }, []);

  const isHeicLikeFile = useCallback((file) => {
    const name = file?.name?.toLowerCase?.() || '';
    const type = file?.type?.toLowerCase?.() || '';
    return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif');
  }, []);

  const convertHeicToJpeg = useCallback(async (file) => {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.82,
    });

    const blob = Array.isArray(converted) ? converted[0] : converted;
    const fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg') || `nota-${Date.now()}.jpg`;

    return new File([blob], fileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  }, []);

  // Web Worker source for off-main-thread image compression.
  // Uses OffscreenCanvas (supported in all modern browsers) so the heavy
  // pixel-crunching never blocks the UI thread.
  const compressImage = useCallback((file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) { resolve(file); return; }

      const workerSrc = `
        self.onmessage = async (e) => {
          const { bitmap, width, height, fileName } = e.data;
          const canvas = new OffscreenCanvas(width, height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();
          const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.82 });
          self.postMessage({ blob, fileName });
        };
      `;
      const workerUrl = URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' }));
      const worker = new Worker(workerUrl);

      createImageBitmap(file).then((bitmap) => {
        const MAX = 1600;
        const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
        const w = Math.round(bitmap.width * scale);
        const h = Math.round(bitmap.height * scale);
        const fileName = file.name.replace(/\.[^.]+$/, '.jpg');

        worker.onmessage = (e) => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve(new File([e.data.blob], e.data.fileName, { type: 'image/jpeg' }));
        };
        worker.onerror = () => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve(file); // fallback: use original
        };

        // Transfer bitmap ownership to the worker (zero-copy)
        worker.postMessage({ bitmap, width: w, height: h, fileName }, [bitmap]);
      }).catch(() => resolve(file));
    });
  }, []);

  const prepareImageFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/') && !isHeicLikeFile(file)) {
      return file;
    }

    if (isHeicLikeFile(file)) {
      const jpeg = await convertHeicToJpeg(file);
      return compressImage(jpeg);
    }

    return compressImage(file);
  }, [compressImage, convertHeicToJpeg, isHeicLikeFile]);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (!validateAttachmentSize(file, 'arquivo da nota')) {
        e.target.value = '';
        return;
      }

      const compressed = await prepareImageFile(file);
      if (!validateAttachmentSize(compressed, 'arquivo da nota')) {
        e.target.value = '';
        return;
      }

      setArquivo(compressed);
      const reader = new FileReader();
      reader.onload = (ev) => setImagemPreview(ev.target.result);
      reader.readAsDataURL(compressed);
    } catch {
      toast.error('Não foi possível converter o arquivo HEIC. Tente enviar em JPG, PNG ou PDF.');
      e.target.value = '';
    }
  }, [prepareImageFile, validateAttachmentSize]);

  const handleCameraCapture = useCallback(async (file) => {
    setMostrarCamera(false);
    try {
      if (!validateAttachmentSize(file, 'arquivo da nota')) return;

      const compressed = await prepareImageFile(file);
      if (!validateAttachmentSize(compressed, 'arquivo da nota')) return;
      setArquivo(compressed);
      const reader = new FileReader();
      reader.onload = (ev) => setImagemPreview(ev.target.result);
      reader.readAsDataURL(compressed);
    } catch {
      toast.error('Não foi possível preparar a imagem. Tente enviar em JPG, PNG ou PDF.');
    }
  }, [prepareImageFile, validateAttachmentSize]);

  const handleMemoriaSelect = useCallback(async (e) => {
    if (!isPremium) {
      toast.info(PREMIUM_MEMORY_TOOLTIP);
      e.target.value = '';
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    try {
      if (!validateAttachmentSize(file, 'arquivo de memória')) {
        e.target.value = '';
        return;
      }

      const compressed = await prepareImageFile(file);
      if (!validateAttachmentSize(compressed, 'arquivo de memória')) {
        e.target.value = '';
        return;
      }

      setMemoriaArquivo(compressed);
      const reader = new FileReader();
      reader.onload = (ev) => setMemoriaPreview(ev.target.result);
      reader.readAsDataURL(compressed);
    } catch {
      toast.error('Não foi possível converter o arquivo HEIC. Tente enviar em JPG ou PNG.');
      e.target.value = '';
    }
  }, [isPremium, prepareImageFile, validateAttachmentSize]);

  const processarNota = async () => {
    if (!arquivo) return;

    setProcessando(true);
    setEtapa('extraindo');

    try {
      // Upload da imagem
      const { file_url, key } = await base44.integrations.Core.UploadFile({ file: arquivo });

      // Simular extração de dados com IA
      const prompt = `Analise esta nota fiscal e extraia os seguintes dados em formato JSON:
      - estabelecimento (nome do estabelecimento)
      - cnpj (se visível)
      - valor_total (valor total da nota)
      - data_emissao (data no formato YYYY-MM-DD)
      - numero_nota (número da nota fiscal)
      - categoria_sugerida (sugira uma categoria entre: saude, dentista, educacao, previdencia_privada, pensao_alimenticia, dependentes, alimentacao, transporte, moradia, servicos, vestuario, pets, farmacia, estetica_beleza, lazer_diversao, eletronicos, outros)
      - itens (array com descrição, quantidade, valor_unitario, valor_total de cada item se visível)`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [file_url],
        file_keys: key ? [key] : undefined,
        response_json_schema: {
          type: 'object',
          properties: {
            estabelecimento: { type: 'string' },
            cnpj: { type: 'string' },
            valor_total: { type: 'number' },
            data_emissao: { type: 'string' },
            numero_nota: { type: 'string' },
            categoria_sugerida: { type: 'string' },
            itens: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  descricao: { type: 'string' },
                  quantidade: { type: 'number' },
                  valor_unitario: { type: 'number' },
                  valor_total: { type: 'number' }
                }
              }
            }
          }
        }
      });

      setDadosExtraidos({
        ...resultado,
        imagem_url: file_url,
        categoria: resultado.categoria_sugerida || 'outros'
      });

      setEtapa('revisao');
    } catch (error) {
      alert('Erro ao processar a nota fiscal. Tente novamente.');
      setEtapa('upload');
    } finally {
      setProcessando(false);
    }
  };

  const salvarMutation = useMutation({
    mutationFn: (dados) => base44.entities.NotaFiscal.create(dados),
    onMutate: async (novaNota) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['notas'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['notas'] });

      // Optimistically prepend the new nota with a temporary id in all notas caches
      queryClient.setQueriesData({ queryKey: ['notas'] }, (old) => {
        const tempItem = { ...novaNota, id: `temp-${Date.now()}` };
        return old ? [tempItem, ...old] : [tempItem];
      });

      return { snapshots };
    },
    onError: (err, _vars, ctx) => {
      // Always restore snapshots atomically.
      ctx?.snapshots?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });

      if (err?.data?.message?.code === 'FREE_DAILY_NOTA_LIMIT_REACHED') {
        setModalLimitePremiumAberto(true);
        return;
      }

      toast.error('Erro ao salvar a nota fiscal. Tente novamente.');
    },
    onSuccess: () => {
      setEtapa('concluido');
      setTimeout(() => { window.location.replace('/'); }, 2000);
    },
    onSettled: () => {
      // Always reconcile with the server
      queryClient.invalidateQueries({ queryKey: ['notas'] });
    },
  });

  const salvarNota = useCallback(async () => {
    if (!dadosExtraidos) return;

    let payload = dadosExtraidos;

    if (isPremium && memoriaArquivo && !dadosExtraidos.memoria_url) {
      try {
        setSalvandoMemoria(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: memoriaArquivo });
        payload = {
          ...dadosExtraidos,
          memoria_url: file_url,
        };
        setDadosExtraidos(payload);
      } catch {
        toast.error('Erro ao enviar a memória da nota. Tente novamente.');
        return;
      } finally {
        setSalvandoMemoria(false);
      }
    }

    if (!payload.memoria_url) {
      const { memoria_url: _memoriaUrl, ...payloadSemMemoria } = payload;
      payload = payloadSemMemoria;
    }

    salvarMutation.mutate(payload);
  }, [dadosExtraidos, isPremium, memoriaArquivo, salvarMutation]);

  const handleInputChange = useCallback((field, value) => {
    setDadosExtraidos(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <>
    {mostrarCamera && (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setMostrarCamera(false)}
      />
    )}
    <Dialog open={modalLimitePremiumAberto} onOpenChange={setModalLimitePremiumAberto}>
      <DialogContent className="max-w-md rounded-3xl border-slate-200 p-6">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Crown className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-950 dark:text-slate-50">
            Limite diário atingido
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
          No seu plano atual você pode cadastrar até 10 notas por dia. Assinantes Premium podem enviar notas ilimitadas
          e manter os comprovantes organizados sem limite de histórico.
        </p>
        <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Infinity className="h-4 w-4 text-blue-700" />
            Notas fiscais ilimitadas
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Archive className="h-4 w-4 text-blue-700" />
            Histórico sem limite de anos
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <ShieldCheck className="h-4 w-4 text-blue-700" />
            Organização segura para o IR
          </div>
        </div>
        <Button
          onClick={() => {
            window.location.href = PREMIUM_UPGRADE_URL;
          }}
          className="h-12 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-700"
        >
          Assinar Premium
        </Button>
        <Button
          variant="ghost"
          onClick={() => setModalLimitePremiumAberto(false)}
          className="h-11 rounded-xl text-slate-600"
        >
          Talvez depois
        </Button>
      </DialogContent>
    </Dialog>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => { window.location.href = '/dashboard'; }}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {/* Etapa: Upload */}
        {etapa === 'upload' && (
          <Card className="shadow-lg border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
                <Camera className="w-6 h-6 text-blue-900 dark:text-blue-300" />
                Adicionar Nota Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-white/30 dark:bg-slate-900/40">
                {imagemPreview ? (
                  <div>
                    <img
                      src={imagemPreview}
                      alt="Preview"
                      className="max-h-96 mx-auto rounded-lg shadow-md mb-4"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImagemPreview(null);
                        setArquivo(null);
                      }}
                    >
                      Escolher outra imagem
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 mx-auto text-slate-900 dark:text-blue-900" />
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                      Escolha como adicionar a nota
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => setMostrarCamera(true)}
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-lg hover:from-slate-800 hover:to-blue-800 transition-all font-semibold shadow-lg"
                      >
                        <Camera className="w-5 h-5" />
                        Tirar Foto
                      </button>
                      <label className="cursor-pointer">
                        <div className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 dark:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-medium border border-slate-300">
                          <Upload className="w-5 h-5 text-blue-900" />
                          Escolher Arquivo
                        </div>
                        <input
                          type="file"
                          accept={ACCEPTED_NOTE_FILE_TYPES}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      Formatos aceitos: JPG, PNG, HEIC e PDF
                    </p>
                  </div>
                )}
              </div>

              {arquivo && (
                <Button
                  onClick={processarNota}
                  disabled={processando}
                  className="w-full bg-blue-600 hover:bg-blue-700 gap-2 py-6 text-lg"
                >
                  {processando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Processar Nota Fiscal
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Etapa: Extraindo */}
        {etapa === 'extraindo' && (
          <Card className="shadow-lg border-border/70">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Extraindo dados da nota fiscal...
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Aguarde enquanto processamos sua imagem com IA
              </p>
            </CardContent>
          </Card>
        )}

        {/* Etapa: Revisão */}
        {etapa === 'revisao' && dadosExtraidos && (
          <Card className="shadow-lg border-border/70">
            <CardHeader>
              <CardTitle>Revisar Dados Extraídos</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Verifique e edite os dados se necessário
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {imagemPreview && (
                <div>
                  <Label>Imagem da Nota</Label>
                  <img
                    src={imagemPreview}
                    alt="Nota fiscal"
                    className="max-h-48 rounded-lg shadow-md mt-2"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estabelecimento">Estabelecimento</Label>
                  <Input
                    id="estabelecimento"
                    value={dadosExtraidos.estabelecimento || ''}
                    onChange={(e) => handleInputChange('estabelecimento', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={dadosExtraidos.cnpj || ''}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="valor_total">Valor Total (R$)</Label>
                  <Input
                    id="valor_total"
                    type="number"
                    step="0.01"
                    value={dadosExtraidos.valor_total || ''}
                    onChange={(e) => handleInputChange('valor_total', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="data_emissao">Data de Emissão</Label>
                  <Input
                    id="data_emissao"
                    type="date"
                    value={dadosExtraidos.data_emissao || ''}
                    onChange={(e) => handleInputChange('data_emissao', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="numero_nota">Número da Nota</Label>
                  <Input
                    id="numero_nota"
                    value={dadosExtraidos.numero_nota || ''}
                    onChange={(e) => handleInputChange('numero_nota', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={dadosExtraidos.categoria}
                    onValueChange={(value) => handleInputChange('categoria', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categorias).map(([key, cat]) => (
                        <SelectItem key={key} value={key}>
                          {cat.icon} {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={dadosExtraidos.observacoes || ''}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                />
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
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {isPremium
                        ? 'Anexe uma foto relacionada a essa despesa no dia.'
                        : 'Disponível para assinantes Premium.'}
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
                            {memoriaArquivo || dadosExtraidos.memoria_url ? 'Trocar memória' : 'Adicionar memória'}
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

                {(memoriaPreview || dadosExtraidos.memoria_url) && (
                  <div className="mt-4">
                    <img
                      src={memoriaPreview || dadosExtraidos.memoria_url}
                      alt="Memória da nota"
                      className="max-h-48 rounded-xl border border-slate-200 object-contain shadow-sm dark:border-slate-700"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 text-slate-500"
                      onClick={() => {
                        setMemoriaArquivo(null);
                        setMemoriaPreview(null);
                        setDadosExtraidos((prev) => {
                          if (!prev) return prev;
                          const { memoria_url: _memoriaUrl, ...rest } = prev;
                          return rest;
                        });
                      }}
                    >
                      Remover memória
                    </Button>
                  </div>
                )}
              </div>

              <Button
                onClick={salvarNota}
                disabled={salvarMutation.isPending || salvandoMemoria}
                className="w-full bg-green-600 hover:bg-green-700 gap-2 py-6 text-lg"
              >
                {salvarMutation.isPending || salvandoMemoria ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {salvandoMemoria ? 'Enviando memória...' : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar e Salvar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Etapa: Concluído */}
        {etapa === 'concluido' && (
          <Card className="shadow-lg border-border/70">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Nota Fiscal Salva!
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Redirecionando para o dashboard...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}
