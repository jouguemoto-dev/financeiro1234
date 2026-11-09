import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Goal } from '../types/finance';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const {
    goals,
    accounts,
    preferences,
    monthSavingsRate,
    monthNet,
    getGoalCurrentAmount,
    openGoalModal,
    openDepositModal,
    deleteGoal,
  } = useFinance();

  const totalCurrent = goals.reduce((sum, g) => sum + getGoalCurrentAmount(g), 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPercent = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
            Metas & Reservas Financeiras
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Acompanhe o crescimento dos seus objetivos, reservas e investimentos de longo prazo
          </p>
        </div>

        <button
          onClick={() => openGoalModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Global Progress Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Total Acumulado em Metas</span>
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white font-mono mt-0.5">
              {formatCurrency(totalCurrent, preferences.currency, preferences.hideValues)}{' '}
              <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                de {formatCurrency(totalTarget, preferences.currency, preferences.hideValues)}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Restante para Conclusão</span>
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white font-mono mt-0.5">
              {formatCurrency(Math.max(0, totalTarget - totalCurrent), preferences.currency, preferences.hideValues)}
            </div>
          </div>
        </div>

        {/* Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            <span>{overallPercent.toFixed(1)}% do total das metas atingido</span>
            <span>
              {monthNet > 0 && (
                <>
                  Ritmo atual:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(monthNet, preferences.currency, preferences.hideValues)}/mês
                  </strong>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <Target className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Nenhuma meta cadastrada
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Crie sua primeira meta financeira para organizar sua reserva de emergência ou planejar uma conquista.
          </p>
          <button
            onClick={() => openGoalModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 rounded-lg hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar primeira meta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const currentAmount = getGoalCurrentAmount(goal);
            const percent = Math.min(100, Math.round((currentAmount / goal.targetAmount) * 100));
            const isCompleted = currentAmount >= goal.targetAmount;
            const remaining = Math.max(0, goal.targetAmount - currentAmount);
            const linkedAccount = goal.linkedAccountId === 'all_savings'
              ? { name: 'Todas as Contas de Poupança' }
              : accounts.find((a) => a.id === goal.linkedAccountId);

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {goal.category && (
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {goal.category}
                          </span>
                        )}
                        {linkedAccount && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50">
                            🏦 {linkedAccount.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white text-base mt-0.5">
                        {goal.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openGoalModal(goal)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md"
                        title="Editar meta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir a meta "${goal.name}"?`)) {
                            deleteGoal(goal.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md"
                        title="Excluir meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notes / Strategy */}
                  {goal.notes && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2">
                      {goal.notes}
                    </p>
                  )}

                  {/* Deadline */}
                  {goal.deadline && (
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-3 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Prazo estimado: {formatDate(goal.deadline)}</span>
                    </div>
                  )}

                  {/* Amount and Progress */}
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <div className="text-xl font-semibold font-mono text-neutral-900 dark:text-white">
                        {formatCurrency(currentAmount, preferences.currency, preferences.hideValues)}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono">
                        alvo: {formatCurrency(goal.targetAmount, preferences.currency, preferences.hideValues)}
                      </div>
                    </div>

                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color || '#10B981',
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                      <span>{percent}% concluído</span>
                      <span>
                        {isCompleted
                          ? 'Meta alcançada!'
                          : `Falta ${formatCurrency(remaining, preferences.currency, preferences.hideValues)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action: Aportar */}
                <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>Concluída com sucesso</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-neutral-400">
                      Progresso em andamento
                    </span>
                  )}

                  <button
                    onClick={() => openDepositModal(goal)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Fazer Aporte</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
