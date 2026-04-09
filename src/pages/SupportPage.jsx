import React from 'react';
import { Link } from 'react-router-dom';
import { appLogo } from '@/brandAssets';

const supportEmail = 'restitua.ir@gmail.com';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={appLogo} alt="Restitua logo" className="h-10 w-auto object-contain rounded-md bg-black px-2 py-1" />
            <div>
              <p className="text-xs text-slate-500">Restitua</p>
              <h1 className="text-lg font-semibold">Suporte</h1>
            </div>
          </div>
          <Link to="/LandingPage" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 text-sm leading-7">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Contato de suporte</h2>
          <p>
            Para dúvidas, problemas técnicos, sugestões ou reporte de bugs no app Restitua, entre em contato pelo
            e-mail abaixo:
          </p>
          <p>
            <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-700 font-medium">
              {supportEmail}
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Como abrir um chamado</h2>
          <p>Para agilizar o atendimento, envie junto:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>modelo do celular e versão do sistema operacional;</li>
            <li>descrição curta do problema e etapa em que ocorreu;</li>
            <li>print da tela (quando possível);</li>
            <li>e-mail da conta usada no app.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Horário de atendimento</h2>
          <p>Segunda a sexta-feira, em horário comercial (BRT).</p>
        </section>
      </main>
    </div>
  );
}
