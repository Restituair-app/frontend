/**
 * pages.config.js - Page routing configuration
 *
 * All page imports use React.lazy() for code-splitting so each page is only
 * loaded when the user actually navigates to it, keeping the initial bundle small.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 */
import { lazy } from 'react';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard'; // import direto — evita tela branca ao voltar ao início

const Relatorios    = lazy(() => import('./pages/Relatorios'));
const Upload        = lazy(() => import('./pages/Upload'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));

export const PAGES = {
    "Dashboard":     Dashboard,
    "Relatorios":    Relatorios,
    "Upload":        Upload,
    "Configuracoes": Configuracoes,
};

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: AppLayout,
};