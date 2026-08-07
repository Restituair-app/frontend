import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, Crown, Lock, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { hasPremiumAccess } from '@/utils/subscriptionPlan';

const statusMeta = {
  nao_respondido: { label: 'Não respondido', icon: Clock3, className: 'bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200' },
  em_curso: { label: 'Em curso', icon: MessageCircle, className: 'bg-blue-100 text-blue-700 dark:bg-blue-300/15 dark:text-blue-200' },
  finalizado: { label: 'Finalizado', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-300/15 dark:text-green-200' },
};

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

export default function SuportePremium() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isPremium = hasPremiumAccess(currentUser);

  const ticketsQuery = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => base44.supportTickets.list(),
    enabled: Boolean(currentUser) && isPremium,
    retry: false,
  });

  const tickets = ticketsQuery.data || [];
  const activeTicket = useMemo(() => {
    if (selectedTicketId) {
      return tickets.find((ticket) => ticket.id === selectedTicketId) || null;
    }
    return tickets.find((ticket) => ticket.status !== 'finalizado') || tickets[0] || null;
  }, [selectedTicketId, tickets]);

  const sendMutation = useMutation({
    mutationFn: () => {
      const body = message.trim();
      if (!body) throw new Error('Digite uma mensagem.');
      if (activeTicket && activeTicket.status !== 'finalizado') {
        return base44.supportTickets.reply(activeTicket.id, body);
      }
      return base44.supportTickets.create(body);
    },
    onSuccess: (ticket) => {
      setMessage('');
      setSelectedTicketId(ticket.id);
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => base44.supportTickets.finalize(activeTicket.id),
    onSuccess: (ticket) => {
      setSelectedTicketId(ticket.id);
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
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
              <CardTitle className="text-xl text-slate-950 dark:text-slate-50">Suporte Premium é exclusivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm leading-6 text-muted-foreground">
                Assinantes Premium podem falar diretamente com o suporte e acompanhar o atendimento pelo Restitua.
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
      <div className="mx-auto max-w-6xl pt-6">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Suporte Premium</h1>
          <p className="text-sm text-muted-foreground">Envie uma mensagem para o suporte e acompanhe a resposta por aqui.</p>
        </div>

        {ticketsQuery.isLoading || !currentUser ? (
          <div className="grid gap-4 md:grid-cols-[320px_1fr]">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        ) : null}

        {!ticketsQuery.isLoading && currentUser ? (
          <div className="grid gap-4 md:grid-cols-[320px_1fr]">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-center gap-2 rounded-2xl"
                onClick={() => setSelectedTicketId(null)}
              >
                <MessageCircle className="h-4 w-4" /> Nova mensagem
              </Button>

              {tickets.map((ticket) => {
                const meta = statusMeta[ticket.status] || statusMeta.nao_respondido;
                const Icon = meta.icon;
                const preview = ticket.messages[ticket.messages.length - 1]?.body || 'Sem mensagens';
                const isActive = activeTicket?.id === ticket.id;

                return (
                  <button
                    key={ticket.id}
                    className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${isActive ? 'border-blue-300 bg-blue-50 dark:border-blue-400/35 dark:bg-blue-300/10' : 'border-border bg-card hover:border-blue-200 dark:hover:border-blue-400/25'}`}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <strong className="text-sm text-foreground">Atendimento</strong>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${meta.className}`}>
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{preview}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{formatDate(ticket.lastMessageAt)}</p>
                  </button>
                );
              })}
            </div>

            <Card className="shadow-lg dark:bg-slate-900/80">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-slate-950 dark:text-slate-50">
                      {activeTicket ? 'Conversa com suporte' : 'Nova mensagem'}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activeTicket ? `Atualizado em ${formatDate(activeTicket.lastMessageAt)}` : 'Abra um novo atendimento premium.'}
                    </p>
                  </div>
                  {activeTicket ? (
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${statusMeta[activeTicket.status]?.className}`}>
                      {statusMeta[activeTicket.status]?.label}
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[430px] space-y-3 overflow-auto rounded-2xl border border-border bg-background/50 p-3">
                  {(activeTicket?.messages || []).length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Digite sua mensagem para iniciar o atendimento.</p>
                  ) : null}

                  {(activeTicket?.messages || []).map((item, index) => (
                    <div key={`${item.createdAt}-${index}`} className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl border p-3 text-sm leading-6 ${item.sender === 'user' ? 'border-blue-200 bg-blue-600 text-white dark:border-blue-400/25' : 'border-border bg-card text-foreground'}`}>
                        <p className="whitespace-pre-wrap">{item.body}</p>
                        <p className={`mt-2 text-[11px] ${item.sender === 'user' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                          {item.sender === 'user' ? 'Você' : 'Suporte'} • {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {activeTicket?.status === 'finalizado' ? (
                  <p className="rounded-2xl bg-green-50 p-3 text-sm text-green-800 dark:bg-green-300/10 dark:text-green-100">
                    Atendimento finalizado. Envie uma nova mensagem para abrir outro atendimento.
                  </p>
                ) : null}

                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Digite sua mensagem para o suporte..."
                  maxLength={4000}
                  className="min-h-28 resize-none rounded-2xl"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="gap-2 bg-gradient-to-r from-slate-900 to-blue-900 text-white hover:opacity-95"
                    disabled={sendMutation.isPending || !message.trim()}
                    onClick={() => sendMutation.mutate()}
                  >
                    <Send className="h-4 w-4" /> {sendMutation.isPending ? 'Enviando...' : 'Enviar mensagem'}
                  </Button>
                  {activeTicket && activeTicket.status !== 'finalizado' ? (
                    <Button variant="outline" className="gap-2" disabled={finalizeMutation.isPending} onClick={() => finalizeMutation.mutate()}>
                      <CheckCircle2 className="h-4 w-4" /> Finalizar atendimento
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
