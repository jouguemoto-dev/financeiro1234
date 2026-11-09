import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Account } from '../types/finance';
import {
  Wallet,
  CreditCard,
  Building2,
  TrendingUp,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Calendar,
} from 'lucide-react';

const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  Building2,
  TrendingUp,
  ShieldCheck,
  Wallet,
  CreditCard,
};

export const AccountsView: React.FC = () => {
  const {
    accounts,
    preferences,
    getAccountBalance,
    getCreditCardUsage,
    openAccountModal,
    openTxModal,
    deleteAccount,
  } = useFinance();

  const bankingAccounts = accounts.filter((a) => a.type !== 'credit');
  const creditCards = accounts.filter((a) => a.type === 'credit');

  const totalLiquid = bankingAccounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  const totalInvoices = creditCards.reduce((sum, a) => sum + getCreditCardUsage(a.id).currentInvoice, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
            Contas & Cartões
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Gerencie contas correntes, investimentos, carteira física e faturas de cartões
          </p>
        </div>

        <button
          onClick={() => openAccountModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nova Conta ou Cartão</span>
        </button>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Total em Contas & Liquidez</div>
          <div className="text-2xl font-semibold text-neutral-900 dark:text-white font-mono mt-1">
            {formatCurrency(totalLiquid, preferences.currency, preferences.hideValues)}
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            Disponível em {bankingAccounts.length} contas ativas
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Total em Faturas Abertas</div>
          <div className="text-2xl font-semibold text-rose-600 dark:text-rose-400 font-mono mt-1">
            {formatCurrency(totalInvoices, preferences.currency, preferences.hideValues)}
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            Comprometido em {creditCards.length} cartões de crédito
          </div>
        </div>
      </div>

      {/* Banking & Investment Accounts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Contas Bancárias & Investimentos
          </h2>
          <span className="text-xs text-neutral-400">{bankingAccounts.length} contas cadastradas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankingAccounts.map((acc) => {
            const Icon = ACCOUNT_ICONS[acc.iconName] || Wallet;
            const balance = getAccountBalance(acc.id);

            return (
              <div
                key={acc.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${acc.color}15`,
                          color: acc.color,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                          {acc.name}
                        </h3>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {acc.type === 'investment'
                            ? 'Investimentos'
                            : acc.type === 'savings'
                            ? 'Reserva / Poupança'
                            : acc.type === 'cash'
                            ? 'Dinheiro Físico'
                            : 'Conta Corrente'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAccountModal(acc)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md"
                        title="Editar conta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a conta "${acc.name}"?`)) {
                            deleteAccount(acc.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md"
                        title="Excluir conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Saldo Atual</div>
                    <div className="text-xl font-semibold font-mono text-neutral-900 dark:text-white mt-0.5">
                      {formatCurrency(balance, preferences.currency, preferences.hideValues)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 text-[11px]">
                    Inicial: {formatCurrency(acc.initialBalance, preferences.currency, preferences.hideValues)}
                  </span>
                  <button
                    onClick={() => openTxModal('transfer')}
                    className="text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white font-medium flex items-center gap-1 text-[11px]"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Transferir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit Cards Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Cartões de Crédito
          </h2>
          <span className="text-xs text-neutral-400">{creditCards.length} cartões cadastrados</span>
        </div>

        {creditCards.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500">
            Nenhum cartão de crédito cadastrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creditCards.map((card) => {
              const { currentInvoice, availableLimit } = getCreditCardUsage(card.id);
              const limit = card.creditLimit || 0;
              const usedPercent = limit > 0 ? (currentInvoice / limit) * 100 : 0;

              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${card.color}20`,
                          color: card.color,
                        }}
                      >
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                          {card.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                          {card.closingDay && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-400" />
                              Fecha dia {card.closingDay}
                            </span>
                          )}
                          {card.dueDay && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Vence dia {card.dueDay}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAccountModal(card)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md"
                        title="Editar cartão"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir o cartão "${card.name}"?`)) {
                            deleteAccount(card.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md"
                        title="Excluir cartão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Limits and Current Invoice */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Fatura Atual
                      </span>
                      <div className="text-xl font-semibold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                        {formatCurrency(currentInvoice, preferences.currency, preferences.hideValues)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Limite Disponível
                      </span>
                      <div className="text-xl font-semibold font-mono text-neutral-900 dark:text-white mt-0.5">
                        {formatCurrency(availableLimit, preferences.currency, preferences.hideValues)}
                      </div>
                    </div>
                  </div>

                  {/* Utilization Progress */}
                  <div className="space-y-1">
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usedPercent > 80 ? 'bg-amber-500' : 'bg-neutral-900 dark:bg-neutral-100'
                        }`}
                        style={{ width: `${Math.min(100, usedPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                      <span>{usedPercent.toFixed(0)}% do limite utilizado</span>
                      <span>Total: {formatCurrency(limit, preferences.currency, preferences.hideValues)}</span>
                    </div>
                  </div>

                  {/* Quick Card Action */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex justify-end">
                    <button
                      onClick={() => openTxModal('expense')}
                      className="text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Lançar compra no cartão</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
