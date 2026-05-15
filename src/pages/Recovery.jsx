import React, { useState } from 'react';

import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appLogo } from '@/brandAssets';
import { ArrowLeft, Mail } from 'lucide-react';

export default function RecoveryPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Informe seu e-mail.');
      return;
    }

    setLoading(true);

    try {
      await base44.auth.requestPasswordRecovery(email.trim());
      setSuccess('Se o e-mail existir na plataforma, enviaremos as instruções de recuperação.');
      setEmail('');
    } catch (requestError) {
      const apiMessage = requestError?.data?.message;
      const fallbackMessage = 'Não foi possível enviar o e-mail de recuperação.';

      if (typeof apiMessage === 'string') {
        setError(apiMessage);
      } else if (Array.isArray(apiMessage?.message) && apiMessage.message.length > 0) {
        setError(String(apiMessage.message[0]));
      } else {
        setError(fallbackMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border border-slate-200/70 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <img src={appLogo} alt="Restitua logo" className="h-16 w-auto object-contain" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Restitua</p>
            <CardTitle>Recuperar senha</CardTitle>
          </div>
          <CardDescription>
            Informe seu e-mail para receber o link de redefinição da senha.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md">
                {success}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-lg hover:from-slate-800 hover:to-blue-800 transition-all font-semibold shadow-lg disabled:opacity-70"
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Recuperar senha
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-300 dark:border-slate-700"
              onClick={() => {
                window.location.href = '/Login';
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
