import React from 'react';
import { Archive, CalendarDays, Ribbon, ShieldCheck } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function WarrantyInfoModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[88vh] w-[calc(100vw-24px)] max-w-2xl overflow-hidden rounded-2xl border-blue-200 bg-white p-0 shadow-2xl dark:border-blue-900/60 dark:bg-slate-950">
        <div className="max-h-[88vh] overflow-y-auto p-5 sm:p-6">
          <div className="flex gap-4 pr-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                Eletrônicos / Eletrodomésticos
              </p>
              <h2 className="text-xl font-black text-slate-950 dark:text-slate-50">
                Controle a garantia do seu produto
              </h2>
              <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                Informe o período de garantia para acompanhar o prazo e consultar sua nota fiscal quando precisar acionar assistência ou suporte.
              </p>
            </div>
          </div>

          <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/35">
            <div className="mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <CalendarDays className="h-5 w-5" />
              <h3 className="text-sm font-extrabold">Como funciona</h3>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
              Basta informar o período de garantia e manter sua nota fiscal armazenada no Restitua para consultá-la facilmente caso precise acionar a garantia.
            </p>
          </section>

          <section className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <div className="mb-2 flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <Archive className="h-5 w-5" />
              <h3 className="text-sm font-extrabold">Basic e Premium</h3>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
              No plano Basic e Premium você tem a nota fiscal armazenada por um período maior que 12 meses. Assim, a garantia do produto fica acessível por mais tempo.
            </p>
          </section>

          <section className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <Ribbon className="mt-0.5 h-6 w-6 shrink-0 text-amber-500 dark:text-amber-300" />
            <p className="text-sm font-extrabold leading-relaxed">
              No Plano Premium, você também conta com Modelo de Requerimentos para solicitar o acionamento da garantia de forma prática e organizada.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
