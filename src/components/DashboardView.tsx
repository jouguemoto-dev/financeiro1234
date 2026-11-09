import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { MonthSelector } from './common/MonthSelector';
import { QuickAddFloatingMenu } from './common/QuickAddFloatingMenu';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Wallet,
  CreditCard,
  Building2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Target,
  Plus,
  ChevronRight,
  PiggyBank,
  Edit2,
  Check,
  X,
  Link2,
} from 'lucide-react';

const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  Building2,
  TrendingUp,
  ShieldCheck,
  Wallet,
  CreditCard,
};

export const DashboardView: React.FC = () => {
  const {
    totalNetWorth,
    monthIncome,
    monthExpense,
    monthNet,
    monthPendingIncome,
    monthPendingExpense,
    monthSavingsRate,
    monthTransactions,
    accounts,
    categories,
    goals,
    preferences,
    getAccountBalance,
    getCreditCardUsage,
    savingsAccounts,
    totalSavingsBalance,
    getGoalCurrentAmount,
    updateGoalTarget,
    openGoalModal,
    openTxModal,
    openDepositModal,
    setActiveTab,
    toggleTransactionStatus,
  } = useFinance();

  // Inline target editing state
  const [editingTargetGoalId, setEditingTargetGoalId] = useState<string | null>(null);
  const [tempTargetInput, setTempTargetInput] = useState<string>('');

  const startEditingTarget = (goalId: string, currentTarget: number) => {
    setEditingTargetGoalId(goalId);
    setTempTargetInput(currentTarget.toString());
  };

  const handleSaveTarget = (goalId: string) => {
    const parsed = parseFloat(tempTargetInput.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      updateGoalTarget(goalId, parsed);
    }
    setEditingTargetGoalId(null);
  };

  const handleCancelEditing = () => {
    setEditingTargetGoalId(null);
    setTempTargetInput('');
  };

  // Savings summary metrics
  const totalTarget = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.targetAmount, 0);
  }, [goals]);

  const totalAllocatedSavings = useMemo(() => {
    return goals.reduce((sum, g) => sum + getGoalCurrentAmount(g), 0);
  }, [goals, getGoalCurrentAmount]);

  const overallSavingsPercent = totalTarget > 0 ? (totalAllocatedSavings / totalTarget) * 100 : 0;

  // Category breakdown for current month expenses
  const categoryBreakdown = useMemo(() => {
    const expenseTxs = monthTransactions.filter((tx) => tx.type === 'expense');
    const totalExp = expenseTxs.reduce((sum, tx) => sum + tx.amount, 0);

    const map = new Map<string, number>();
    expenseTxs.forEach((tx) => {
      map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
    });

    const list = Array.from(map.entries())
      .map(([name, amount]) => {
        const catObj = categories.find((c) => c.name === name);
        return {
          name,
          amount,
          percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
          color: catObj?.color || '#94A3B8',
          budget: catObj?.budgetMonthly,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { list, totalExp };
  }, [monthTransactions, categories]);

  // Daily cash flow for minimalist chart
  const dailyData = useMemo(() => {
    const daysInMonth = 31;
    const dailyExpenses = new Array(daysInMonth).fill(0);
    const dailyIncomes = new Array(daysInMonth).fill(0);

    monthTransactions.forEach((tx) => {
      const day = parseInt(tx.date.slice(8, 10), 10);
      if (day >= 1 && day <= daysInMonth) {
        if (tx.type === 'expense') dailyExpenses[day - 1] += tx.amount;
        if (tx.type === 'income') dailyIncomes[day - 1] += tx.amount;
      }
    });

    const maxDayVal = Math.max(...dailyExpenses, ...dailyIncomes, 100);
    return { dailyExpenses, dailyIncomes, maxDayVal };
  }, [monthTransactions]);

  const recentTransactions = monthTransactions.slice(0, 6);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
            Painel Geral
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Visão consolidada de receitas, despesas, liquidez e patrimônio
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector />
        </div>
      </div>

      {/* Primary KPI Strip - 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patrimônio Líquido */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Patrimônio Líquido</span>
            <Wallet className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-semibold text-neutral-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(totalNetWorth, preferences.currency, preferences.hideValues)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 flex items-center gap-1.5">
            <span>{accounts.length} contas conectadas</span>
          </div>
        </div>

        {/* Receitas do Mês */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Receitas Recebidas</span>
            <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            +{formatCurrency(monthIncome, preferences.currency, preferences.hideValues)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {monthPendingIncome > 0 ? (
              <span>
                Pendente:{' '}
                <strong className="font-mono font-medium text-neutral-700 dark:text-neutral-300">
                  {formatCurrency(monthPendingIncome, preferences.currency, preferences.hideValues)}
                </strong>
              </span>
            ) : (
              <span>Todas receitas efetivadas</span>
            )}
          </div>
        </div>

        {/* Despesas do Mês */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Despesas Pagas</span>
            <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-neutral-900 dark:text-white font-mono tracking-tight">
            -{formatCurrency(monthExpense, preferences.currency, preferences.hideValues)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {monthPendingExpense > 0 ? (
              <span>
                A pagar:{' '}
                <strong className="font-mono font-medium text-rose-600 dark:text-rose-400">
                  {formatCurrency(monthPendingExpense, preferences.currency, preferences.hideValues)}
                </strong>
              </span>
            ) : (
              <span>Sem contas pendentes</span>
            )}
          </div>
        </div>

        {/* Balanço Líquido & Taxa de Poupança */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Saldo do Mês</span>
            <span className="font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              {monthSavingsRate}% poupado
            </span>
          </div>
          <div
            className={`text-2xl font-semibold font-mono tracking-tight ${
              monthNet >= 0
                ? 'text-neutral-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {monthNet >= 0 ? '+' : ''}
            {formatCurrency(monthNet, preferences.currency, preferences.hideValues)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            <span>
              {monthNet >= 0 ? 'Superávit financeiro mensal' : 'Déficit no período'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Transaction Action Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-neutral-500 dark:text-neutral-400 shrink-0 font-medium mr-1">
          Lançamento rápido:
        </span>
        <button
          onClick={() => openTxModal('expense')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors whitespace-nowrap shadow-2xs"
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
          <span>Registrar Despesa</span>
        </button>
        <button
          onClick={() => openTxModal('income')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors whitespace-nowrap shadow-2xs"
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          <span>Registrar Receita</span>
        </button>
        <button
          onClick={() => openTxModal('transfer')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors whitespace-nowrap shadow-2xs"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
          <span>Transferir / Aporte</span>
        </button>
      </div>

      {/* Seção de Metas de Economia & Poupança Vinculadas ao Saldo de Contas */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800/50">
              <PiggyBank className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-950 dark:text-neutral-50">
                  Metas de Economia & Poupança
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  Saldo Real Sincronizado
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Defina valores alvo e acompanhe o progresso com a barra visual vinculada ao saldo real das suas contas de poupança e reservas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => openGoalModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nova Meta de Economia</span>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Global Savings KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50/80 dark:bg-neutral-800/40 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800/60 text-xs">
          <div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Saldo Total em Poupança</span>
            <div className="font-mono font-semibold text-neutral-900 dark:text-white text-sm sm:text-base mt-0.5">
              {formatCurrency(totalSavingsBalance, preferences.currency, preferences.hideValues)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Total Alvo Definido</span>
            <div className="font-mono font-semibold text-neutral-900 dark:text-white text-sm sm:text-base mt-0.5">
              {formatCurrency(totalTarget, preferences.currency, preferences.hideValues)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Progresso Geral</span>
            <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base mt-0.5">
              {overallSavingsPercent.toFixed(1)}%
            </div>
          </div>
          <div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Restante para Conclusão</span>
            <div className="font-mono font-semibold text-neutral-700 dark:text-neutral-300 text-sm sm:text-base mt-0.5">
              {formatCurrency(Math.max(0, totalTarget - totalAllocatedSavings), preferences.currency, preferences.hideValues)}
            </div>
          </div>
        </div>

        {/* Goals Cards Grid */}
        {goals.length === 0 ? (
          <div className="text-center py-8 px-4 bg-neutral-50/50 dark:bg-neutral-800/30 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Nenhuma meta de economia definida ainda
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Defina um valor alvo e acompanhe o crescimento da sua reserva com a barra de progresso vinculada ao saldo real da sua poupança.
            </p>
            <button
              onClick={() => openGoalModal()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 rounded-lg hover:opacity-90 transition-opacity"
            >
              + Criar Minha Primeira Meta de Economia
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {goals.map((goal) => {
              const currentSavingsAmount = getGoalCurrentAmount(goal);
              const percent = Math.min(100, Math.round((currentSavingsAmount / goal.targetAmount) * 100));
              const isCompleted = currentSavingsAmount >= goal.targetAmount;
              const remaining = Math.max(0, goal.targetAmount - currentSavingsAmount);
              const isEditingTarget = editingTargetGoalId === goal.id;
              const linkedAccount = goal.linkedAccountId === 'all_savings'
                ? { name: 'Todas as Contas de Poupança' }
                : accounts.find((a) => a.id === goal.linkedAccountId);

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4.5 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Row: Category and Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {goal.category && (
                            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                              {goal.category}
                            </span>
                          )}
                          {isCompleted ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                              Meta Concluída!
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              {percent}% atingido
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mt-1 truncate">
                          {goal.name}
                        </h3>
                      </div>

                      <button
                        onClick={() => openGoalModal(goal)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors shrink-0"
                        title="Editar detalhes da meta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Linked Savings Account Selector */}
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/60">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-sky-500" />
                          <span>Conta de Poupança Vinculada:</span>
                        </span>
                        <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                          {linkedAccount ? 'Saldo Real' : 'Manual'}
                        </span>
                      </div>
                      <select
                        value={goal.linkedAccountId || ''}
                        onChange={(e) =>
                          updateGoalTarget(goal.id, goal.targetAmount, e.target.value || undefined)
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none truncate"
                      >
                        <option value="">Nenhuma (Saldo Manual)</option>
                        <option value="all_savings">
                          ✨ Todas as Contas de Poupança ({formatCurrency(totalSavingsBalance, preferences.currency, false)})
                        </option>
                        {accounts
                          .filter((a) => a.type === 'savings' || a.type === 'investment')
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.type === 'savings' ? '🏦 [Poupança] ' : '📈 [Investimento] '}
                              {a.name} ({formatCurrency(getAccountBalance(a.id), preferences.currency, false)})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Target Amount Definition with Inline Edit */}
                    <div className="mt-3 p-2.5 bg-neutral-50/90 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                      {isEditingTarget ? (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                            Definir Novo Valor Alvo ({preferences.currency}):
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              autoFocus
                              value={tempTargetInput}
                              onChange={(e) => setTempTargetInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTarget(goal.id);
                                if (e.key === 'Escape') handleCancelEditing();
                              }}
                              placeholder="0,00"
                              className="w-full px-2 py-1 text-xs font-mono font-semibold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-900 dark:text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveTarget(goal.id)}
                              className="px-2.5 py-1 text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 rounded-md hover:opacity-90"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={handleCancelEditing}
                              className="p-1 px-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">
                              Valor Alvo Definido:
                            </span>
                            <div className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
                              {formatCurrency(goal.targetAmount, preferences.currency, preferences.hideValues)}
                            </div>
                          </div>
                          <button
                            onClick={() => startEditingTarget(goal.id, goal.targetAmount)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white px-2 py-1 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors"
                            title="Clique para definir ou alterar o valor alvo diretamente"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Definir Alvo</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Visual Progress Bar linked to Savings Account Balance */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-700 dark:text-neutral-200 font-semibold">
                          Saldo Poupança: {formatCurrency(currentSavingsAmount, preferences.currency, preferences.hideValues)}
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                          {percent}% de {formatCurrency(goal.targetAmount, preferences.currency, preferences.hideValues)}
                        </span>
                      </div>

                      {/* The Bar */}
                      <div className="relative w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: goal.color || '#0284C7',
                          }}
                        />
                      </div>

                      {/* Milestones and Status */}
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-0.5">
                        <span>0%</span>
                        <span className="hidden sm:inline">25%</span>
                        <span>50%</span>
                        <span className="hidden sm:inline">75%</span>
                        <span>100%</span>
                      </div>

                      <div className="text-[11px] font-medium pt-0.5">
                        {isCompleted ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Meta 100% atingida com o saldo da sua poupança!</span>
                          </span>
                        ) : (
                          <span className="text-neutral-500 dark:text-neutral-400">
                            Faltam <strong className="font-mono text-neutral-800 dark:text-neutral-200">{formatCurrency(remaining, preferences.currency, preferences.hideValues)}</strong> para concluir a meta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Quick Actions */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => startEditingTarget(goal.id, goal.targetAmount)}
                      className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                      Ajustar Alvo
                    </button>
                    <button
                      onClick={() => openDepositModal(goal)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Fazer Aporte</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cash Flow Chart + Recent Transactions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily Cashflow Chart */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Fluxo Diário no Mês
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Volume de gastos diários ao longo dos dias do mês
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                  <span>Despesas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  <span>Receitas</span>
                </div>
              </div>
            </div>

            {/* Minimalist SVG Bar/Timeline Chart */}
            <div className="h-44 w-full flex items-end gap-1 pt-6 pb-2 px-1 border-b border-neutral-100 dark:border-neutral-800">
              {dailyData.dailyExpenses.map((exp, idx) => {
                const inc = dailyData.dailyIncomes[idx];
                const dayNum = idx + 1;
                const expHeight = Math.min(100, Math.round((exp / dailyData.maxDayVal) * 100));
                const incHeight = Math.min(100, Math.round((inc / dailyData.maxDayVal) * 100));

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col justify-end items-center h-full group relative"
                  >
                    {/* Tooltip */}
                    {(exp > 0 || inc > 0) && (
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-neutral-900 text-white text-[11px] px-2 py-1 rounded-md shadow-lg whitespace-nowrap font-mono">
                          Dia {dayNum}: {exp > 0 && `-${formatCurrency(exp, preferences.currency)}`}
                          {inc > 0 && ` | +${formatCurrency(inc, preferences.currency)}`}
                        </div>
                      </div>
                    )}

                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      {incHeight > 0 && (
                        <div
                          style={{ height: `${Math.max(incHeight, 8)}%` }}
                          className="w-full max-w-[6px] bg-emerald-500/80 rounded-t-xs hover:bg-emerald-500 transition-colors"
                        />
                      )}
                      {expHeight > 0 && (
                        <div
                          style={{ height: `${Math.max(expHeight, 8)}%` }}
                          className="w-full max-w-[6px] bg-rose-500/80 rounded-t-xs hover:bg-rose-500 transition-colors"
                        />
                      )}
                      {incHeight === 0 && expHeight === 0 && (
                        <div className="w-full max-w-[2px] h-[3px] bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] text-neutral-400 dark:text-neutral-500 pt-2 px-1">
              <span>Dia 1</span>
              <span>Dia 10</span>
              <span>Dia 20</span>
              <span>Dia 31</span>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Últimos Lançamentos
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Movimentações recentes no mês selecionado
                </p>
              </div>
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Ver todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Nenhum lançamento registrado neste mês.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {recentTransactions.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3.5 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <button
                          onClick={() => toggleTransactionStatus(tx.id)}
                          title={tx.status === 'completed' ? 'Marcar como pendente' : 'Marcar como efetivado'}
                          className="shrink-0 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                        >
                          {tx.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900 dark:text-white truncate">
                            {tx.description}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5 truncate">
                            <span>{tx.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{acc?.name || 'Conta'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatDate(tx.date)}</span>
                            {tx.installmentTotal && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">
                                  {tx.installmentCurrent}/{tx.installmentTotal}
                                </span>
                              </>
                            )}
                            {tx.isRecurring && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>Recorrente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono font-medium ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-neutral-900 dark:text-white'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatCurrency(tx.amount, preferences.currency, preferences.hideValues)}
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          {tx.status === 'completed' ? 'Efetivado' : 'Pendente'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Category Distribution & Accounts & Goals (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category Spending Breakdown */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Gastos por Categoria
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Total:{' '}
                  <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                    {formatCurrency(categoryBreakdown.totalExp, preferences.currency, preferences.hideValues)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setActiveTab('budgets')}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Orçamentos
              </button>
            </div>

            {/* Proportional Segment Bar */}
            {categoryBreakdown.list.length > 0 ? (
              <>
                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex mb-4">
                  {categoryBreakdown.list.slice(0, 5).map((cat, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                      title={`${cat.name}: ${cat.percentage.toFixed(1)}%`}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  {categoryBreakdown.list.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-neutral-900 dark:text-white font-medium">
                            {formatCurrency(cat.amount, preferences.currency, preferences.hideValues)}
                          </span>
                          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 w-10 text-right">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Budget indicator if set */}
                      {cat.budget && (
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cat.amount > cat.budget
                                ? 'bg-rose-500'
                                : cat.amount / cat.budget > 0.8
                                ? 'bg-amber-500'
                                : 'bg-neutral-400 dark:bg-neutral-600'
                            }`}
                            style={{
                              width: `${Math.min(100, (cat.amount / cat.budget) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Nenhum gasto lançado para análise neste mês.
              </div>
            )}
          </div>

          {/* Accounts & Cards Balance Widget */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Contas & Cartões
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Saldos atuais e limites disponíveis
                </p>
              </div>
              <button
                onClick={() => setActiveTab('accounts')}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Gerenciar
              </button>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {accounts.map((acc) => {
                const Icon = ACCOUNT_ICONS[acc.iconName] || Wallet;
                const isCredit = acc.type === 'credit';
                const creditInfo = isCredit ? getCreditCardUsage(acc.id) : null;
                const balance = !isCredit ? getAccountBalance(acc.id) : 0;

                return (
                  <div
                    key={acc.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${acc.color}15`,
                          color: acc.color,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-900 dark:text-white truncate">
                          {acc.name}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                          {isCredit
                            ? `Limite: ${formatCurrency(acc.creditLimit || 0, preferences.currency, preferences.hideValues)}`
                            : acc.type === 'investment'
                            ? 'Investimentos'
                            : acc.type === 'savings'
                            ? 'Poupança / Reserva'
                            : 'Conta Corrente'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isCredit ? (
                        <>
                          <div className="font-mono font-medium text-rose-600 dark:text-rose-400">
                            {formatCurrency(creditInfo?.currentInvoice || 0, preferences.currency, preferences.hideValues)}
                          </div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                            Fatura atual
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-mono font-medium text-neutral-900 dark:text-white">
                            {formatCurrency(balance, preferences.currency, preferences.hideValues)}
                          </div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                            Saldo disponível
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Goals Widget */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Metas & Reservas
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Acompanhamento de objetivos financeiros
                </p>
              </div>
              <button
                onClick={() => setActiveTab('goals')}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Ver metas
              </button>
            </div>

            <div className="space-y-3.5">
              {goals.slice(0, 3).map((goal) => {
                const currentAmount = getGoalCurrentAmount(goal);
                const percent = Math.min(100, Math.round((currentAmount / goal.targetAmount) * 100));
                const linkedAccount = goal.linkedAccountId === 'all_savings'
                  ? 'Poupanças'
                  : accounts.find((a) => a.id === goal.linkedAccountId)?.name;

                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {goal.name}
                        </span>
                        {linkedAccount && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shrink-0">
                            🏦 {linkedAccount}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => openDepositModal(goal)}
                        className="text-[11px] text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white font-medium flex items-center gap-0.5 shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Aportar</span>
                      </button>
                    </div>

                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                      <span>{formatCurrency(currentAmount, preferences.currency, preferences.hideValues)}</span>
                      <span>
                        {percent}% de {formatCurrency(goal.targetAmount, preferences.currency, preferences.hideValues)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Menu for Quick Common Actions */}
      <QuickAddFloatingMenu />
    </div>
  );
};
