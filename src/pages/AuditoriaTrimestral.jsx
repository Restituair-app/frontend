import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, Crown, Download, Eye, FileSearch, Lock, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { hasPremiumAccess } from '@/utils/subscriptionPlan';

const statusMeta = {
  pendente: { label: 'Pendente', icon: Clock3, className: 'bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200' },
  em_analise: { label: 'Em análise', icon: PlayCircle, className: 'bg-blue-100 text-blue-700 dark:bg-blue-300/15 dark:text-blue-200' },
  concluido: { label: 'Concluído', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-300/15 dark:text-green-200' },
};

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

export default function AuditoriaTrimestral() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isPremium = hasPremiumAccess(currentUser);

  const ticketsQuery = useQuery({
    queryKey: ['audit-tickets'],
    queryFn: () => base44.auditTickets.list(),
    enabled: Boolean(currentUser) && isPremium,
    retry: false,
  });

  const requestMutation = useMutation({
    mutationFn: () => base44.auditTickets.request(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-tickets'] });
    },
  });

  if (currentUser && !isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:from-slate-950 dark:to-slate-900 md:p-8">
        <div className="mx-auto max-w-3xl pt-6">
          <Card className="overflow-hidden border-amber-200 bg-white/90 shadow-xl dark:border-amber-400/25 dark:bg-slate-900/80">
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-300/15 dark:text-amber-200">
                <Lock className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl text-slate-950 dark:text-slate-50">Auditoria Trimestral é Premium</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm leading-6 text-muted-foreground">
                Assinantes Premium podem solicitar uma auditoria das notas restituíveis e acompanhar o relatório final pelo Restitua.
              </p>
              <Link to="/premium">
                <Button className="bg-gradient-to-r from-slate-900 to-blue-900 text-white hover:opacity-95">
                  <Crown className="mr-2 h-4 w-4" /> Ver plano Premium
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:from-slate-950 dark:to-slate-900 md:p-8">
      <div className="mx-auto max-w-5xl pt-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Premium</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">Auditoria Trimestral</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Solicite uma análise periódica das suas notas e acompanhe o status do ticket até o relatório final.
            </p>
          </div>
          <Button
            className="gap-2 bg-gradient-to-r from-slate-900 to-blue-900 text-white hover:opacity-95"
            onClick={() => requestMutation.mutate()}
            disabled={requestMutation.isPending}
          >
            <FileSearch className="h-4 w-4" /> {requestMutation.isPending ? 'Solicitando...' : 'Solicitar auditoria'}
          </Button>
        </div>

        {ticketsQuery.isLoading || !currentUser ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((item) => <Skeleton key={item} className="h-44 rounded-2xl" />)}
          </div>
        ) : null}

        {!ticketsQuery.isLoading && (ticketsQuery.data || []).length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <FileSearch className="h-7 w-7" />
              <p>Nenhum ticket de auditoria solicitado ainda.</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {(ticketsQuery.data || []).map((ticket) => {
            const meta = statusMeta[ticket.status] || statusMeta.pendente;
            const Icon = meta.icon;
            return (
              <Card key={ticket.id} className="shadow-lg dark:bg-slate-900/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base text-slate-950 dark:text-slate-50">Auditoria solicitada</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">Solicitado em {formatDate(ticket.requestedAt)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>
                      <Icon className="h-3.5 w-3.5" /> {meta.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                    <p>Período analisado: {ticket.analysisRangeStart || '-'} até {ticket.analysisRangeEnd || '-'}</p>
                    <p>Responsável: {ticket.handledBy || '-'}</p>
                  </div>

                  {ticket.observations ? (
                    <p className="rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-950 dark:bg-blue-300/10 dark:text-blue-100">
                      {ticket.observations}
                    </p>
                  ) : null}

                  {ticket.status === 'concluido' && ticket.reportUrl ? (
                    <div className="flex flex-wrap gap-2">
                      <a href={ticket.reportUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" /> Visualizar relatório
                        </Button>
                      </a>
                      <a href={ticket.reportUrl} download={ticket.reportFileName || 'relatorio-auditoria.pdf'}>
                        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                          <Download className="h-4 w-4" /> Baixar relatório
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">O relatório ficará disponível quando a análise for concluída.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
