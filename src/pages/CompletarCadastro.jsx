import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { UserCheck } from 'lucide-react';

function formatCPF(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatCelular(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function CompletarCadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome_completo: '', cpf: '', celular: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'cpf') formatted = formatCPF(value);
    if (name === 'celular') formatted = formatCelular(value);
    setForm(prev => ({ ...prev, [name]: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!form.nome_completo.trim()) {
      setErro('Por favor, informe seu nome completo.');
      return;
    }
    const cpfLimpo = form.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setErro('CPF inválido. Digite todos os 11 dígitos.');
      return;
    }
    const celularLimpo = form.celular.replace(/\D/g, '');
    if (celularLimpo.length < 10) {
      setErro('Celular inválido. Digite o DDD + número.');
      return;
    }

    setLoading(true);
    await base44.auth.updateMe({
      nome_completo: form.nome_completo,
      cpf: form.cpf,
      celular: form.celular,
      cadastro_completo: true
    });
    window.location.href = '/Dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Complete seu cadastro</CardTitle>
          <CardDescription className="text-slate-500 mt-1">
            Precisamos de mais algumas informações para ativar sua conta.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="nome_completo" className="text-slate-700 font-medium">Nome Completo</Label>
              <Input
                id="nome_completo"
                name="nome_completo"
                placeholder="Seu nome completo"
                value={form.nome_completo}
                onChange={handleChange}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cpf" className="text-slate-700 font-medium">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={handleChange}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="celular" className="text-slate-700 font-medium">Número de Celular</Label>
              <Input
                id="celular"
                name="celular"
                placeholder="(11) 99999-9999"
                value={form.celular}
                onChange={handleChange}
                required
                className="h-11"
              />
            </div>

            {erro && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{erro}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
            >
              {loading ? 'Salvando...' : 'Concluir Cadastro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}