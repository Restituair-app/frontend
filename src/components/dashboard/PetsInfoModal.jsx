import React from 'react';
import { ExternalLink, FileText, PawPrint, Scale, ShieldCheck } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

const CAMARA_URL = 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2594651';

export default function PetsInfoModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[88vh] w-[calc(100vw-24px)] max-w-2xl overflow-hidden rounded-2xl border-amber-200 bg-white p-0 shadow-2xl dark:border-amber-900/60 dark:bg-slate-950">
        <div className="max-h-[88vh] overflow-y-auto p-5 sm:p-6">
          <div className="flex gap-4 pr-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
              <PawPrint className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Categoria Pets
              </p>
              <h2 className="text-xl font-black text-slate-950 dark:text-slate-50">
                Saúde preventiva de pets pode virar dedução no IR
              </h2>
              <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                Existe o Projeto de Lei nº 6307/2025, proposto pelo Deputado Federal Stélio Dener, que propõe alterar a Lei nº 9.250, de 26 de dezembro de 1995.
              </p>
            </div>
          </div>

          <section className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Scale className="h-5 w-5" />
              <h3 className="text-sm font-extrabold">O que o projeto propõe</h3>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
              A proposta busca instituir incentivo fiscal às despesas com saúde preventiva de animais de estimação, no âmbito da Política Nacional de Saúde Única Homem-Animal-Ambiente.
            </p>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
              Em resumo, o projeto prevê a dedução no Imposto de Renda de gastos com saúde de pets.
            </p>
          </section>

          <section className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/35">
            <div className="mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <FileText className="h-5 w-5" />
              <h3 className="text-sm font-extrabold">Acompanhe a tramitação oficial</h3>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
              Caso queira acompanhar a tramitação do projeto de lei e sua aprovação, acesse o endereço oficial da Câmara dos Deputados. Lá também é possível contribuir com sua opinião, apoio e votação.
            </p>
            <a
              href={CAMARA_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-blue-700"
            >
              Portal da Câmara dos Deputados
              <ExternalLink className="h-4 w-4" />
            </a>
          </section>

          <section className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-blue-600 dark:text-blue-300" />
            <p className="text-sm font-extrabold leading-relaxed">
              Não deixe de anexar suas fotos e gastos com a saúde dos seus pets. Caso o projeto de lei venha a ser aprovado, você já estará na frente e munido de documentação para pedir sua devida restituição de imposto.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
