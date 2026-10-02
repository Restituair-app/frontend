import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, CreditCard, Download, Eye, FileCheck2, FileText, Landmark, Lock, ShieldCheck, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { hasBasicAccess } from '@/utils/subscriptionPlan';

const statusLabels = {
  enviada: 'Enviada', em_analise: 'Em análise', documentacao_pendente: 'Documentação pendente', proposta_disponivel: 'Proposta disponível',
  aguardando_assinatura: 'Aguardando assinatura', aguardando_cartao: 'Aguardando cartão', revisao_final: 'Revisão final', aprovada: 'Aprovada',
  pix_realizado: 'Pix realizado', em_pagamento: 'Em pagamento', quitada: 'Quitada', rejeitada: 'Rejeitada', cancelada: 'Cancelada',
};
const documents = [
  ['identity', 'Documento de identidade'], ['address_proof', 'Comprovante de endereço'],
  ['last_refund_proof', 'Comprovante da última restituição'], ['tax_return_receipt', 'Recibo da declaração de IR'],
  ['guarantor_identity', 'Documento do fiador', 'guarantor'], ['guarantor_address_proof', 'Endereço do fiador', 'guarantor'],
  ['surety_insurance', 'Seguro-fiança', 'surety_insurance'], ['signed_contract', 'Contrato assinado pelo gov.br', 'signed'],
  ['signed_promissory_note', 'Nota promissória assinada pelo gov.br', 'signed'], ['complementary', 'Documento complementar'],
];
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((value || 0) / 100);
const formatDate = (value) => value ? new Date(value).toLocaleDateString('pt-BR') : '-';

export default function AntecipacaoRestituicao() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [guaranteeType, setGuaranteeType] = useState('guarantor');
  const [accepted, setAccepted] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [uploading, setUploading] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  const eligible = hasBasicAccess(user);
  const requestsQuery = useQuery({ queryKey: ['refund-advance-requests'], queryFn: base44.refundAdvance.listRequests, enabled: Boolean(user) && eligible, retry: false });
  const modelsQuery = useQuery({ queryKey: ['refund-advance-models'], queryFn: base44.refundAdvance.listModels, enabled: Boolean(user) && eligible, retry: false });
  const active = requestsQuery.data?.[0];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['refund-advance-requests'] });
  const createMutation = useMutation({ mutationFn: () => base44.refundAdvance.createRequest({ hasReceivedLastRefund: true, guaranteeType, acceptedTerms: accepted }), onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const acceptMutation = useMutation({ mutationFn: () => base44.refundAdvance.acceptProposal(active.id), onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const cardMutation = useMutation({ mutationFn: () => base44.refundAdvance.createCardSetup(active.id), onSuccess: (result) => { refresh(); if (result.checkoutUrl) window.location.href = result.checkoutUrl; else toast.success('Forma de pagamento registrada.'); }, onError: (error) => toast.error(error.message) });
  const visibleDocuments = useMemo(() => documents.filter(([, , rule]) => !rule || rule === active?.guaranteeType || (rule === 'signed' && ['aguardando_assinatura', 'aguardando_cartao', 'revisao_final', 'aprovada', 'em_pagamento', 'quitada'].includes(active?.status))), [active]);

  const uploadDocument = async (type, label, file) => {
    if (!file || !active) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('O arquivo deve ter no máximo 10 MB.');
    setUploading(type);
    try { await base44.refundAdvance.uploadDocument(active.id, { type, label, file }); await refresh(); toast.success('Documento enviado.'); }
    catch (error) { toast.error(error.message || 'Falha no envio.'); }
    finally { setUploading(null); }
  };

  if (user && !eligible) return <div className="min-h-screen bg-slate-50 p-5 dark:bg-slate-950"><Card className="mx-auto mt-10 max-w-xl text-center"><CardContent className="space-y-4 p-8"><Lock className="mx-auto h-9 w-9 text-amber-600" /><h1 className="text-xl font-semibold">Disponível nos planos Basic e Premium</h1><p className="text-sm text-muted-foreground">Assine um plano para solicitar a antecipação da restituição.</p><Button asChild><Link to="/premium">Ver planos</Link></Button></CardContent></Card></div>;

  return <div className="min-h-screen bg-[#f5f7f8] p-4 dark:bg-slate-950 md:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-600">Antecipação de restituição</p><h1 className="mt-2 text-3xl font-medium tracking-tight text-slate-950 dark:text-white">Planeje hoje. Receba antes.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Envie sua documentação, acompanhe a análise e receba o valor aprovado via Pix.</p></header>
    <section className="grid gap-4 md:grid-cols-3">{[[FileCheck2, 'Proposta clara', 'Confira valor, parcelas e custo total antes da assinatura.'], [ShieldCheck, 'Análise segura', 'Documentação, última restituição e garantia são conferidas.'], [Landmark, 'Liberação por Pix', 'O valor é transferido após aprovação e assinatura digital.']].map(([Icon, title, text], index) => <article key={title} className={`rounded-3xl p-6 ${index === 1 ? 'bg-[#102d4d] text-white' : index === 2 ? 'bg-emerald-100 text-slate-900' : 'bg-blue-100 text-slate-900'}`}><Icon className="h-7 w-7" /><h2 className="mt-8 text-lg font-semibold">{title}</h2><p className={`mt-2 text-sm leading-6 ${index === 1 ? 'text-blue-100' : 'text-slate-600'}`}>{text}</p></article>)}</section>

    {!active ? <Card><CardHeader><CardTitle className="text-lg">Verificação inicial</CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 md:grid-cols-2">{['Sou assinante Basic ou Premium', 'Recebi restituição na última declaração', 'Enviarei a documentação solicitada', 'Possuo fiador ou seguro-fiança'].map((item) => <div className="flex items-center gap-2 text-sm" key={item}><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</div>)}</div><div><p className="mb-2 text-sm font-medium">Tipo de garantia</p><div className="flex gap-2"><Button variant={guaranteeType === 'guarantor' ? 'default' : 'outline'} onClick={() => setGuaranteeType('guarantor')}>Fiador</Button><Button variant={guaranteeType === 'surety_insurance' ? 'default' : 'outline'} onClick={() => setGuaranteeType('surety_insurance')}>Seguro-fiança</Button></div></div><label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} className="mt-1" />Li e aceito a análise de crédito, o tratamento dos documentos e as condições da antecipação.</label><Button disabled={!accepted || createMutation.isPending} onClick={() => createMutation.mutate()}>Iniciar solicitação <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card> : null}

    <Card><CardHeader><CardTitle className="text-lg">Modelos de contrato</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{(modelsQuery.data || []).map((model) => <div key={model.id} className="flex items-center gap-3 rounded-2xl border p-4"><FileText className="h-6 w-6 text-blue-600" /><div className="min-w-0 flex-1"><p className="font-medium">{model.title}</p><p className="truncate text-xs text-muted-foreground">{model.description}</p></div><Button variant="ghost" size="icon" onClick={() => setViewer(model)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" asChild><a href={model.fileUrl} download={model.fileName}><Download className="h-4 w-4" /></a></Button></div>)}</CardContent></Card>

    {active ? <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="space-y-6"><Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-lg">Sua solicitação</CardTitle><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{statusLabels[active.status]}</span></div></CardHeader><CardContent className="space-y-4">{active.pendingDocumentMessage ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{active.pendingDocumentMessage}</p> : null}{active.rejectionReason ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{active.rejectionReason}</p> : null}{active.advanceAmountCents ? <div className="rounded-2xl bg-blue-50 p-5 dark:bg-blue-950/40"><p className="text-sm font-medium">Proposta</p><p className="mt-1 text-3xl font-semibold">{formatMoney(active.advanceAmountCents)}</p><p className="mt-2 text-sm text-muted-foreground">{active.installmentCount} parcelas de {formatMoney(active.installmentAmountCents)} · Total {formatMoney(active.totalAmountCents)}</p><p className="text-xs text-muted-foreground">Primeiro vencimento: {active.firstDueDate}</p>{active.proposalNotes ? <p className="mt-3 text-sm">{active.proposalNotes}</p> : null}{active.status === 'proposta_disponivel' ? <Button className="mt-4" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>Aceitar proposta</Button> : null}</div> : null}</CardContent></Card>
    <Card><CardHeader><CardTitle className="text-lg">Documentos</CardTitle></CardHeader><CardContent className="space-y-3">{visibleDocuments.map(([type, label]) => { const sent = active.documents.filter((item) => item.type === type); return <div key={type} className="rounded-2xl border p-4"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{sent.length ? `${sent.length} arquivo(s)` : 'Pendente'}</p></div><label className="cursor-pointer rounded-lg border p-2 text-blue-600"><Upload className="h-4 w-4" /><input type="file" accept=".pdf,image/*" className="hidden" disabled={uploading === type} onChange={(event) => uploadDocument(type, label, event.target.files?.[0])} /></label></div>{sent.map((item) => <a className="mt-2 block truncate text-xs text-blue-600 underline" href={item.fileUrl} target="_blank" rel="noreferrer" key={item.id}>{item.fileName}</a>)}</div>; })}</CardContent></Card></div>
    <div className="space-y-6">{['aguardando_assinatura', 'aguardando_cartao'].includes(active.status) ? <Card><CardContent className="space-y-4 p-6"><CreditCard className="h-7 w-7 text-blue-600" /><h2 className="text-lg font-semibold">Cadastrar cartão</h2><p className="text-sm leading-6 text-muted-foreground">O cadastro acontece no ambiente seguro da Stripe. O Restitua não armazena o número completo do cartão.</p><Button onClick={() => cardMutation.mutate()} disabled={cardMutation.isPending}>Cadastrar cartão com segurança</Button></CardContent></Card> : null}{active.pixProofUrl ? <Card><CardContent className="space-y-3 p-6"><h2 className="font-semibold">Comprovante da antecipação</h2><p className="text-sm text-muted-foreground">Pix realizado em {formatDate(active.pixPaidAt)}.</p><Button variant="outline" asChild><a href={active.pixProofUrl} target="_blank" rel="noreferrer">Visualizar comprovante</a></Button></CardContent></Card> : null}<Card><CardHeader><CardTitle className="text-lg">Andamento</CardTitle></CardHeader><CardContent className="space-y-4">{[...(active.timeline || [])].reverse().map((event) => <div className="border-l-2 border-blue-500 pl-4" key={event.id}><p className="text-sm font-medium">{event.title}</p>{event.description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{event.description}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{formatDate(event.occurredAt)}</p></div>)}</CardContent></Card></div></div> : null}
  </div><Dialog open={Boolean(viewer)} onOpenChange={(open) => !open && setViewer(null)}><DialogContent className="h-[90vh] max-w-5xl p-0"><DialogHeader className="border-b p-4"><DialogTitle>{viewer?.title}</DialogTitle></DialogHeader>{viewer ? <iframe title={viewer.title} src={viewer.mimeType?.includes('pdf') ? `${viewer.fileUrl}#toolbar=1` : viewer.fileUrl} className="h-full w-full" /> : null}</DialogContent></Dialog></div>;
}
