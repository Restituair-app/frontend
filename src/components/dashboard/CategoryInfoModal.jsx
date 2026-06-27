import React from 'react';
import { BarChart3, Check, Info, ShieldCheck, X } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function InfoList({ items, icon: Icon, iconClassName }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2">
          <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', iconClassName)} />
          <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-200">{item}</p>
        </div>
      ))}
    </div>
  );
}

export default function CategoryInfoModal({ categoryKey, content, categoryMeta, onClose }) {
  const Icon = categoryMeta?.icon;
  const verificationMessage = content?.important.find((item) => item.startsWith('O Restitua verifica'));
  const importantItems = content?.important.filter((item) => item !== verificationMessage) || [];

  return (
    <Dialog open={Boolean(categoryKey && content)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] w-[calc(100vw-24px)] max-w-3xl overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl dark:border-slate-800">
        {content ? (
          <div className="max-h-[88vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex gap-4 pr-8">
              <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-opacity-15', categoryMeta?.cor)}>
                {Icon ? <Icon className={cn('h-7 w-7', categoryMeta?.iconColor)} /> : null}
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-50">{content.title}</h2>
                {content.description.map((description) => (
                  <p key={description} className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                    {description}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <section>
                <h3 className="mb-3 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">O que entra:</h3>
                <InfoList items={content.included} icon={Check} iconClassName="text-emerald-600 dark:text-emerald-300" />
              </section>

              <section className="border-t border-slate-200 pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0 dark:border-slate-800">
                <h3 className="mb-3 text-xs font-extrabold text-red-600 dark:text-red-300">O que não entra:</h3>
                <InfoList items={content.excluded} icon={X} iconClassName="text-red-500 dark:text-red-300" />
              </section>
            </div>

            <section className="mt-5 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40">
              <div className="mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                <h3 className="text-sm font-extrabold text-blue-800 dark:text-blue-200">Importante:</h3>
              </div>
              <div className="space-y-2">
                {importantItems.map((item) => (
                  <p key={item} className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
                    {item}
                  </p>
                ))}
              </div>
            </section>

            {content.deductionNote ? (
              <section className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <BarChart3 className="mt-0.5 h-6 w-6 shrink-0 text-amber-500 dark:text-amber-300" />
                <p className="text-xs font-extrabold leading-relaxed">{content.deductionNote}</p>
              </section>
            ) : null}

            {verificationMessage ? (
              <section className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-blue-600 dark:text-blue-300" />
                <p className="text-xs font-extrabold leading-relaxed">{verificationMessage}</p>
              </section>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
