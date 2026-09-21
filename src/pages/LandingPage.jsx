import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { appLogo } from '@/brandAssets';
import { CATEGORY_INFO_CONTENT } from '@/constants/category-info-content';
import {
  Shield, Sparkles, CheckCircle,
  ArrowRight, BarChart3, Upload, Heart, Smile, GraduationCap, Landmark, Scale, Users,
  Check, X, Info, ShieldCheck, Star, Menu, ChevronRight, FileText, LockKeyhole,
  ScanLine, FolderCheck, Calculator, XIcon } from
'lucide-react';

const features = [
{
  icon: Upload,
  title: 'Envie suas Notas',
  desc: 'Tire uma foto ou faça upload de qualquer nota fiscal. Nossa IA extrai todos os dados automaticamente.'
},
{
  icon: ScanLine,
  title: 'IA que Organiza',
  desc: 'Inteligência artificial classifica cada despesa na categoria correta: saúde, educação, previdência e mais.'
},
{
  icon: BarChart3,
  title: 'Relatórios Prontos',
  desc: 'Gere relatórios anuais e informes de restituição em PDF ou CSV com um clique, pronto para o contador.'
},
{
  icon: Shield,
  title: 'Dados Seguros',
  desc: 'Suas informações ficam protegidas e acessíveis apenas por você, a qualquer hora e em qualquer dispositivo.'
}];


const deductions = [
{ key: 'saude', icon: Heart, label: 'Saúde / Médico', color: 'text-red-500', bg: 'bg-red-50' },
{ key: 'dentista', icon: Smile, label: 'Saúde / Dentista', color: 'text-cyan-500', bg: 'bg-cyan-50' },
{ key: 'educacao', icon: GraduationCap, label: 'Educação', color: 'text-blue-600', bg: 'bg-blue-50' },
{ key: 'previdencia_privada', icon: Landmark, label: 'Previdência Privada', color: 'text-emerald-600', bg: 'bg-emerald-50' },
{ key: 'pensao_alimenticia', icon: Scale, label: 'Pensão Alimentícia', color: 'text-orange-500', bg: 'bg-orange-50' },
{ key: 'dependentes', icon: Users, label: 'Dependentes', color: 'text-teal-600', bg: 'bg-teal-50' }];


const steps = [
{ n: '1', title: 'Cadastre-se', desc: 'Crie sua conta gratuitamente em segundos.' },
{ n: '2', title: 'Envie as Notas', desc: 'Fotografe ou faça upload das suas notas fiscais.' },
{ n: '3', title: 'Revise os Dados', desc: 'Confira e corrija os dados extraídos pela IA se necessário.' },
{ n: '4', title: 'Gere o Relatório', desc: 'Exporte o informe de restituição e entregue ao seu contador.' }];

function DeductionInfoList({ items, icon: Icon, iconClassName }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClassName}`} />
          <p className="text-xs font-semibold leading-relaxed text-slate-700">{item}</p>
        </div>
      ))}
    </div>
  );
}

function LandingDeductionModal({ categoryKey, onClose }) {
  const content = categoryKey ? CATEGORY_INFO_CONTENT[categoryKey] : null;
  const meta = deductions.find((item) => item.key === categoryKey);
  const Icon = meta?.icon;
  const verificationMessage = content?.important.find((item) => item.startsWith('O Restitua verifica'));
  const importantItems = content?.important.filter((item) => item !== verificationMessage) || [];

  return (
    <Dialog open={Boolean(content)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-20px)] max-w-5xl overflow-hidden rounded-[28px] border-0 bg-white p-0 shadow-2xl">
        {content ? (
          <div className="max-h-[92vh] overflow-y-auto p-5 sm:p-8">
            <div className="grid gap-6 pr-8 lg:grid-cols-[1fr_340px]">
              <div className="flex gap-5">
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl ${meta?.bg || 'bg-blue-50'}`}>
                  {Icon ? <Icon className={`h-10 w-10 ${meta?.color || 'text-blue-600'}`} /> : null}
                </div>
                <div>
                  <h2 className="text-3xl font-black leading-tight text-slate-950 md:text-4xl">{content.title}</h2>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Dedutível no IR
                  </div>
                  <div className="mt-5 space-y-2">
                    {content.description.map((description) => (
                      <p key={description} className="text-sm font-medium leading-6 text-slate-600">
                        {description}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {content.deductionNote ? (
                <div className="rounded-2xl bg-blue-50 p-6 shadow-inner shadow-blue-100/50">
                  <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    Regra de dedução
                    <Info className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="text-xl font-black leading-tight text-blue-700">{content.deductionNote}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <section>
                <div className="mb-4 flex items-center gap-2 text-emerald-700">
                  <CheckCircle className="h-5 w-5" />
                  <h3 className="text-sm font-black">O que entra</h3>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                  <DeductionInfoList items={content.included} icon={Check} iconClassName="text-emerald-600" />
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2 text-red-600">
                  <X className="h-5 w-5 rounded-full border border-red-200 p-0.5" />
                  <h3 className="text-sm font-black">O que não entra</h3>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
                  <DeductionInfoList items={content.excluded} icon={X} iconClassName="text-red-500" />
                </div>
              </section>
            </div>

            {importantItems.length > 0 ? (
              <section className="mt-7 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-700" />
                  <h3 className="text-sm font-black text-slate-950">Importante</h3>
                </div>
                <div className="space-y-2">
                  {importantItems.map((item) => (
                    <p key={item} className="text-sm font-semibold leading-6 text-slate-600">
                      {item}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            {verificationMessage ? (
              <section className="mt-5 flex items-start gap-3 rounded-2xl bg-blue-50 p-5 text-blue-900">
                <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />
                <p className="text-sm font-extrabold leading-6">{verificationMessage}</p>
              </section>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}


export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState(null);
  const handleLogin = () => {
    base44.auth.redirectToLogin('/dashboard');
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8f4] font-['Avenir_Next','Trebuchet_MS',sans-serif] text-[#101c33]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#10213b]/10 bg-[#f7f8f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3" aria-label="Voltar ao início">
            <img src={appLogo} alt="" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-xl font-black tracking-[-0.04em]">Restitua</span>
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            <button onClick={() => scrollTo('funcionalidades')} className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">Produto</button>
            <button onClick={() => scrollTo('deducoes')} className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">Deduções</button>
            <button onClick={() => scrollTo('como-funciona')} className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">Como funciona</button>
            <Link to="/premium" className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">Planos</Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleLogin} className="hidden font-bold text-[#10213b] sm:inline-flex">Entrar</Button>
            <Button onClick={handleLogin} className="rounded-full bg-[#175cd3] px-5 font-bold shadow-none hover:bg-[#124aa9]">
              Criar conta
              <ArrowRight className="h-4 w-4" />
            </Button>
            <button onClick={() => setMenuOpen((open) => !open)} className="ml-1 rounded-full border border-slate-200 p-2 lg:hidden" aria-label="Abrir menu">
              {menuOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-slate-200 bg-[#f7f8f4] px-5 py-5 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-1">
              <button onClick={() => scrollTo('funcionalidades')} className="rounded-xl px-3 py-3 text-left font-semibold hover:bg-white">Produto</button>
              <button onClick={() => scrollTo('deducoes')} className="rounded-xl px-3 py-3 text-left font-semibold hover:bg-white">Deduções</button>
              <button onClick={() => scrollTo('como-funciona')} className="rounded-xl px-3 py-3 text-left font-semibold hover:bg-white">Como funciona</button>
              <Link to="/premium" className="rounded-xl px-3 py-3 font-semibold hover:bg-white">Ver planos</Link>
              <button onClick={handleLogin} className="rounded-xl px-3 py-3 text-left font-semibold sm:hidden">Entrar</button>
            </div>
          </div>
        ) : null}
      </nav>

      <main>
        <section className="relative px-5 pb-24 pt-36 lg:px-8 lg:pb-32 lg:pt-44">
          <div className="pointer-events-none absolute -right-40 top-12 h-[520px] w-[520px] rounded-full bg-[#b8e0ca]/35 blur-3xl" />
          <div className="pointer-events-none absolute -left-44 bottom-0 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#175cd3]/15 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#175cd3]">
                <Sparkles className="h-4 w-4" />
                Organização fiscal inteligente
              </div>
              <h1 className="max-w-3xl text-[clamp(3rem,7vw,6.6rem)] font-black leading-[.91] tracking-[-0.065em] text-[#10213b]">
                Sua nota fiscal vale mais.
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-slate-600 lg:text-xl">
                Fotografe suas notas. O Restitua lê, organiza e prepara as informações para você aproveitar melhor sua declaração de Imposto de Renda.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleLogin} size="lg" className="h-14 rounded-full bg-[#175cd3] px-7 text-base font-black hover:bg-[#124aa9]">
                  Começar gratuitamente
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 rounded-full border-[#10213b]/20 bg-transparent px-7 text-base font-bold hover:bg-white">
                  <Link to="/premium">Conhecer os planos</Link>
                </Button>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" />Conta gratuita</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" />Sem cartão</span>
                <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-emerald-600" />Dados protegidos</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[530px]">
              <div className="absolute -inset-5 rotate-3 rounded-[38px] bg-[#b8e0ca]" />
              <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[#10213b] p-5 shadow-[0_35px_90px_-35px_rgba(16,33,59,.6)] sm:p-7">
                <div className="mb-8 flex items-center justify-between text-white">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-200">Resumo anual</p>
                    <p className="mt-1 text-lg font-black">Suas despesas organizadas</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3"><BarChart3 className="h-6 w-6 text-[#87d3a9]" /></div>
                </div>
                <div className="rounded-[25px] bg-white p-6 sm:p-7">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-6">
                    <div>
                      <p className="text-sm font-bold text-slate-500">Estimado dedutível</p>
                      <p className="mt-1 text-3xl font-black tracking-tight text-[#10213b] sm:text-4xl">R$ 1.970,00</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">2026</span>
                  </div>
                  <div className="space-y-4 pt-6">
                    {[
                      ['Médico / Saúde', 'R$ 1.240,00', 'bg-[#ef6b68]', '72%'],
                      ['Educação', 'R$ 530,00', 'bg-[#3e7bdc]', '48%'],
                      ['Dependentes', 'R$ 200,00', 'bg-[#42a984]', '30%'],
                    ].map(([label, value, color, width]) => (
                      <div key={label}>
                        <div className="mb-2 flex justify-between text-xs font-bold"><span>{label}</span><span>{value}</span></div>
                        <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${color}`} style={{ width }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/10 p-4 text-white"><FileText className="mb-4 h-5 w-5 text-blue-200" /><p className="text-xs text-blue-100">Notas salvas</p><p className="mt-1 text-xl font-black">17</p></div>
                  <div className="rounded-2xl bg-[#87d3a9] p-4 text-[#10213b]"><FolderCheck className="mb-4 h-5 w-5" /><p className="text-xs font-semibold">Informe</p><p className="mt-1 text-xl font-black">Pronto</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="bg-[#10213b] px-5 py-24 text-white lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#87d3a9]">Do comprovante ao relatório</p>
                <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.045em] md:text-5xl">Menos planilha. Mais clareza sobre seu dinheiro.</h2>
                <p className="mt-6 max-w-md leading-7 text-slate-300">Uma rotina simples para transformar documentos espalhados em informação fiscal útil.</p>
              </div>
              <div className="grid border-l border-t border-white/15 sm:grid-cols-2">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <article key={feature.title} className="group border-b border-r border-white/15 p-7 transition-colors hover:bg-white/[.04] sm:p-9">
                      <div className="mb-10 flex items-center justify-between">
                        <Icon className="h-7 w-7 text-[#87d3a9]" />
                        <span className="font-mono text-xs text-slate-500">0{index + 1}</span>
                      </div>
                      <h3 className="text-xl font-black">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{feature.desc}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="deducoes" className="px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#175cd3]">Categorias dedutíveis</p>
                <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-[-.045em] md:text-5xl">Entenda o que pode entrar na sua declaração.</h2>
              </div>
              <p className="max-w-md leading-7 text-slate-600">Selecione uma categoria para consultar regras, exemplos e pontos de atenção.</p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[28px] border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {deductions.map((deduction) => {
                const Icon = deduction.icon;
                return (
                  <button key={deduction.key} type="button" onClick={() => setSelectedDeduction(deduction.key)} className="group flex min-h-40 flex-col justify-between bg-white p-6 text-left transition hover:bg-[#eef5ff] sm:p-8">
                    <div className="flex items-start justify-between">
                      <div className={`rounded-2xl p-3 ${deduction.bg}`}><Icon className={`h-6 w-6 ${deduction.color}`} /></div>
                      <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                    </div>
                    <div><p className="text-lg font-black">{deduction.label}</p><p className="mt-1 text-sm text-slate-500">Consultar detalhes</p></div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-slate-200 bg-white px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#175cd3]">Como funciona</p>
                <h2 className="mt-4 text-4xl font-black tracking-[-.045em] md:text-5xl">Quatro passos. Um ano inteiro organizado.</h2>
              </div>
              <div className="border-t border-slate-200">
                {steps.map((step) => (
                  <article key={step.n} className="grid gap-3 border-b border-slate-200 py-7 sm:grid-cols-[64px_190px_1fr] sm:items-center">
                    <span className="font-mono text-sm font-bold text-blue-600">0{step.n}</span>
                    <h3 className="text-lg font-black">{step.title}</h3>
                    <p className="text-sm leading-6 text-slate-600">{step.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[#dcecff]">
            <div className="grid lg:grid-cols-[1fr_.9fr]">
              <div className="p-8 sm:p-12 lg:p-16">
                <Calculator className="h-9 w-9 text-[#175cd3]" />
                <h2 className="mt-8 max-w-xl text-4xl font-black tracking-[-.045em] md:text-5xl">Informação pronta quando você precisar.</h2>
                <p className="mt-6 max-w-lg leading-7 text-slate-600">Centralize notas, identifique despesas dedutíveis e compartilhe relatórios claros com seu contador.</p>
                <Button onClick={handleLogin} size="lg" className="mt-9 h-14 rounded-full bg-[#10213b] px-7 font-black hover:bg-[#1d3150]">Organizar minhas notas<ArrowRight className="h-5 w-5" /></Button>
              </div>
              <div className="grid gap-px bg-[#10213b]/10 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  ['PDF e Excel', 'Informes organizados para consulta e declaração.'],
                  ['Acesso seguro', 'Seus documentos disponíveis em diferentes dispositivos.'],
                  ['Histórico centralizado', 'Menos tempo procurando comprovantes ao longo do ano.'],
                ].map(([title, description]) => (
                  <div key={title} className="bg-[#cfe3fb] p-8 lg:p-10"><CheckCircle className="h-5 w-5 text-emerald-700" /><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#175cd3] px-5 py-20 text-white lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-200">Comece agora</p><h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Suas notas em ordem. Seu IR também.</h2></div>
            <Button onClick={handleLogin} size="lg" className="h-14 shrink-0 rounded-full bg-white px-7 font-black text-[#10213b] hover:bg-blue-50">Criar conta gratuita<ArrowRight className="h-5 w-5" /></Button>
          </div>
        </section>
      </main>

      <footer className="bg-[#0b1628] px-5 py-12 text-slate-400 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-9 md:flex-row md:items-end">
          <div><div className="flex items-center gap-3"><img src={appLogo} alt="" className="h-9 w-9 rounded-xl" /><span className="text-lg font-black text-white">Restitua</span></div><p className="mt-4 text-sm">Restitua Soluções Ltda. · CNPJ 53.176.637/0001-08</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold"><Link to="/terms" className="hover:text-white">Termos de Uso</Link><Link to="/privacy" className="hover:text-white">Privacidade</Link><Link to="/support" className="hover:text-white">Suporte</Link><Link to="/premium" className="hover:text-white">Planos</Link></div>
          <p className="text-xs">© {new Date().getFullYear()} Restitua</p>
        </div>
      </footer>
      <LandingDeductionModal
        categoryKey={selectedDeduction}
        onClose={() => setSelectedDeduction(null)}
      />
    </div>
  );
}
