import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appLogo } from '@/brandAssets';
import { CheckCircle2, KeyRound } from 'lucide-react';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export default function ChangePasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasToken = useMemo(() => Boolean(token && token.trim().length > 0), [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!hasToken) {
      setError('Token de recuperação inválido. Solicite um novo link de recuperação.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 8) {
      setError('A senha precisa ter no mínimo 8 caracteres.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError('A senha deve conter letra maiúscula, minúscula, número e caractere especial.');
      return;
    }

    setLoading(true);

    try {
      await base44.auth.resetPassword({ token, password });
      setSuccess('Senha alterada com sucesso. Agora acesse com sua nova senha.');
      setPassword('');
      setPasswordConfirm('');
    } catch (requestError) {
      const apiMessage = requestError?.data?.message;
      const fallbackMessage = 'Não foi possível alterar a senha.';

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
            <CardTitle>Definir nova senha</CardTitle>
          </div>
          <CardDescription>
            Digite e confirme sua nova senha para concluir a recuperação.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm">Confirmar nova senha</Label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="********"
                required
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              A senha deve conter letra maiúscula, minúscula, número e caractere especial.
            </p>

            {error ? (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loading || !hasToken}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-lg hover:from-slate-800 hover:to-blue-800 transition-all font-semibold shadow-lg disabled:opacity-70"
            >
              {loading ? (
                'Salvando...'
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Alterar senha
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
              Ir para login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
