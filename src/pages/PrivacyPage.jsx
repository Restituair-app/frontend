import React from 'react';
import { Link } from 'react-router-dom';
import { appLogo } from '@/brandAssets';

const effectiveDate = '2 de abril de 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={appLogo} alt="Restitua logo" className="h-10 w-auto object-contain" />
            <div>
              <p className="text-xs text-slate-500">Restitua</p>
              <h1 className="text-lg font-semibold">Política de Privacidade</h1>
            </div>
          </div>
          <Link to="/LandingPage" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 text-sm leading-7">
        <p className="text-slate-600">Vigência: {effectiveDate}</p>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">1. Dados que coletamos</h2>
          <p>Podemos coletar os seguintes dados para operação do serviço:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>dados de cadastro (e-mail, nome, telefone, CPF quando informado);</li>
            <li>dados de autenticação e sessão;</li>
            <li>notas fiscais, comprovantes e metadados enviados por você;</li>
            <li>dados técnicos de uso, dispositivo e logs de segurança.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">2. Finalidades de uso</h2>
          <p>Usamos os dados para:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>autenticar usuários e proteger contas;</li>
            <li>processar notas fiscais com IA e estruturar informações;</li>
            <li>gerar relatórios de despesas e informes de restituição;</li>
            <li>prevenir fraudes, falhas e abuso de plataforma;</li>
            <li>cumprir obrigações legais e regulatórias.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">3. Compartilhamento com terceiros</h2>
          <p>
            Compartilhamos dados apenas quando necessário para operação, segurança e conformidade legal, incluindo
            provedores de nuvem, armazenamento de arquivos, autenticação, monitoramento e serviços de IA/OCR.
          </p>
          <p>
            Esses terceiros atuam sob obrigações contratuais de segurança e confidencialidade, conforme aplicável.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">4. IA e documentos enviados</h2>
          <p>
            Arquivos enviados podem ser processados por modelos de IA para extração de campos como estabelecimento,
            CNPJ, valor e data. Você deve revisar os dados extraídos antes de utilizá-los em qualquer obrigação fiscal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">5. Segurança</h2>
          <p>
            Adotamos medidas de segurança técnicas e administrativas, como criptografia em trânsito, controle de acesso
            e monitoramento de incidentes. Ainda assim, nenhum sistema é 100% imune a riscos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">6. Retenção e exclusão</h2>
          <p>
            Mantemos os dados pelo tempo necessário para prestar o serviço e cumprir obrigações legais. Você pode
            solicitar exclusão da conta e dados associados, respeitados prazos e retenções obrigatórias por lei.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">7. Direitos do titular</h2>
          <p>
            Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção, anonimização,
            portabilidade e exclusão, quando aplicável.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">8. Crianças e adolescentes</h2>
          <p>
            O serviço não é destinado a menores sem supervisão legal. Se houver tratamento indevido de dados de
            menores, entre em contato para remoção imediata.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">9. Atualizações desta política</h2>
          <p>
            Esta Política pode ser atualizada periodicamente. A versão vigente ficará disponível nesta página com data
            de atualização.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">10. Contato</h2>
          <p>
            Solicitações sobre privacidade e dados pessoais: <a href="mailto:privacidade@restitua.com" className="text-blue-600 hover:text-blue-700">privacidade@restitua.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
