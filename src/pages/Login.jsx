import React, { useMemo, useState } from 'react';

import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const getDefaultRedirect = () => '/Dashboard';

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

      redirectAfterAuth();
    } catch (requestError) {
      setError(requestError?.data?.message?.message[0] || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Entrar' : 'Criar Conta'}</CardTitle>
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

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
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
