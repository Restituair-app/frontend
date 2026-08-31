import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, Gift, Sparkles, Ticket, Trophy } from 'lucide-react';

import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PremiosCashback() {
  const { data, isLoading } = useQuery({ queryKey: ['cashback-prizes'], queryFn: () => base44.cashback.prizes(), refetchOnMount: 'always' });
  const active = data?.active;
  const winners = data?.winners || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-white">
      <div className="mx-auto max-w-5xl space-y-5 py-6">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Cashback')}><Button variant="outline" size="icon" className="border-white/15 bg-white/10 text-white hover:bg-white/15"><ChevronLeft className="h-4 w-4" /></Button></Link>
          <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Prêmios</p><h1 className="text-2xl font-bold tracking-tight">Sorteios do Programa Cashback</h1></div>
        </div>

        {isLoading ? <Card className="border-white/10 bg-white/10 text-white"><CardContent className="p-6">Carregando prêmios...</CardContent></Card> : active ? (
          <Card className="overflow-hidden border-amber-300/20 bg-white/95 dark:bg-slate-950/80">
            {active.bannerUrl ? <img src={active.bannerUrl} alt={active.title} className="h-72 w-full object-cover" /> : null}
            <CardContent className="space-y-3 p-6">
              <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-200"><Gift className="mr-1 h-3.5 w-3.5" /> Sorteio ativo</div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">{active.title}</h2>
              <p className="text-muted-foreground">{active.subtitle}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-10 text-center shadow-2xl">
            <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-amber-400/25 blur-2xl" />
            <div className="absolute -bottom-20 -right-14 h-56 w-56 rounded-full bg-blue-500/25 blur-2xl" />
            <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
              <div className="flex items-center gap-5 text-amber-200"><Sparkles /><Ticket className="h-12 w-12 text-blue-200" /><Gift /></div>
              <h2 className="text-2xl font-black">{data?.fallback?.title || 'Próximo sorteio em breve'}</h2>
              <p className="text-slate-300">{data?.fallback?.subtitle || 'Aguarde e acumule cupons para concorrer aos próximos prêmios.'}</p>
            </div>
          </div>
        )}

        <Card className="border-white/10 bg-white/95 dark:bg-slate-950/80">
          <CardContent className="space-y-3 p-5">
            <h2 className="font-bold text-slate-950 dark:text-white">Histórico de ganhadores</h2>
            {winners.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum ganhador publicado ainda.</p> : winners.map((winner) => (
              <div key={winner.id} className="flex items-center gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
                <Trophy className="h-5 w-5 text-amber-500" />
                <div><p className="font-semibold text-slate-950 dark:text-white">{winner.winnerUserName || winner.winnerUserEmail || 'Ganhador'}</p><p className="text-xs text-muted-foreground">Cupom {winner.winningCouponCode}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
