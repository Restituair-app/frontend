import React from 'react';
import { Link } from 'react-router-dom';
import { appLogo } from '@/brandAssets';

const effectiveDate = '2 de abril de 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={appLogo} alt="Restitua logo" className="h-10 w-auto object-contain rounded-md bg-black px-2 py-1" />
            <div>
              <p className="text-xs text-slate-500">Restitua</p>
              <h1 className="text-lg font-semibold">Termos de Uso</h1>
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
          <h2 className="text-base font-semibold text-slate-900">1. Aceitação</h2>
          <p>
            Ao acessar e utilizar o Restitua (web e aplicativo), você concorda com estes Termos de Uso e com a
            Política de Privacidade. Se não concordar com qualquer condição, não utilize o serviço.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">2. Objeto do serviço</h2>
          <p>
            O Restitua é uma plataforma para organização de notas fiscais, extração assistida por IA e geração de
            relatórios para apoio na declaração do Imposto de Renda.
          </p>
          <p>
            O Restitua não substitui orientação contábil, fiscal ou jurídica profissional. O usuário permanece
            responsável pela conferência dos dados antes de qualquer envio a órgãos oficiais.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">3. Cadastro e conta</h2>
          <p>
            Você deve fornecer informações verdadeiras e manter seus dados atualizados. A segurança de login e senha é
            de responsabilidade do usuário.
          </p>
          <p>
            Podemos suspender ou encerrar contas em caso de fraude, uso indevido, violação legal ou descumprimento
            destes termos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">4. Uso permitido</h2>
          <p>É proibido:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>usar o serviço para fins ilícitos, fraudulentos ou para violar direitos de terceiros;</li>
            <li>tentar acessar dados de outros usuários;</li>
            <li>interferir na segurança, disponibilidade ou integridade da plataforma.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">5. IA e processamento de documentos</h2>
          <p>
            O Restitua utiliza provedores externos de IA para extrair dados de notas fiscais. Resultados podem conter
            imprecisões e devem ser revisados por você antes de salvar ou exportar.
          </p>
          <p>
            Podemos aplicar limites de uso, incluindo limite de requisições e de processamento, para garantir
            estabilidade e controle de custos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">6. Armazenamento e disponibilidade</h2>
          <p>
            Arquivos e dados podem ser armazenados em serviços de nuvem de terceiros. Empregamos medidas técnicas
            razoáveis de segurança, sem garantia absoluta contra indisponibilidade, perda de dados ou incidentes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">7. Propriedade intelectual</h2>
          <p>
            O software, marca, layout e demais elementos do Restitua são protegidos por direitos de propriedade
            intelectual. Você recebe licença limitada, não exclusiva e revogável para uso pessoal da plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">8. Limitação de responsabilidade</h2>
          <p>
            Na extensão permitida por lei, o Restitua não se responsabiliza por decisões fiscais do usuário, erros de
            classificação automática, lucros cessantes ou danos indiretos decorrentes do uso da plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">9. Encerramento de conta</h2>
          <p>
            Você pode solicitar a exclusão da conta. O encerramento pode remover dados e comprovantes vinculados ao
            seu usuário, conforme nossa Política de Privacidade e obrigações legais aplicáveis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">10. Alterações destes termos</h2>
          <p>
            Podemos atualizar estes Termos a qualquer momento. A versão vigente será publicada nesta página com data
            de atualização.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">11. Contato</h2>
          <p>
            Dúvidas sobre estes Termos: <a href="mailto:suporte@restitua.com" className="text-blue-600 hover:text-blue-700">suporte@restitua.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
