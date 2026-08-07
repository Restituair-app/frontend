import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Download, Eye, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { hasPremiumAccess } from '@/utils/subscriptionPlan';

const formatBytes = (value) => {
  if (!Number.isFinite(value) || value <= 0) return '0 KB';
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.ceil(value / 1024)} KB`;
};

export default function ModelosJuridicos() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isPremium = hasPremiumAccess(currentUser);

  const modelosQuery = useQuery({
    queryKey: ['legal-models'],
    queryFn: () => base44.legalModels.list(),
    enabled: Boolean(currentUser) && isPremium,
    retry: false,
  });

  if (currentUser && !isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-3xl mx-auto pt-6">
          <Card className="overflow-hidden border-amber-200 bg-white/90 shadow-xl dark:border-amber-400/25 dark:bg-slate-900/80">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-300/15 dark:text-amber-200">
                <Lock className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl text-slate-950 dark:text-slate-50">Modelos Jurídicos é Premium</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Assinantes Premium acessam modelos jurídicos, visualizam os arquivos e podem baixar os documentos direto pelo Restitua.
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto pt-6">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Premium</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">Modelos Jurídicos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Arquivos de apoio para organizar solicitações, documentos e rotinas relacionadas às suas despesas.
          </p>
        </div>

        {modelosQuery.isLoading || !currentUser ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-44 rounded-2xl" />)}
          </div>
        ) : null}

        {!modelosQuery.isLoading && (modelosQuery.data || []).length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <FileText className="h-7 w-7" />
              <p>Nenhum modelo jurídico disponível no momento.</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {(modelosQuery.data || []).map((modelo) => (
            <Card key={modelo.id} className="shadow-lg dark:bg-slate-900/80">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-300/15 dark:text-blue-200">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-6 text-slate-950 dark:text-slate-50">{modelo.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{modelo.fileName} • {formatBytes(modelo.size)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{modelo.description}</p>
                <div className="flex flex-wrap gap-2">
                  <a href={modelo.fileUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" /> Visualizar
                    </Button>
                  </a>
                  <a href={modelo.fileUrl} download={modelo.fileName}>
                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Download className="h-4 w-4" /> Baixar
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
