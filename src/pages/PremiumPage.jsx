import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Crown,
  Download,
  FileSearch,
  FileSignature,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Headphones,
  ImagePlus,
  LockKeyhole,
  MessageCircle,
  ReceiptText,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { base44 } from '@/api/base44Client';
import { appLogo } from '@/brandAssets';

const features = [
  'Informe de restituição (PDF)',
  'Armazenamento de notas por 1 ano',
  'Relatório financeiro',
  'Download das notas enviadas',
  'Informe de restituição (Excel)',
  'Armazenamento de notas até 5 anos',
  'Adicionar memórias',
  'Auditoria trimestral de notas restituíveis',
  'Modelos de requerimentos',
  'Suporte Premium',
];

const featureIcons = {
  'Informe de restituição (PDF)': ReceiptText,
  'Armazenamento de notas por 1 ano': CalendarClock,
  'Relatório financeiro': BarChart3,
  'Download das notas enviadas': Download,
  'Informe de restituição (Excel)': FileSpreadsheet,
  'Armazenamento de notas até 5 anos': HardDrive,
  'Adicionar memórias': ImagePlus,
  'Auditoria trimestral de notas restituíveis': FileSearch,
  'Modelos de requerimentos': FileSignature,
  'Suporte Premium': MessageCircle,
};

const plans = [
  {
    id: 'free',
    name: 'Free',
    eyebrow: 'Comece agora',
    price: 'R$ 0',
    period: '/mês',
    description: 'Para organizar suas notas essenciais e emitir o informe em PDF sem custo.',
    iconCluster: [FileText, HardDrive, BarChart3],
    aura: 'from-slate-200 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950',
    shellGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.25),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(226,232,240,0.82))] dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.86))]',
    border: 'border-slate-200/80 dark:border-white/10',
    iconBox: 'border border-slate-400/35 bg-white/10 text-slate-800 shadow-slate-900/10 backdrop-blur dark:border-white/20 dark:bg-white/8 dark:text-slate-100',
    featureIcon: 'bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-300',
    button: 'border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-50/80 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10',
    cta: 'Plano gratuito',
    covered: [
      'Informe de restituição (PDF)',
      'Armazenamento de notas por 1 ano',
      'Relatório financeiro',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    eyebrow: 'Mais controle',
    price: 'R$ 9,90',
    period: '/mês',
    description: 'Ideal para quem precisa exportar Excel e consultar um histórico maior de notas.',
    iconCluster: [BarChart3, FileSpreadsheet, HardDrive],
    aura: 'from-blue-200 via-cyan-50 to-white dark:from-blue-950 dark:via-slate-900 dark:to-cyan-950',
    shellGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.34),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.20),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(219,234,254,0.78))] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(12,35,75,0.78))]',
    border: 'border-blue-200/80 dark:border-blue-300/20',
    iconBox: 'border border-blue-400/45 bg-white/10 text-blue-700 shadow-blue-500/10 backdrop-blur dark:border-blue-200/25 dark:bg-white/8 dark:text-blue-100',
    featureIcon: 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200',
    button: 'border-blue-500 text-blue-700 hover:bg-blue-50 dark:border-blue-300/60 dark:text-blue-100 dark:hover:bg-blue-400/10',
    cta: 'Assinar Basic',
    plan: 'basic',
    covered: [
      'Informe de restituição (PDF)',
      'Relatório financeiro',
      'Download das notas enviadas',
      'Informe de restituição (Excel)',
      'Armazenamento de notas até 5 anos',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    eyebrow: 'Experiência completa',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'Para transformar suas notas em um acervo completo, com suporte e recursos avançados.',
    iconCluster: [Crown, FileSearch, MessageCircle],
    aura: 'from-amber-200 via-white to-emerald-100 dark:from-amber-950 dark:via-slate-950 dark:to-emerald-950',
    shellGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.34),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.22),transparent_45%),linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,255,255,0.82))] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.23),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.14),transparent_42%),linear-gradient(135deg,rgba(24,19,9,0.92),rgba(2,6,23,0.88))]',
    border: 'border-amber-300/80 dark:border-amber-300/25',
    iconBox: 'border border-amber-400/50 bg-white/10 text-amber-700 shadow-amber-500/10 backdrop-blur dark:border-amber-200/30 dark:bg-white/8 dark:text-amber-100',
    featureIcon: 'bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200',
    button: 'border-amber-500 text-amber-700 hover:bg-amber-50 dark:border-amber-300/70 dark:text-amber-100 dark:hover:bg-amber-300/10',
    cta: 'Assinar Premium',
    plan: 'premium',
    featured: true,
    covered: [
      'Informe de restituição (PDF)',
      'Relatório financeiro',
      'Download das notas enviadas',
      'Informe de restituição (Excel)',
      'Armazenamento de notas até 5 anos',
      'Adicionar memórias',
      'Auditoria trimestral de notas restituíveis',
      'Modelos de requerimentos',
      'Suporte Premium',
    ],
  },
];

const quickHighlights = [
  { icon: ClipboardList, label: 'Informe de restituição pronto para declaração de IR' },
  { icon: HardDrive, label: 'Histórico de notas por plano' },
  { icon: ImagePlus, label: 'Adicione fotos para lembrar de suas despesas' },
  { icon: Headphones, label: 'Suporte dedicado no Premium' },
];

function FeatureRow({ label, enabled, iconClassName }) {
  const Icon = featureIcons[label] || CheckCircle2;

  return (
    <li className="flex items-start gap-3 text-sm leading-5">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${enabled ? iconClassName : 'bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-slate-600'}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className={enabled ? 'font-semibold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-400 dark:text-slate-500'}>
        {label}
      </span>
      {enabled ? (
        <CheckCircle2 className="ml-auto mt-1 h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="ml-auto mt-1 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
      )}
    </li>
  );
}

function PlanIconCluster({ icons, iconBox }) {
  const [PrimaryIcon, SecondaryIcon, TertiaryIcon] = icons;

  return (
    <div className="relative mb-6 h-[4.35rem] w-[5.4rem]">
      <div className="absolute inset-0 rounded-[1.7rem] bg-white/35 blur-xl dark:bg-white/8" />
      <div className={`absolute left-0 top-1 flex h-14 w-14 items-center justify-center rounded-2xl ${iconBox} shadow-lg`}>
        <PrimaryIcon className="h-7 w-7" />
      </div>
      <div className={`absolute right-1 top-0 flex h-9 w-9 items-center justify-center rounded-2xl ${iconBox} shadow-lg ring-4 ring-white/35 dark:ring-slate-950/45`}>
        <SecondaryIcon className="h-4 w-4" />
      </div>
      <div className={`absolute bottom-0 right-3 flex h-8 w-8 items-center justify-center rounded-xl ${iconBox} shadow-md ring-4 ring-white/35 dark:ring-slate-950/45`}>
        <TertiaryIcon className="h-4 w-4" />
      </div>
    </div>
  );
}

function PlanCard({ plan, loadingPlan, onCheckout }) {
  const visibleFeatures = plan.id === 'free'
    ? features
    : features.filter((feature) => feature !== 'Armazenamento de notas por 1 ano');

  return (
    <article className={`group relative overflow-hidden rounded-[2rem] border ${plan.border} bg-gradient-to-br ${plan.aura} p-1 shadow-[0_24px_70px_rgba(15,23,42,0.20)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(15,23,42,0.28)] dark:shadow-black/40`}>
      <div className="absolute inset-x-8 -top-20 h-36 rounded-full bg-white/80 blur-3xl dark:bg-white/6" />
      {plan.featured && (
        <div className="absolute right-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-800 shadow-sm dark:bg-amber-300/15 dark:text-amber-100">
          <Sparkles className="h-3.5 w-3.5" /> Melhor valor
        </div>
      )}

      <div className={`relative flex h-full flex-col rounded-[1.7rem] ${plan.shellGlow} p-5 backdrop-blur-xl md:p-7`}>
        <PlanIconCluster icons={plan.iconCluster} iconBox={plan.iconBox} />

        <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{plan.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{plan.name}</h2>
        <p className="mt-3 min-h-[3rem] text-xs leading-5 text-slate-600 dark:text-slate-300 md:text-sm md:leading-6">{plan.description}</p>

        <div className="mt-6 flex items-end gap-1 text-slate-950 dark:text-white">
          <span className="text-3xl font-black tracking-tight md:text-4xl">{plan.price}</span>
          <span className="pb-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">{plan.period}</span>
        </div>

        <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-white/15" />

        <ul className="flex flex-1 flex-col gap-3.5">
          {visibleFeatures.map((feature) => (
            <FeatureRow
              key={`${plan.id}-${feature}`}
              label={feature}
              enabled={plan.covered.includes(feature)}
              iconClassName={plan.featureIcon}
            />
          ))}
        </ul>

        {plan.plan ? (
          <button
            type="button"
            className={`mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border bg-transparent px-5 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${plan.button}`}
            disabled={Boolean(loadingPlan)}
            onClick={() => onCheckout(plan.plan)}
          >
            {plan.id === 'premium' ? <Crown className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
            {loadingPlan === plan.plan ? 'Ativando...' : plan.cta}
          </button>
        ) : (
          <div className="mt-7 h-12" aria-hidden="true" />
        )}
      </div>
    </article>
  );
}

function CouponCheckoutModal({ plan, couponCode, loading, onCouponChange, onClose, onSubmit }) {
  if (!plan) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/12 bg-slate-950/92 p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Cupom opcional</p>
        <h2 className="mt-3 text-2xl font-semibold">Antes de ir para o checkout</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Se você recebeu um cupom do Restitua, informe abaixo. Se não tiver, pode continuar normalmente.
        </p>

        <label className="mt-5 block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Código do cupom</span>
          <input
            value={couponCode}
            onChange={(event) => onCouponChange(event.target.value.toUpperCase())}
            placeholder="EX: RESTITUA10"
            className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-white/8 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300/70 focus:ring-4 focus:ring-blue-500/15"
          />
        </label>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="h-11 rounded-2xl border border-white/12 bg-transparent px-4 text-sm font-bold text-slate-200 transition hover:bg-white/8"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="h-11 rounded-2xl border border-blue-300/50 bg-blue-500 px-4 text-sm font-black text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? 'Criando checkout...' : couponCode.trim() ? 'Aplicar e continuar' : 'Continuar sem cupom'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PremiumPage() {
  const [loadingPlan, setLoadingPlan] = useState('');
  const [pendingPlan, setPendingPlan] = useState('');
  const [couponCode, setCouponCode] = useState('');

  const openCheckoutPrompt = (plan) => {
    setPendingPlan(plan);
    setCouponCode('');
  };

  const handleCheckout = async () => {
    const plan = pendingPlan;
    setLoadingPlan(plan);

    try {
      const response = await base44.billing.createCheckout({ plan, couponCode: couponCode.trim() });
      window.location.href = response?.checkoutUrl || `/premium?checkout=mock&plan=${plan}&status=success`;
    } catch (error) {
      if (error?.status === 401) {
        base44.auth.redirectToLogin(`${window.location.origin}/premium`);
        return;
      }

      alert(error?.message || 'Não foi possível iniciar a assinatura.');
      setLoadingPlan('');
    }
  };

  const closeCheckoutPrompt = () => {
    if (loadingPlan) {
      return;
    }

    setPendingPlan('');
    setCouponCode('');
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.36),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(16,185,129,0.22),transparent_30%),linear-gradient(135deg,#07111f_0%,#0f2747_42%,#111827_100%)] text-white dark:bg-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-28 top-16 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute right-[-10rem] top-20 h-[30rem] w-[30rem] rounded-full bg-emerald-300/16 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-300/14 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-slate-950/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Restitua">
            <img src={appLogo} alt="Restitua" className="h-11 w-auto object-contain" />
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-bold text-slate-100 transition hover:border-blue-300/60 hover:bg-white/12 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao app
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-16">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-xl font-medium leading-tight tracking-tight text-white md:text-5xl">
            Escolha seu Plano
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-slate-300 md:mt-5 md:text-base md:leading-7">
            Do informe gratuito ao acompanhamento premium, cada plano foi pensado para aumentar ao máximo sua restituição de imposto de renda.
          </p>
        </section>

        <section className="mt-4 hidden gap-3 rounded-[2rem] border border-white/10 bg-white/[0.07] p-3 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl md:grid sm:grid-cols-2 lg:grid-cols-4">
          {quickHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-3xl bg-white/[0.08] px-4 py-3 ring-1 ring-white/8">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400/25 to-emerald-300/15 text-blue-100 ring-1 ring-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-slate-100">{item.label}</span>
              </div>
            );
          })}
        </section>

        <section className="-mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {plans.map((plan) => (
            <div key={plan.id} className="w-[82vw] max-w-[24rem] shrink-0 snap-center md:w-auto md:max-w-none">
              <PlanCard plan={plan} loadingPlan={loadingPlan} onCheckout={openCheckoutPrompt} />
            </div>
          ))}
        </section>

      </main>

      <CouponCheckoutModal
        plan={pendingPlan}
        couponCode={couponCode}
        loading={Boolean(loadingPlan)}
        onCouponChange={setCouponCode}
        onClose={closeCheckoutPrompt}
        onSubmit={handleCheckout}
      />
    </div>
  );
}
