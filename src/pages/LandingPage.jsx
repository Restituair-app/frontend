import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import logoRestitua from '../../assets/logo.png';
import heroLogo from '../../assets/hero-logo.jpg';
import { CATEGORY_INFO_CONTENT } from '@/constants/category-info-content';
import {
  Receipt, Shield, Zap, CheckCircle,
  ArrowRight, BarChart2, Upload, LogIn, Heart, Smile, GraduationCap, Landmark, Scale, Users,
  Check, X, Info, ShieldCheck, Star } from
'lucide-react';

const features = [
{
  icon: <Upload className="w-6 h-6 text-blue-500" />,
  title: 'Envie suas Notas',
  desc: 'Tire uma foto ou faça upload de qualquer nota fiscal. Nossa IA extrai todos os dados automaticamente.'
},
{
  icon: <Zap className="w-6 h-6 text-yellow-500" />,
  title: 'IA que Organiza',
  desc: 'Inteligência artificial classifica cada despesa na categoria correta: saúde, educação, previdência e mais.'
},
{
  icon: <BarChart2 className="w-6 h-6 text-green-500" />,
  title: 'Relatórios Prontos',
  desc: 'Gere relatórios anuais e informes de restituição em PDF ou CSV com um clique, pronto para o contador.'
},
{
  icon: <Shield className="w-6 h-6 text-purple-500" />,
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

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logoRestitua} alt="Restitua logo" className="h-[2.8rem] w-auto object-contain" />
          </div>
          {/* Links centralizados - desktop */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button onClick={() => document.getElementById('funcionalidades').scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Funcionalidades</button>
            <button onClick={() => document.getElementById('deducoes').scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Deduções IR</button>
            <button onClick={() => document.getElementById('como-funciona').scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Como Funciona</button>
            <button onClick={() => document.getElementById('beneficios').scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Benefícios</button>
          </div>
          <div className="flex items-center gap-3">
            {/* Menu mobile */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setMenuOpen((o) => !o)}>
              <div className="w-5 h-0.5 bg-slate-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-slate-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-slate-600"></div>
            </button>
            <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <LogIn className="w-4 h-4" />
              Entrar
            </Button>
          </div>
        </div>
        {/* Menu mobile dropdown */}
        {menuOpen &&
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4">
            <button onClick={() => {document.getElementById('funcionalidades').scrollIntoView({ behavior: 'smooth' });setMenuOpen(false);}} className="text-sm font-medium text-slate-700 text-left">Funcionalidades</button>
            <button onClick={() => {document.getElementById('deducoes').scrollIntoView({ behavior: 'smooth' });setMenuOpen(false);}} className="text-sm font-medium text-slate-700 text-left">Deduções IR</button>
            <button onClick={() => {document.getElementById('como-funciona').scrollIntoView({ behavior: 'smooth' });setMenuOpen(false);}} className="text-sm font-medium text-slate-700 text-left">Como Funciona</button>
            <button onClick={() => {document.getElementById('beneficios').scrollIntoView({ behavior: 'smooth' });setMenuOpen(false);}} className="text-sm font-medium text-slate-700 text-left">Benefícios</button>
          </div>
        }
      </nav>

      {/* HERO */}
      <section className="pt-40 pb-24 px-6 bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          {/* Imagem à esquerda */}
          <div className="w-full md:w-2/5 flex-shrink-0 flex flex-col items-start gap-3">
            <div className="w-56 md:w-64 shadow-2xl">
              <img
                src={heroLogo}
                alt="Restitua App"
                className="w-full h-auto rounded-[2rem] object-contain" />
              
            </div>
            <span className="text-white text-sm font-semibold">Informe de Restituição sem complicação</span>
          </div>
          {/* Texto à direita */}
          <div className="w-full md:w-3/5 text-left">

            <h1 className="text-xl md:text-2xl font-bold text-white leading-tight mb-5">
              Tire foto de suas notas fiscais e{' '}
              <span className="text-blue-600">maximize sua restituição</span>
            </h1>
            <p className="text-base text-blue-100 mb-8">O Restitua usa inteligência artificial para ler, organizar e armazenar suas notas fiscais, gerando informes prontos para você e seu contador.


            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-base px-8 py-6 gap-2 shadow-lg shadow-blue-200">
                Começar agora — é grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6"
                onClick={() => document.getElementById('como-funciona').scrollIntoView({ behavior: 'smooth' })}>
                Como funciona
              </Button>
            </div>
            {/* <p className="text-sm text-slate-400 mt-4">Sem cartão de crédito. Sem burocracia.</p> */}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Não deixe nenhum real a mais para o Governo! RESTITUA ao máximo!</h2>
            
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) =>
            <Card key={i} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-6">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* DEDUÇÕES */}
      <section id="deducoes" className="py-24 px-6 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Categorias dedutíveis no IR</h2>
          <p className="text-blue-100 text-base mb-12">
            O Restitua identifica e organiza automaticamente todas as despesas que podem reduzir seu imposto.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {deductions.map((d, i) => {
            const Icon = d.icon;
            return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDeduction(d.key)}
              className="group bg-white/10 backdrop-blur rounded-2xl px-6 py-5 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/70">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-white text-sm md:text-base">{d.label}</span>
              </button>
            );
            })}
          </div>
          <p className="text-blue-200 mt-8 text-sm">
            + Alimentação, Transporte, Moradia, Pets e muito mais registrados e organizados.
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Como funciona</h2>
            <p className="text-base text-slate-500">Em 4 passos simples, suas despesas ficam organizadas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((s, i) =>
            <div key={i} className="flex gap-5 items-start p-6 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-base shrink-0">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base mb-1">{s.title}</h3>
                  <p className="text-slate-500 text-sm">{s.desc}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section id="beneficios" className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Por que usar o Restitua?</h2>
          </div>
          <div className="space-y-4">
            {[
            'Economize horas de trabalho manual organizando notas em planilhas',
            'Nunca perca um prazo do IR por falta de documentação organizada',
            'Maximize sua restituição com todas as despesas dedutíveis catalogadas',
            'Exporte relatórios prontos para o seu contador em PDF ou CSV',
            'Acesse suas notas de qualquer dispositivo, a qualquer hora',
            'Seguro e privado — seus dados só pertencem a você'].
            map((b, i) =>
            <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm md:text-base">{b}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-900 to-blue-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Receipt className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-5">
            Pronto para restituir mais?
          </h2>
          <p className="text-blue-200 text-base mb-10">
            Cadastre-se agora e comece a organizar suas notas fiscais de forma inteligente.
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 text-base px-10 py-6 font-semibold gap-2 shadow-xl">
            
            Criar conta gratuitamente
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <section className="py-5 px-6 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
          <span className="text-slate-300">Informações legais para uso do app:</span>
          <Link to="/terms" className="text-blue-300 hover:text-blue-200 font-medium transition-colors">
            Termos de Uso
          </Link>
          <span className="hidden sm:inline text-slate-500">|</span>
          <Link to="/privacy" className="text-blue-300 hover:text-blue-200 font-medium transition-colors">
            Política de Privacidade
          </Link>
          <span className="hidden sm:inline text-slate-500">|</span>
          <Link to="/support" className="text-blue-300 hover:text-blue-200 font-medium transition-colors">
            Suporte
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 bg-slate-950 text-slate-500 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Receipt className="w-4 h-4 text-blue-400" />
          <span className="text-white font-semibold">Restitua</span>
        </div>
        <p>© {new Date().getFullYear()} Restitua. Todos os direitos reservados.</p>
        <p className="mt-2 text-xs text-slate-600">
          Restitua Soluções Ltda. · CNPJ 53.176.637/0001-08
        </p>
      </footer>
      <LandingDeductionModal
        categoryKey={selectedDeduction}
        onClose={() => setSelectedDeduction(null)}
      />
    </div>);

}
