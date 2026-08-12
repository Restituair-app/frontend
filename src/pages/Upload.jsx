import React, { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Camera, FileText, Loader2, ArrowLeft, CheckCircle, Crown, Infinity, Archive, ShieldCheck, Info } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import WarrantyInfoModal from '@/components/common/WarrantyInfoModal';
import { getWarrantyStatus, parseWarrantyMonths } from '@/utils/warranty';

const PREMIUM_UPGRADE_URL = 'https://restitua.com/premium';
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_SIZE_LABEL = '10 MB';
const UPLOAD_SIZE_ERROR_MESSAGE = `O arquivo selecionado tem mais de ${MAX_ATTACHMENT_SIZE_LABEL}. Escolha uma imagem ou PDF menor para continuar.`;
const ACCEPTED_NOTE_FILE_TYPES = 'image/*,.heic,.heif,application/pdf,.pdf';
const ACCEPTED_MEMORY_FILE_TYPES = 'image/*,.heic,.heif,application/pdf,.pdf';

const isPdfLikeValue = (value) => {
  if (!value) return false;
  if (typeof value === 'string') {
    return value.split('?')[0].toLowerCase().endsWith('.pdf');
  }

  const name = value.name?.toLowerCase?.() || '';
  const type = value.type?.toLowerCase?.() || '';
  return type === 'application/pdf' || name.endsWith('.pdf');
};

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
  eletronicos: { nome: 'Eletrônicos / Eletrodomésticos', icon: '💻' },
  outros: { nome: 'Outros', icon: '📦' }
};

export default function UploadPage() {
  const queryClient = useQueryClient();
  const memoriaInputRef = useRef(null);
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
  const [warrantyInfoOpen, setWarrantyInfoOpen] = useState(false);

  const validateAttachmentSize = useCallback((file, label = 'arquivo') => {
    if (file?.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error(UPLOAD_SIZE_ERROR_MESSAGE);
      return false;
    }

    return true;
  }, []);

  const isUploadSizeError = useCallback((error) => {
    const message = String(error?.message || error?.data?.message?.message || '').toLowerCase();
    return error?.status === 413 || message.includes('10 mb') || message.includes('file too large') || message.includes('limit_file_size');
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
      toast.error('Não foi possível converter o arquivo HEIC. Tente enviar em JPG, PNG ou PDF.');
      e.target.value = '';
    }
  }, [prepareImageFile, validateAttachmentSize]);

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
      if (isUploadSizeError(error)) {
        toast.error(UPLOAD_SIZE_ERROR_MESSAGE);
      } else {
        toast.error('Erro ao processar a nota fiscal. Tente novamente.');
      }
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

    if (memoriaArquivo && !dadosExtraidos.memoria_url) {
      try {
        setSalvandoMemoria(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: memoriaArquivo });
        payload = {
          ...dadosExtraidos,
          memoria_url: file_url,
        };
        setDadosExtraidos(payload);
      } catch (error) {
        toast.error(isUploadSizeError(error) ? UPLOAD_SIZE_ERROR_MESSAGE : 'Erro ao enviar a memória da nota. Tente novamente.');
        return;
      } finally {
        setSalvandoMemoria(false);
      }
    }

    if (!payload.memoria_url) {
      const { memoria_url: _memoriaUrl, ...payloadSemMemoria } = payload;
      payload = payloadSemMemoria;
    }

    payload = {
      ...payload,
      garantia_meses: payload.categoria === 'eletronicos' ? payload.garantia_meses ?? null : null,
    };

    salvarMutation.mutate(payload);
  }, [dadosExtraidos, isUploadSizeError, memoriaArquivo, salvarMutation]);

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

              {dadosExtraidos.categoria === 'eletronicos' && (
                  <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-3 flex items-center gap-2">
                      <Label htmlFor="garantia_meses">Tempo de garantia</Label>
                      <button
                        type="button"
                        aria-label="Controle a garantia do seu produto"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800"
                        onClick={() => setWarrantyInfoOpen(true)}
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-medium text-muted-foreground">Controle a garantia do seu produto</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.2fr]">
                      <Input
                        id="garantia_meses"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder="Ex: 12 meses"
                        value={dadosExtraidos.garantia_meses ?? ''}
                        onChange={(e) => handleInputChange('garantia_meses', parseWarrantyMonths(e.target.value))}
                      />
                      <div className="flex min-h-[44px] items-center rounded-xl border border-blue-100 bg-white px-3 text-sm font-semibold text-blue-900 dark:border-blue-400/20 dark:bg-slate-950 dark:text-blue-200">
                        {getWarrantyStatus(dadosExtraidos.data_emissao, dadosExtraidos.garantia_meses)}
                      </div>
                    </div>
                  </div>
              )}

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
                className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 transition dark:border-slate-700 dark:bg-slate-900/50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label>Memória da Nota</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      Anexe uma foto ou PDF relacionado a essa despesa no dia.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => memoriaInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    {memoriaArquivo || dadosExtraidos.memoria_url ? 'Trocar memória' : 'Adicionar memória'}
                  </Button>
                  <input
                    ref={memoriaInputRef}
                    type="file"
                    accept={ACCEPTED_MEMORY_FILE_TYPES}
                    onChange={handleMemoriaSelect}
                    className="hidden"
                  />
                </div>

                {(memoriaPreview || dadosExtraidos.memoria_url) && (
                  <div className="mt-4">
                    {isPdfLikeValue(memoriaArquivo || dadosExtraidos.memoria_url) ? (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <span className="text-sm font-medium">
                          {memoriaArquivo?.name || 'Memória em PDF anexada'}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={memoriaPreview || dadosExtraidos.memoria_url}
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
    <WarrantyInfoModal open={warrantyInfoOpen} onClose={() => setWarrantyInfoOpen(false)} />
    </>
  );
}
