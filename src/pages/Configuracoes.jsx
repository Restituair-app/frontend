import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getThemePreference, resolveTheme, setThemePreference } from '@/lib/theme';
import { getSubscriptionLabel, getSubscriptionTier, SUBSCRIPTION_TIERS } from '@/utils/subscriptionPlan';
import { AlertTriangle, Trash2, LogOut, UserPen, CheckCircle, Moon, Sun, Crown, User, X } from 'lucide-react';

function formatCPF(value) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatCelular(value) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editar cadastro
  const [form, setForm] = useState({ nome_completo: '', cpf: '', celular: '' });
  const [savingCadastro, setSavingCadastro] = useState(false);
  const [erroCadastro, setErroCadastro] = useState('');
  const [sucessoCadastro, setSucessoCadastro] = useState(false);
  const [themeMode, setThemeMode] = useState('light');
  const [currentUser, setCurrentUser] = useState(null);
  const [billingLoading, setBillingLoading] = useState('');

  useEffect(() => {
    base44.auth.me().then((me) => {
      setCurrentUser(me);
      setForm({
        nome_completo: me.nome_completo || '',
        cpf: me.cpf || '',
        celular: me.celular || '',
      });
    }).catch(() => {});

    const preference = getThemePreference();
    setThemeMode(resolveTheme(preference));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'cpf') formatted = formatCPF(value);
    if (name === 'celular') formatted = formatCelular(value);
    setForm(prev => ({ ...prev, [name]: formatted }));
  };

  const handleSaveCadastro = async (e) => {
    e.preventDefault();
    setErroCadastro('');
    setSucessoCadastro(false);
    if (!form.nome_completo.trim()) { setErroCadastro('Informe seu nome completo.'); return; }
    const cpfLimpo = form.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) { setErroCadastro('CPF inválido. Digite todos os 11 dígitos.'); return; }
    const celularLimpo = form.celular.replace(/\D/g, '');
    if (celularLimpo.length < 10) { setErroCadastro('Celular inválido. Digite o DDD + número.'); return; }

    setSavingCadastro(true);
    await base44.auth.updateMe({ nome_completo: form.nome_completo, cpf: form.cpf, celular: form.celular });
    setSavingCadastro(false);
    setSucessoCadastro(true);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      // RF-02.5: sempre remover notas antes da conta.
      const me = await base44.auth.me();
      const notas = await base44.entities.NotaFiscal.filter({ created_by: me.email });
      await Promise.all(notas.map((n) => base44.entities.NotaFiscal.delete(n.id)));

      // RF-02.4: remover conta permanentemente.
      await base44.auth.deleteMePermanent();
      queryClient.clear();
      await base44.auth.logout('/LandingPage');
    } finally {
      setDeleting(false);
    }
  };

  const handleThemeChange = (checked) => {
    const nextTheme = checked ? 'dark' : 'light';
    setThemePreference(nextTheme);
    setThemeMode(nextTheme);
  };

  const handleCheckout = async (plan) => {
    setBillingLoading(plan);

    try {
      const response = await base44.billing.createCheckout({ plan });
      if (response?.user) {
        setCurrentUser(response.user);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
      if (response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (error) {
      alert(error?.message || 'Não foi possível iniciar a assinatura.');
    } finally {
      setBillingLoading('');
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm('Deseja cancelar a renovação do plano? O acesso fica ativo até o fim do período atual.');
    if (!confirmed) return;

    setBillingLoading('cancel');

    try {
      const response = await base44.billing.cancelSubscription();
      if (response?.user) {
        setCurrentUser(response.user);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
      alert(response?.message || 'Cancelamento agendado com sucesso.');
    } catch (error) {
      alert(error?.message || 'Não foi possível cancelar o plano.');
    } finally {
      setBillingLoading('');
    }
  };

  const subscriptionTier = getSubscriptionTier(currentUser);
  const subscriptionLabel = getSubscriptionLabel(currentUser);
  const subscriptionDescription = {
    [SUBSCRIPTION_TIERS.FREE]: 'PDF e relatórios sem limite; comprovantes dos últimos 12 meses.',
    [SUBSCRIPTION_TIERS.BASIC]: 'CSV/Excel liberado e histórico de até 5 anos.',
    [SUBSCRIPTION_TIERS.PREMIUM]: 'Histórico ilimitado, memórias da nota e recursos Premium.',
  }[subscriptionTier];
  const subscriptionStyle = {
    [SUBSCRIPTION_TIERS.FREE]: {
      card: 'border-slate-200 dark:border-slate-800',
      icon: 'text-slate-500 dark:text-slate-300',
      box: 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70',
      badge: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    },
    [SUBSCRIPTION_TIERS.BASIC]: {
      card: 'border-blue-200 dark:border-blue-900/60',
      icon: 'text-blue-600 dark:text-blue-300',
      box: 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-950/60',
      badge: 'bg-blue-600 text-white dark:bg-blue-400/15 dark:text-blue-200 dark:ring-1 dark:ring-blue-300/25',
    },
    [SUBSCRIPTION_TIERS.PREMIUM]: {
      card: 'border-amber-300 dark:border-amber-700/70',
      icon: 'text-amber-600 dark:text-amber-300',
      box: 'border-amber-300 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-950/45',
      badge: 'bg-amber-500 text-white dark:bg-amber-300/15 dark:text-amber-200 dark:ring-1 dark:ring-amber-200/25',
    },
  }[subscriptionTier];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Configurações da Conta</h1>

        <Card className={`shadow-lg mb-4 ${subscriptionStyle.card}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className={`w-4 h-4 ${subscriptionStyle.icon}`} />
              Plano ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`rounded-xl border p-4 ${subscriptionStyle.box}`}>
              <p className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${subscriptionStyle.badge}`}>
                {subscriptionLabel}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{subscriptionDescription}</p>
              {currentUser?.subscriptionStatus === 'scheduled_cancel' && (
                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Cancelamento agendado. Seu acesso permanece ativo até o fim do período.
                </p>
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {subscriptionTier === SUBSCRIPTION_TIERS.FREE && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 border-blue-300 bg-transparent text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-400/40 dark:text-blue-200 dark:hover:bg-blue-950/40"
                      disabled={Boolean(billingLoading)}
                      onClick={() => handleCheckout(SUBSCRIPTION_TIERS.BASIC)}
                    >
                      <User className="h-4 w-4" />
                      {billingLoading === SUBSCRIPTION_TIERS.BASIC ? 'Ativando...' : 'Assinar Basic'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 border-amber-400 bg-transparent text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-300/50 dark:text-amber-200 dark:hover:bg-amber-950/35"
                      disabled={Boolean(billingLoading)}
                      onClick={() => handleCheckout(SUBSCRIPTION_TIERS.PREMIUM)}
                    >
                      <Crown className="h-4 w-4" />
                      {billingLoading === SUBSCRIPTION_TIERS.PREMIUM ? 'Ativando...' : 'Assinar Premium'}
                    </Button>
                  </>
                )}
                {subscriptionTier === SUBSCRIPTION_TIERS.BASIC && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 border-amber-400 bg-transparent text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-300/50 dark:text-amber-200 dark:hover:bg-amber-950/35"
                      disabled={Boolean(billingLoading)}
                      onClick={() => handleCheckout(SUBSCRIPTION_TIERS.PREMIUM)}
                    >
                      <Crown className="h-4 w-4" />
                      {billingLoading === SUBSCRIPTION_TIERS.PREMIUM ? 'Ativando...' : 'Upgrade Premium'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 border-slate-300 bg-transparent text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      disabled={Boolean(billingLoading)}
                      onClick={handleCancelSubscription}
                    >
                      <X className="h-4 w-4" />
                      {billingLoading === 'cancel' ? 'Cancelando...' : 'Cancelar plano'}
                    </Button>
                  </>
                )}
                {subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-slate-300 bg-transparent text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:col-span-2"
                    disabled={Boolean(billingLoading)}
                    onClick={handleCancelSubscription}
                  >
                    <X className="h-4 w-4" />
                    {billingLoading === 'cancel' ? 'Cancelando...' : 'Cancelar plano'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editar Dados Pessoais */}
        <Card className="shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPen className="w-4 h-4" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCadastro} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome_completo">Nome Completo</Label>
                <Input id="nome_completo" name="nome_completo" value={form.nome_completo} onChange={handleChange} placeholder="Seu nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="celular">Celular</Label>
                <Input id="celular" name="celular" value={form.celular} onChange={handleChange} placeholder="(11) 99999-9999" />
              </div>
              {erroCadastro && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{erroCadastro}</p>}
              {sucessoCadastro && (
                <p className="text-green-700 text-sm bg-green-50 p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Dados atualizados com sucesso!
                </p>
              )}
              <Button type="submit" disabled={savingCadastro} className="w-full bg-blue-600 hover:bg-blue-700">
                {savingCadastro ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-base">Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                {themeMode === 'dark' ? (
                  <Moon className="w-4 h-4 text-slate-500" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Modo escuro</p>
                  <p className="text-xs text-muted-foreground">
                    {themeMode === 'dark' ? 'Ativado' : 'Desativado'}
                  </p>
                </div>
              </div>
              <Switch
                checked={themeMode === 'dark'}
                onCheckedChange={handleThemeChange}
                aria-label="Alternar entre tema claro e escuro"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-4">
          <CardHeader>
            <CardTitle className="text-base">Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-2 select-none"
              onClick={() => base44.auth.logout('/LandingPage')}
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Excluir sua conta removerá permanentemente todos os seus dados, incluindo todas as notas fiscais cadastradas. Esta ação <strong>não pode ser desfeita</strong>.
            </p>
            {!confirmDelete ? (
              <Button
                variant="destructive"
                className="w-full gap-2 select-none"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-4 h-4" />
                Excluir minha conta
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 text-center">Tem certeza? Esta ação é irreversível.</p>
                <Button
                  variant="destructive"
                  className="w-full gap-2 select-none"
                  disabled={deleting}
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Excluindo...' : 'Sim, excluir minha conta'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full select-none"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
