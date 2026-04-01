import { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Upload, FileText, Settings, ArrowLeft } from 'lucide-react';
import useSystemTheme from '@/hooks/useSystemTheme';

// Detector de tela branca: se o conteúdo principal ficar vazio por mais de 3s, recarrega
function useWhiteScreenGuard(pathname) {
  useEffect(() => {
    const isHome = pathname === '/' || pathname === '/Dashboard';
    if (!isHome) return;
    const timer = setTimeout(() => {
      const main = document.querySelector('main');
      if (main && main.children.length === 0) {
        window.location.reload();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [pathname]);
}

const navItems = [
  { label: 'Início', icon: LayoutDashboard, path: '/' },
  { label: 'Nova Nota', icon: Upload, path: '/Upload' },
  { label: 'Relatórios', icon: FileText, path: '/Relatorios' },
  { label: 'Conta', icon: Settings, path: '/Configuracoes' },
];

export default function AppLayout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  useSystemTheme();
  useWhiteScreenGuard(location.pathname);

  const isPublic = location.pathname === '/LandingPage' || location.pathname === '/CompletarCadastro';

  // Focus management: move focus to main content after route transitions (VoiceOver / screen readers)
  const mainRef = useRef(null);
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  const mainTabPaths = ['/', '/Dashboard', '/Upload', '/Relatorios', '/Configuracoes'];
  const isMainTab = mainTabPaths.some((p) =>
    p === '/' ? location.pathname === '/' || location.pathname === '/Dashboard' : location.pathname === p
  );
  const showBack = !isPublic && !isMainTab;

  const handleBack = () => {
    // Se há histórico de navegação interno, voltar; senão ir para o início
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ paddingBottom: isPublic ? '0' : 'calc(env(safe-area-inset-bottom) + 4rem)' }}>
      {showBack && (
        <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
          <button
            onClick={handleBack}
            aria-label="Voltar"
            className="flex items-center gap-2 text-sm text-blue-600 font-medium select-none min-h-[44px] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      )}
      <div className="flex-1">
        <main
          ref={mainRef}
          tabIndex={-1}
          aria-label={currentPageName || 'Conteúdo principal'}
          className="outline-none"
        >
          {children}
        </main>
      </div>

      {!isPublic && (
        <nav
          role="tablist"
          aria-label="Navegação principal"
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = path === '/'
              ? location.pathname === '/' || location.pathname === '/Dashboard'
              : location.pathname.startsWith(path);

            const handleNavClick = () => {
              if (path === '/') {
                // Força reload completo ao ir para início — evita tela branca no Android
                window.location.href = '/';
              } else {
                navigate(path);
              }
            };

            return (
              <button
                key={path}
                role="tab"
                aria-selected={active}
                aria-current={active ? 'page' : undefined}
                onClick={handleNavClick}
                aria-label={`${label}${active ? ', selecionado' : ''}`}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors select-none min-h-[44px] py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                  active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
                <span className={active ? 'font-semibold' : ''} aria-hidden="true">{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}