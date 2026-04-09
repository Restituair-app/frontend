import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Receipt,
  TrendingUp,
  FileText,
  LogOut,
  XCircle,
  RefreshCw,
  Heart,
  Smile,
  GraduationCap,
  Landmark,
  Scale,
  Users,
  Utensils,
  Car,
  House,
  Wrench,
  Shirt,
  PawPrint,
  Pill,
  Package,
  CheckCircle,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import usePullToRefresh from '../hooks/usePullToRefresh';
import CategoryCard from '../components/dashboard/CategoryCard';
import NotasList from '../components/dashboard/NotasList';
import { Skeleton } from '@/components/ui/skeleton';
import { appLogo } from '@/brandAssets';

const categorias = {
  saude: { nome: 'Médico/Saúde', cor: 'bg-red-500', icon: Heart, iconColor: 'text-red-600 dark:text-red-300' },
  dentista: { nome: 'Dentista/Saúde', cor: 'bg-cyan-500', icon: Smile, iconColor: 'text-cyan-600 dark:text-cyan-300' },
  educacao: { nome: 'Educação', cor: 'bg-blue-500', icon: GraduationCap, iconColor: 'text-blue-600 dark:text-blue-300' },
  previdencia_privada: { nome: 'Previdência Privada', cor: 'bg-emerald-600', icon: Landmark, iconColor: 'text-emerald-600 dark:text-emerald-300' },
  pensao_alimenticia: { nome: 'Pensão Alimentícia', cor: 'bg-orange-500', icon: Scale, iconColor: 'text-orange-600 dark:text-orange-300' },
  dependentes: { nome: 'Dependentes', cor: 'bg-teal-500', icon: Users, iconColor: 'text-teal-600 dark:text-teal-300' },
  alimentacao: { nome: 'Alimentação', cor: 'bg-green-500', icon: Utensils, iconColor: 'text-green-600 dark:text-green-300' },
  transporte: { nome: 'Transporte', cor: 'bg-yellow-500', icon: Car, iconColor: 'text-yellow-600 dark:text-yellow-300' },
  moradia: { nome: 'Moradia', cor: 'bg-purple-500', icon: House, iconColor: 'text-purple-600 dark:text-purple-300' },
  servicos: { nome: 'Serviços', cor: 'bg-indigo-500', icon: Wrench, iconColor: 'text-indigo-600 dark:text-indigo-300' },
  vestuario: { nome: 'Vestuário', cor: 'bg-pink-500', icon: Shirt, iconColor: 'text-pink-600 dark:text-pink-300' },
  pets: { nome: 'Pets', cor: 'bg-amber-500', icon: PawPrint, iconColor: 'text-amber-600 dark:text-amber-300' },
  farmacia: { nome: 'Farmácia', cor: 'bg-lime-500', icon: Pill, iconColor: 'text-lime-600 dark:text-lime-300' },
  outros: { nome: 'Outros', cor: 'bg-gray-500', icon: Package, iconColor: 'text-slate-600 dark:text-slate-300' },
};

export default function Dashboard() {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then((me) => setUserEmail(me.email)).catch(() => {});
  }, []);

  const { data: notas = [], isLoading, refetch } = useQuery({
    queryKey: ['notas', userEmail],
    queryFn: () => base44.entities.NotaFiscal.filter({ created_by: userEmail }, '-data_emissao'),
    enabled: !!userEmail,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  const handleRefresh = useCallback(() => refetch(), [refetch]);
  const { indicatorStyle, isTriggered, isActive } = usePullToRefresh(handleRefresh);

  const handleCategoriaClick = useCallback((key) => {
    setCategoriaSelecionada((prev) => (prev === key ? null : key));
  }, []);

  const notasFiltradas = notas.filter((nota) => {
    const anoNota = new Date(nota.data_emissao).getFullYear();
    const matchAno = anoNota === anoFiltro;
    const matchCategoria = !categoriaSelecionada || nota.categoria === categoriaSelecionada;
    return matchAno && matchCategoria;
  });

  const totalPorCategoria = {};
  Object.keys(categorias).forEach((cat) => {
    totalPorCategoria[cat] = notasFiltradas.
    filter((n) => n.categoria === cat).
    reduce((sum, n) => sum + (n.valor_total || 0), 0);
  });

  const totalGeral = Object.values(totalPorCategoria).reduce((sum, val) => sum + val, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Pull-to-refresh indicator: fixed overlay, zero layout shift */}
      {isActive && (
        <div
          style={indicatorStyle}
          className="fixed top-20 md:top-24 left-0 right-0 z-50 flex justify-center pointer-events-none"
          aria-hidden="true"
        >
          <div className="bg-background shadow-md rounded-full p-2 border border-border">
            <RefreshCw className={`w-5 h-5 text-blue-500 ${isTriggered ? 'animate-spin' : ''}`} />
          </div>
        </div>
      )}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <img
            src={appLogo}
            alt="Restitua logo"
            className="h-12 md:h-14 w-auto object-contain rounded-md bg-black px-2 py-1.5"
          />

          <div className="flex items-center gap-2">
            <Link to={createPageUrl('Relatorios')}>
              <Button
                variant="outline"
                size="icon"
                aria-label="Abrir relatórios"
                className="border-border text-foreground hover:bg-accent"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('Upload')}>
              <Button
                variant="outline"
                size="icon"
                aria-label="Adicionar nova nota"
                className="border-border text-foreground hover:bg-accent"
              >
                <Upload className="w-4 h-4" />
              </Button>
            </Link>
            <Select value={String(anoFiltro)} onValueChange={(v) => setAnoFiltro(Number(v))}>
              <SelectTrigger className="w-[92px] min-h-[40px] text-sm font-medium" aria-label="Selecionar ano">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2026, 2025, 2024, 2023, 2022].map((ano) => (
                  <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground/80 hover:text-red-500"
              onClick={() => base44.auth.logout('/LandingPage')}
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-24 md:pt-28 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-base md:text-lg font-medium text-muted-foreground">
            Organize suas despesas para solicitar a restituição do Imposto de Renda
          </h1>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                Total em {anoFiltro}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    R$ {totalGeral.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notasFiltradas.length} notas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                Total estimado dedutível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Receipt className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    R$ {(totalPorCategoria.saude + (totalPorCategoria.dentista || 0) + totalPorCategoria.educacao + (totalPorCategoria.previdencia_privada || 0) + (totalPorCategoria.pensao_alimenticia || 0) + (totalPorCategoria.dependentes || 0)).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saúde, Educação, Prev. Privada, Pensão, Dependentes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                Total Não Dedutível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <XCircle className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    R$ {(totalGeral - (totalPorCategoria.saude + (totalPorCategoria.dentista || 0) + totalPorCategoria.educacao + (totalPorCategoria.previdencia_privada || 0) + (totalPorCategoria.pensao_alimenticia || 0) + (totalPorCategoria.dependentes || 0))).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Despesas não restituíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Categorias */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Por Categoria
          </h2>

          {/* Dedutíveis */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full inline-flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Restituível
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['saude', 'dentista', 'educacao', 'previdencia_privada', 'pensao_alimenticia', 'dependentes'].map((key) => {
                const cat = categorias[key];
                return (
                  <CategoryCard
                    key={key}
                    categoria={key}
                    nome={cat.nome}
                    icon={cat.icon}
                    iconColor={cat.iconColor}
                    cor={cat.cor}
                    total={totalPorCategoria[key]}
                    quantidade={notasFiltradas.filter((n) => n.categoria === key).length}
                    ativo={categoriaSelecionada === key}
                    onClick={() => handleCategoriaClick(key)} />);


              })}
            </div>
          </div>

          {/* Não Dedutíveis */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> Não Restituível</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['alimentacao', 'transporte', 'moradia', 'servicos', 'vestuario', 'pets', 'farmacia', 'outros'].map((key) => {
                const cat = categorias[key];
                return (
                  <CategoryCard
                    key={key}
                    categoria={key}
                    nome={cat.nome}
                    icon={cat.icon}
                    iconColor={cat.iconColor}
                    cor={cat.cor}
                    total={totalPorCategoria[key]}
                    quantidade={notasFiltradas.filter((n) => n.categoria === key).length}
                    ativo={categoriaSelecionada === key}
                    onClick={() => handleCategoriaClick(key)} />);


              })}
            </div>
          </div>
        </div>

        {/* Lista de Notas */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {categoriaSelecionada ?
              `Notas - ${categorias[categoriaSelecionada].nome}` :
              'Todas as Notas'}
            </h2>
            {categoriaSelecionada &&
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoriaSelecionada(null)}>
              
                Limpar filtro
              </Button>
            }
          </div>
          
          {isLoading ?
          <div className="space-y-3">
              {[1, 2, 3].map((i) =>
            <Skeleton key={i} className="h-24 w-full" />
            )}
            </div> :

          <NotasList notas={notasFiltradas} categorias={categorias} />
          }
        </div>
      </div>
    </div>);

}
