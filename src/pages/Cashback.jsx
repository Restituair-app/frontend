import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowDownCircle, CheckCircle, ChevronLeft, Gift, KeyRound, Sparkles, Ticket, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formatCents = (value = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
const maskPixKey = (value = '') => value.includes('@') ? `${value.slice(0, 2)}***@${value.split('@')[1]}` : value.length > 7 ? `${value.slice(0, 4)}***${value.slice(-3)}` : value;
const CASHBACK_TERMS_SUMMARY = [
  'O cashback é um benefício promocional do Restitua e não representa restituição do Imposto de Renda nem garantia de dedução fiscal.',
  'A participação é exclusiva para usuários Basic ou Premium, com cadastro ativo, aceite dos termos e dados verdadeiros e atualizados.',
  'Somente documentos válidos, legíveis e vinculados ao usuário, dependentes ou pessoas permitidas pela legislação podem ser considerados.',
  'Apenas despesas realizadas a partir de 01/09/2026 podem gerar cashback.',
  'Notas fiscais restituíveis aprovadas podem gerar até 1% de cashback, limitado a R$ 10.000 em notas elegíveis por mês.',
  'Categorias com limite legal usam o teto proporcional mensal; valores excedentes não acumulam para meses seguintes.',
  'Pensão alimentícia, PGBL, documentos duplicados, cancelados, adulterados, ilegíveis ou com indício de fraude não geram cashback.',
  'Cada crédito expira em até 12 meses e o saque mínimo é de R$ 10,00, via chave Pix do titular da conta cadastrada.',
  'O Restitua pode suspender, recusar ou revisar saques e estornar créditos em caso de erro, inconsistência, reembolso, devolução ou fraude.',
  'Colaboradores, prestadores, sócios, parceiros e pessoas vinculadas ao Restitua não são elegíveis ao programa.',
];

const statusClass = (status = '') => {
  if (status.includes('pagamento_realizado') || status.includes('ativo') || status.includes('calculado')) return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200';
  if (status.includes('pendente') || status.includes('em_analise')) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200';
  return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200';
};

export default function Cashback() {
  const queryClient = useQueryClient();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [editingPix, setEditingPix] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponQuantity, setCouponQuantity] = useState(1);

  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ['cashback-overview'],
    queryFn: () => base44.cashback.overview(),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (overview?.enrollment?.pixKey) setPixKey(overview.enrollment.pixKey);
  }, [overview?.enrollment?.pixKey]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cashback-overview'] });

  const enrollMutation = useMutation({
    mutationFn: () => base44.cashback.enroll({ acceptedTerms, pixKey: pixKey.trim() }),
    onSuccess: () => { invalidate(); setAcceptedTerms(false); toast.success('Programa Cashback ativado.'); },
    onError: (error) => toast.error(error?.message || 'Não foi possível entrar no programa.'),
  });

  const updatePixMutation = useMutation({
    mutationFn: () => base44.cashback.updatePixKey({ pixKey: pixKey.trim() }),
    onSuccess: () => { invalidate(); setEditingPix(false); toast.success('Chave Pix atualizada.'); },
    onError: (error) => toast.error(error?.message || 'Não foi possível atualizar a chave Pix.'),
  });

  const withdrawalMutation = useMutation({
    mutationFn: () => base44.cashback.requestWithdrawal(),
    onSuccess: () => { invalidate(); toast.success('Solicitação de saque enviada para análise.'); },
    onError: (error) => toast.error(error?.message || 'Não foi possível solicitar saque.'),
  });

  const couponMutation = useMutation({
    mutationFn: () => base44.cashback.redeemCoupons({ quantity: couponQuantity }),
    onSuccess: () => { invalidate(); setCouponModalOpen(false); setCouponQuantity(1); toast.success('Cupons gerados com sucesso.'); },
    onError: (error) => toast.error(error?.message || 'Não foi possível gerar cupons.'),
  });

  const maxCoupons = Math.min(overview?.balances?.availableCoupons || 0, 50);
  const canWithdraw = (overview?.balances?.availableCents || 0) >= (overview?.limits?.minWithdrawalCents || 1000);

  const transactions = useMemo(() => overview?.transactions || [], [overview]);

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <Card className="border-white/10 bg-white/10 text-center backdrop-blur">
            <CardContent className="space-y-4 p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-200"><Wallet /></div>
              <h1 className="text-xl font-bold">Programa Cashback</h1>
              <p className="text-sm text-slate-300">Cashback está disponível para usuários Basic e Premium.</p>
              <Link to="/premium"><Button>Ver planos</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-white">
      <div className="mx-auto max-w-5xl space-y-5 py-6">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" size="icon" className="border-white/15 bg-white/10 text-white hover:bg-white/15"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">Programa Cashback</p>
            <h1 className="text-2xl font-bold tracking-tight">Sua nota restituível vale dinheiro</h1>
          </div>
        </div>

        {isLoading ? (
          <Card className="border-white/10 bg-white/10 text-white"><CardContent className="p-6">Carregando cashback...</CardContent></Card>
        ) : !overview?.enrollment ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-7 shadow-2xl">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/30 blur-2xl" />
              <div className="relative space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-300/15 text-emerald-200"><Sparkles /></div>
                <h2 className="text-xl font-bold">Entre no programa</h2>
                <p className="text-sm leading-6 text-slate-300">Aceite os termos e cadastre sua chave Pix para acumular cashback nas notas fiscais restituíveis.</p>
              </div>
            </div>
            <Card className="border-white/10 bg-white/95 text-slate-950 dark:bg-slate-950/80 dark:text-white">
              <CardContent className="space-y-4 p-5">
                <h2 className="text-lg font-bold">Termos simplificados do programa</h2>
                {CASHBACK_TERMS_SUMMARY.map((item) => <p key={item} className="flex gap-2 text-sm text-muted-foreground"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{item}</p>)}
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Chave Pix</Label>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">Somente será aceito se for do titular da conta do cadastro.</span>
                  </div>
                  <Input value={pixKey} onChange={(event) => setPixKey(event.target.value)} placeholder="E-mail, CPF, telefone ou chave aleatória" />
                </div>
                <label className="flex cursor-pointer gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} /> Li e aceito participar do Programa Cashback.</label>
                <Button className="w-full" disabled={!acceptedTerms || !pixKey.trim() || enrollMutation.isPending} onClick={() => enrollMutation.mutate()}>{enrollMutation.isPending ? 'Entrando...' : 'Entrar no Programa Cashback'}</Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 shadow-2xl ring-1 ring-white/10">
              <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-emerald-400/25 blur-2xl" />
              <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-blue-500/25 blur-2xl" />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-200">Saldo mensal</p>
                  <p className="mt-2 text-5xl font-black tracking-tight">{formatCents(overview.balances.monthCents)}</p>
                  <p className="mt-2 text-sm text-emerald-100">1% das notas restituíveis do mês</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-200">Saldo disponível</p>
                  <p className="text-2xl font-black">{formatCents(overview.balances.availableCents)}</p>
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-100"><KeyRound className="h-3 w-3" /> {maskPixKey(overview.enrollment.pixKey)}</p>
                </div>
              </div>
            </div>

            <Card className="border-white/10 bg-white/95 dark:bg-slate-950/80">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="font-bold text-slate-950 dark:text-white">Chave Pix</h2><p className="text-sm text-muted-foreground">Edite antes de solicitar um novo saque.</p></div>
                  <Button variant="outline" size="sm" onClick={() => setEditingPix((current) => !current)}>{editingPix ? 'Cancelar' : 'Editar'}</Button>
                </div>
                {editingPix ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-300">Somente será aceito se for do titular da conta do cadastro.</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input value={pixKey} onChange={(event) => setPixKey(event.target.value)} />
                      <Button disabled={!pixKey.trim() || updatePixMutation.isPending} onClick={() => updatePixMutation.mutate()}>Salvar</Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <button className="group rounded-3xl border border-white/10 bg-white/95 p-5 text-left shadow-lg transition hover:-translate-y-0.5 dark:bg-slate-950/80" onClick={() => withdrawalMutation.mutate()} disabled={!canWithdraw || withdrawalMutation.isPending}>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-200"><ArrowDownCircle /></span>
                <strong className="block text-slate-950 dark:text-white">Realizar saque</strong>
                <span className="mt-1 block text-sm text-muted-foreground">Saque mínimo de {formatCents(overview.limits.minWithdrawalCents)} usando todo o saldo.</span>
              </button>
              <button className="group rounded-3xl border border-white/10 bg-white/95 p-5 text-left shadow-lg transition hover:-translate-y-0.5 dark:bg-slate-950/80" onClick={() => setCouponModalOpen(true)} disabled={maxCoupons < 1}>
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-200"><Ticket /></span>
                <strong className="block text-slate-950 dark:text-white">Trocar por cupom</strong>
                <span className="mt-1 block text-sm text-muted-foreground">Você pode gerar {overview.balances.availableCoupons} cupom{overview.balances.availableCoupons === 1 ? '' : 's'}.</span>
              </button>
            </div>

            <Link to={createPageUrl('PremiosCashback')} className="block rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-white shadow-xl transition hover:bg-amber-300/15">
              <div className="flex items-center gap-3"><Gift className="text-amber-200" /><div><strong>Prêmios</strong><p className="text-sm text-amber-50/80">Veja sorteios, cupons e ganhadores.</p></div></div>
            </Link>

            <Card className="border-white/10 bg-white/95 dark:bg-slate-950/80">
              <CardContent className="space-y-3 p-5">
                <h2 className="font-bold text-slate-950 dark:text-white">Histórico</h2>
                {transactions.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-blue-600 dark:bg-slate-800"><Wallet className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1"><p className="font-semibold text-slate-950 dark:text-white">{item.title}</p><p className="text-xs text-muted-foreground">{item.description}</p><span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass(item.status)}`}>{item.status.replace(/_/g, ' ')}</span></div>
                    <p className={`text-sm font-bold ${item.amountCents < 0 ? 'text-slate-950 dark:text-white' : 'text-emerald-500'}`}>{item.amountCents < 0 ? '-' : '+'} {formatCents(Math.abs(item.amountCents))}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={couponModalOpen} onOpenChange={setCouponModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gerar cupons</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Cada cupom custa {formatCents(overview?.limits?.couponCostCents || 1000)}.</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" disabled={couponQuantity <= 1} onClick={() => setCouponQuantity(Math.max(1, couponQuantity - 1))}>-</Button>
              <div className="min-w-20 rounded-2xl bg-muted px-6 py-3 text-center text-xl font-black">{couponQuantity}</div>
              <Button variant="outline" size="icon" disabled={couponQuantity >= maxCoupons} onClick={() => setCouponQuantity(Math.min(maxCoupons, couponQuantity + 1))}>+</Button>
            </div>
            <Button className="w-full" disabled={couponQuantity < 1 || couponQuantity > maxCoupons || couponMutation.isPending} onClick={() => couponMutation.mutate()}>{couponMutation.isPending ? 'Gerando...' : `Resgatar ${couponQuantity} cupom${couponQuantity > 1 ? 's' : ''}`}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
