import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Archive, CheckCircle2, Crown, Infinity, ReceiptText, ShieldCheck } from 'lucide-react';

import { appLogo } from '@/brandAssets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const benefits = [
  {
    icon: Infinity,
    title: 'Notas fiscais ilimitadas',
    description: 'Cadastre quantas notas precisar, sem o limite diário do plano gratuito.',
  },
  {
    icon: Archive,
    title: 'Armazenamento por 5 anos',
    description: 'Mantenha seus comprovantes organizados pelo período recomendado para conferências do IR.',
  },
  {
    icon: ReceiptText,
    title: 'Histórico sempre acessível',
    description: 'Revise notas, categorias e comprovantes quando precisar montar seus relatórios.',
  },
  {
    icon: ShieldCheck,
    title: 'Organização segura',
    description: 'Seus dados continuam protegidos e vinculados somente à sua conta.',
  },
];

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={appLogo} alt="Restitua" className="h-12 w-auto object-contain" />
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao app
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100">
            <Crown className="h-4 w-4" />
            Restitua Premium
          </div>
          <h1 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">
            Mais liberdade para organizar suas notas e preparar seu Imposto de Renda.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            O plano Premium foi pensado para quem precisa registrar muitas despesas ao longo do ano, guardar
            comprovantes por mais tempo e manter tudo pronto para revisão, contador ou declaração.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-sm font-bold text-white">{benefit.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <Card className="border-white/10 bg-white text-slate-950 shadow-2xl shadow-blue-950/30">
          <CardContent className="p-7 md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Plano Premium</p>
                <h2 className="mt-2 text-2xl font-black">Para usuários intensivos</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Crown className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Inclui</p>
              <div className="mt-4 space-y-3">
                {[
                  'Notas fiscais ilimitadas',
                  'Armazenamento dos comprovantes por 5 anos',
                  'Relatórios organizados para o IR',
                  'Acesso ao histórico completo da conta',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="button"
              className="mt-6 h-12 w-full rounded-xl bg-blue-600 py-6 text-base font-bold hover:bg-blue-700"
              onClick={() => undefined}
            >
              Assinar Premium
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              O botão de assinatura ainda não inicia pagamento. Esta página prepara a experiência Premium para a próxima etapa.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
