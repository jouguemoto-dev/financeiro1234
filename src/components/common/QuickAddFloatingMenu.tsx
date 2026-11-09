import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Plus,
  ArrowRightLeft,
  Repeat,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Sparkles,
} from 'lucide-react';

interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ElementType;
  iconColorClass: string;
  bgColorClass: string;
  borderColorClass: string;
  onClick: () => void;
}

export const QuickAddFloatingMenu: React.FC = () => {
  const { openTxModal, openDepositModal, openGoalModal, goals } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Actions definition with clear focus on Transfer, Recurring Expense, Installment, etc.
  const actions: QuickActionItem[] = [
    {
      id: 'transfer',
      title: 'Transferir entre Contas',
      subtitle: 'Mover saldo entre contas ou poupança',
      badge: 'Pix / Ted',
      icon: ArrowRightLeft,
      iconColorClass: 'text-blue-600 dark:text-blue-400',
      bgColorClass: 'bg-blue-50 dark:bg-blue-950/60',
      borderColorClass: 'border-blue-200 dark:border-blue-800/60',
      onClick: () => {
        openTxModal('transfer');
        setIsOpen(false);
      },
    },
    {
      id: 'recurring',
      title: 'Despesa Recorrente / Fixa',
      subtitle: 'Aluguel, contas mensais e assinaturas',
      badge: 'Mensal / Fixo',
      icon: Repeat,
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      bgColorClass: 'bg-purple-50 dark:bg-purple-950/60',
      borderColorClass: 'border-purple-200 dark:border-purple-800/60',
      onClick: () => {
        openTxModal('expense', undefined, { isRecurring: true });
        setIsOpen(false);
      },
    },
    {
      id: 'installment',
      title: 'Compra Parcelada (Cartão)',
      subtitle: 'Dividir valor em parcelas futuras',
      badge: 'Parcelado',
      icon: CreditCard,
      iconColorClass: 'text-amber-600 dark:text-amber-400',
      bgColorClass: 'bg-amber-50 dark:bg-amber-950/60',
      borderColorClass: 'border-amber-200 dark:border-amber-800/60',
      onClick: () => {
        openTxModal('expense', undefined, { isInstallment: true });
        setIsOpen(false);
      },
    },
    {
      id: 'expense',
      title: 'Nova Despesa Avulsa',
      subtitle: 'Supermercado, farmácia, transporte...',
      icon: ArrowDownLeft,
      iconColorClass: 'text-rose-600 dark:text-rose-400',
      bgColorClass: 'bg-rose-50 dark:bg-rose-950/60',
      borderColorClass: 'border-rose-200 dark:border-rose-800/60',
      onClick: () => {
        openTxModal('expense');
        setIsOpen(false);
      },
    },
    {
      id: 'income',
      title: 'Nova Receita',
      subtitle: 'Salário, freelance ou dividendos',
      icon: ArrowUpRight,
      iconColorClass: 'text-emerald-600 dark:text-emerald-400',
      bgColorClass: 'bg-emerald-50 dark:bg-emerald-950/60',
      borderColorClass: 'border-emerald-200 dark:border-emerald-800/60',
      onClick: () => {
        openTxModal('income');
        setIsOpen(false);
      },
    },
    {
      id: 'deposit',
      title: 'Aporte para Poupança / Meta',
      subtitle: 'Guardar dinheiro em reserva financeira',
      badge: 'Poupança',
      icon: PiggyBank,
      iconColorClass: 'text-sky-600 dark:text-sky-400',
      bgColorClass: 'bg-sky-50 dark:bg-sky-950/60',
      borderColorClass: 'border-sky-200 dark:border-sky-800/60',
      onClick: () => {
        if (goals.length > 0) {
          openDepositModal(goals[0]);
        } else {
          openGoalModal();
        }
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      {/* Backdrop overlay when menu is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-neutral-950/35 dark:bg-black/60 backdrop-blur-[2px] z-40 transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Floating Speed Dial Container */}
      <div
        ref={menuRef}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end"
      >
        {/* Speed Dial Menu Items */}
        {isOpen && (
          <div
            role="menu"
            aria-label="Ações Rápidas"
            className="flex flex-col items-end gap-2.5 mb-3.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            {/* Header chip */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900/90 text-white dark:bg-neutral-800/90 rounded-full text-[11px] font-medium shadow-md backdrop-blur-xs mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Ações Rápidas do Dashboard</span>
            </div>

            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  role="menuitem"
                  style={{
                    animationDelay: `${index * 30}ms`,
                  }}
                  className="group flex items-center gap-3 text-left focus:outline-none animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                  {/* Text card pill */}
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 px-3.5 py-2 rounded-xl shadow-lg group-hover:border-neutral-300 dark:group-hover:border-neutral-700 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800/90 group-hover:-translate-x-1 transition-all duration-150">
                    <div className="flex items-center justify-end gap-2">
                      {action.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {action.badge}
                        </span>
                      )}
                      <span className="font-semibold text-xs text-neutral-900 dark:text-white">
                        {action.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-right mt-0.5">
                      {action.subtitle}
                    </p>
                  </div>

                  {/* Icon circle */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${action.bgColorClass} ${action.borderColorClass} ${action.iconColorClass} shadow-md group-hover:scale-110 group-hover:shadow-lg transition-transform duration-150`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Floating Action Trigger Button (FAB) */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={isOpen ? 'Fechar menu de ações rápidas' : 'Abrir menu de ações rápidas'}
          title={isOpen ? 'Fechar menu (Esc)' : 'Ações Rápidas (Lançamento)'}
          className={`relative group flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 focus:outline-none ${
            isOpen
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-4 ring-rose-500/20'
              : 'bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 shadow-neutral-950/25 ring-4 ring-neutral-900/10 dark:ring-white/20'
          } hover:scale-105 active:scale-95`}
        >
          <Plus
            className={`w-6 h-6 stroke-[2.5] transition-transform duration-300 ${
              isOpen ? 'rotate-45' : 'rotate-0'
            }`}
          />

          {/* Tooltip on hover when closed */}
          {!isOpen && (
            <span className="absolute right-16 px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-medium whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
              Ações Rápidas
            </span>
          )}
        </button>
      </div>
    </>
  );
};
