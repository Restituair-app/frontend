import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { lazy, useEffect, useState, useRef } from 'react';
const CompletarCadastro = lazy(() => import('./pages/CompletarCadastro'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/Login'));
import { base44 } from '@/api/base44Client';

const { Pages, Layout, mainPage } = pagesConfig;

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [checkingCadastro, setCheckingCadastro] = useState(false);
  const [cadastroCompleto, setCadastroCompleto] = useState(true);
  const cadastroChecked = useRef(false);
  const currentPath = window.location.pathname;
  const isPublicPage = currentPath === '/LandingPage' || currentPath === '/Login';

  useEffect(() => {
    if (isLoadingAuth || authError || isPublicPage || cadastroChecked.current) return;
    cadastroChecked.current = true;
    setCheckingCadastro(true);
    base44.auth.me()
      .then((me) => setCadastroCompleto(!!me.cadastro_completo))
      .catch(() => setCadastroCompleto(true))
      .finally(() => setCheckingCadastro(false));
  }, [isLoadingAuth, authError, isPublicPage]);

  // Páginas públicas sempre acessíveis sem esperar auth.
  if (isPublicPage) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/LandingPage" element={<LandingPage />} />
          <Route path="/Login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/LandingPage" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Aguardar verificações de auth
  if (isLoadingPublicSettings || isLoadingAuth || checkingCadastro) {
    return <PageFallback />;
  }

  // Erros de autenticação
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required' || authError.type === 'unknown') {
      navigateToLogin();
      return null;
    }
  }

  // Redirecionar para completar cadastro se necessário
  if (!cadastroCompleto) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/CompletarCadastro" element={<CompletarCadastro />} />
          <Route path="*" element={<Navigate to="/CompletarCadastro" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // App autenticado
  return (
    <Routes>
      <Route path="/LandingPage" element={
        <Suspense fallback={<PageFallback />}><LandingPage /></Suspense>
      } />
      <Route path="/CompletarCadastro" element={
        <Suspense fallback={<PageFallback />}><CompletarCadastro /></Suspense>
      } />
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Suspense fallback={<PageFallback />}>
                <Page />
              </Suspense>
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
