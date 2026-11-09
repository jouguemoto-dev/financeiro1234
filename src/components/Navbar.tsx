import React from 'react';
import { useFinance, ActiveTab } from '../context/FinanceContext';
import { Plus, Eye, EyeOff, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, openTxModal, preferences, updatePreferences } = useFinance();

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: 'Visão Geral' },
    { id: 'transactions', label: 'Lançamentos' },
    { id: 'budgets', label: 'Orçamentos' },
    { id: 'accounts', label: 'Contas & Cartões' },
    { id: 'goals', label: 'Metas' },
    { id: 'reports', label: 'Relatórios' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-lg font-bold tracking-tight text-neutral-950 dark:text-neutral-50 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity text-left"
          >
            Kakebo
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`whitespace-nowrap shrink-0 py-1 transition-colors relative ${
                    isActive
                      ? 'text-neutral-950 dark:text-white font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action + subtle utilities */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => updatePreferences({ hideValues: !preferences.hideValues })}
              title={preferences.hideValues ? 'Mostrar valores' : 'Ocultar valores'}
              aria-label={preferences.hideValues ? 'Mostrar valores' : 'Ocultar valores'}
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg transition-colors"
            >
              {preferences.hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              title="Configurações e Dados"
              aria-label="Configurações e Dados"
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => openTxModal('expense')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Nav Scroller */}
      <div className="md:hidden flex items-center gap-2 px-4 py-2 overflow-x-auto border-t border-neutral-100 dark:border-neutral-900 scrollbar-none text-xs">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-medium'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
