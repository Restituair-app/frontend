import React, { useMemo, useState } from 'react';

import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appLogo } from '@/brandAssets';
import { LogIn, UserPlus } from 'lucide-react';

const getDefaultRedirect = () => '/dashboard';

const parseRedirectUrl = () => {
  const url = new URL(window.location.href);
  const from = url.searchParams.get('from');

  if (!from || from.trim().length === 0) {
    return getDefaultRedirect();
  }

  return from;
};

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const redirectTo = useMemo(() => parseRedirectUrl(), []);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const redirectAfterAuth = () => {
    if (redirectTo.startsWith('http://') || redirectTo.startsWith('https://')) {
      window.location.href = redirectTo;
      return;
    }

    window.location.href = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Informe e-mail e senha.');
      return;
    }

    if (mode === 'register' && form.password !== form.passwordConfirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        await base44.auth.register({
          name: form.name || undefined,
          email: form.email,
          password: form.password,
        });
      } else {
        await base44.auth.login({
          email: form.email,
          password: form.password,
        });
      }

      const me = await base44.auth.me();
      if (!me?.cadastro_completo) {
        window.location.href = '/CompletarCadastro';
        return;
      }

      redirectAfterAuth();
    } catch (requestError) {
      setError(requestError?.data?.message?.message[0] || 'Falha ao autenticar.');
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
            <CardTitle>{mode === 'login' ? 'Entrar na sua conta' : 'Criar sua conta'}</CardTitle>
          </div>
          <CardDescription>
            {mode === 'login'
              ? 'Acesse sua conta para continuar.'
              : 'Crie sua conta e comece a organizar suas notas.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="voce@email.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="********"
                required
              />
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label htmlFor="passwordConfirm">Confirmar senha</Label>
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  placeholder="********"
                  required
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-lg hover:from-slate-800 hover:to-blue-800 transition-all font-semibold shadow-lg disabled:opacity-70"
            >
              {loading ? (
                'Aguarde...'
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Criar conta
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-300 dark:border-slate-700"
              onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
            >
              {mode === 'login' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
