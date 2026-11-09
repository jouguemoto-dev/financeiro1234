import React, { useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetsView } from './components/BudgetsView';
import { AccountsView } from './components/AccountsView';
import { GoalsView } from './components/GoalsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/modals/TransactionModal';
import { AccountModal } from './components/modals/AccountModal';
import { GoalModal } from './components/modals/GoalModal';
import { DepositGoalModal } from './components/modals/DepositGoalModal';

const MainContent: React.FC = () => {
  const { activeTab, openTxModal } = useFinance();

  // Keyboard shortcut: Press 'n' to open new transaction modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'n' || e.key === 'N') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        openTxModal('expense');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openTxModal]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'budgets' && <BudgetsView />}
        {activeTab === 'accounts' && <AccountsView />}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Quiet Minimalist Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Kakebo Minimal · Controle Financeiro Pessoal</span>
          <div className="flex items-center gap-2">
            <span>Privacidade Local</span>
            <span aria-hidden="true">·</span>
            <span>Atalho rápido: pressione <kbd className="px-1.5 py-0.5 text-[10px] bg-neutral-200 dark:bg-neutral-800 rounded font-mono">N</kbd> para novo lançamento</span>
          </div>
        </div>
      </footer>

      {/* All Application Modals */}
      <TransactionModal />
      <AccountModal />
      <GoalModal />
      <DepositGoalModal />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainContent />
    </FinanceProvider>
  );
}
