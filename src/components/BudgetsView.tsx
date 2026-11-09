import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { MonthSelector } from './common/MonthSelector';
import { formatCurrency } from '../utils/formatters';
import { Category } from '../types/finance';
import { Plus, Check, Edit2, ShieldAlert } from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const {
    categories,
    monthTransactions,
    preferences,
    updateCategory,
  } = useFinance();

  // State for inline budget editing
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editBudgetValue, setEditBudgetValue] = useState<string>('');

  // Calculate actual spending per category in the selected month
  const categoryStats = useMemo(() => {
    const expenseTxs = monthTransactions.filter((tx) => tx.type === 'expense');

    const spentMap = new Map<string, number>();
    expenseTxs.forEach((tx) => {
      spentMap.set(tx.category, (spentMap.get(tx.category) || 0) + tx.amount);
    });

    let totalBudget = 0;
    let totalSpent = 0;

    const items = categories
      .filter((c) => c.type === 'expense')
      .map((cat) => {
        const spent = spentMap.get(cat.name) || 0;
        const budget = cat.budgetMonthly || 0;
        const remaining = budget - spent;
        const percent = budget > 0 ? (spent / budget) * 100 : 0;

        totalBudget += budget;
        totalSpent += spent;

        return {
          category: cat,
          spent,
          budget,
          remaining,
          percent,
          isOverBudget: budget > 0 && spent > budget,
          isNearBudget: budget > 0 && spent <= budget && percent >= 80,
        };
      })
      .sort((a, b) => b.spent - a.spent);

    return {
      items,
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      overallPercent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    };
  }, [categories, monthTransactions]);

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditBudgetValue(cat.budgetMonthly ? cat.budgetMonthly.toString() : '');
  };

  const handleSaveBudget = (cat: Category) => {
    const num = parseFloat(editBudgetValue.replace(',', '.'));
    updateCategory({
      ...cat,
      budgetMonthly: isNaN(num) || num < 0 ? 0 : num,
    });
    setEditingCatId(null);
  };

  // Group by Kakebo pillar
  const kakeboGroups = [
    {
      id: 'essential',
      title: 'Despesas Essenciais (Sobrevivência)',
      desc: 'Moradia, alimentação básica, saúde e transporte fundamental',
    },
    {
      id: 'optional',
      title: 'Lazer & Opcionais',
      desc: 'Restaurantes, compras pessoais, passeios e assinaturas',
    },
    {
      id: 'culture',
      title: 'Cultura & Aprendizado',
      desc: 'Livros, cursos, workshops e desenvolvimento pessoal',
    },
    {
      id: 'extra',
      title: 'Extras & Imprevistos',
      desc: 'Manutenções pontuais, emergências e outros imprevistos',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
            Orçamentos por Categoria
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Defina limites mensais para manter a disciplina financeira e evitar surpresas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector />
        </div>
      </div>

      {/* Global Budget Overview Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Teto Global de Gastos Orçados
            </span>
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white font-mono mt-0.5">
              {formatCurrency(categoryStats.totalSpent, preferences.currency, preferences.hideValues)}{' '}
              <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                de {formatCurrency(categoryStats.totalBudget, preferences.currency, preferences.hideValues)}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Disponível no Teto</span>
            <div
              className={`text-2xl font-semibold font-mono mt-0.5 ${
                categoryStats.totalRemaining >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(categoryStats.totalRemaining, preferences.currency, preferences.hideValues)}
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                categoryStats.overallPercent > 100
                  ? 'bg-rose-500'
                  : categoryStats.overallPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-neutral-900 dark:bg-neutral-100'
              }`}
              style={{
                width: `${Math.min(100, categoryStats.overallPercent)}%`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            <span>{categoryStats.overallPercent.toFixed(1)}% do orçamento consumido</span>
            <span>
              {categoryStats.totalRemaining >= 0 ? 'Dentro da meta mensal' : 'Orçamento estourado'}
            </span>
          </div>
        </div>
      </div>

      {/* Categories by Kakebo Groups */}
      <div className="space-y-6">
        {kakeboGroups.map((group) => {
          const groupItems = categoryStats.items.filter(
            (item) => (item.category.isKakeboGroup || 'extra') === group.id
          );

          if (groupItems.length === 0) return null;

          const groupSpent = groupItems.reduce((acc, curr) => acc + curr.spent, 0);
          const groupBudget = groupItems.reduce((acc, curr) => acc + curr.budget, 0);

          return (
            <div
              key={group.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xs overflow-hidden"
            >
              {/* Group Header */}
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-50/50 dark:bg-neutral-900/40">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {group.title}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{group.desc}</p>
                </div>
                <div className="text-xs font-mono text-neutral-600 dark:text-neutral-300">
                  Total:{' '}
                  <strong className="text-neutral-900 dark:text-white">
                    {formatCurrency(groupSpent, preferences.currency, preferences.hideValues)}
                  </strong>{' '}
                  / {formatCurrency(groupBudget, preferences.currency, preferences.hideValues)}
                </div>
              </div>

              {/* Group Items */}
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 p-4 space-y-4">
                {groupItems.map((item) => {
                  const { category, spent, budget, remaining, percent, isOverBudget, isNearBudget } =
                    item;
                  const isEditing = editingCatId === category.id;

                  return (
                    <div key={category.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        {/* Left: Category name and color dot */}
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {category.name}
                          </span>
                          {isOverBudget && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Excedido em {formatCurrency(Math.abs(remaining), preferences.currency, preferences.hideValues)}</span>
                            </span>
                          )}
                          {isNearBudget && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              Alerta de 80% atingido
                            </span>
                          )}
                        </div>

                        {/* Right: Numbers & Inline Edit */}
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-neutral-900 dark:text-white font-medium">
                            {formatCurrency(spent, preferences.currency, preferences.hideValues)}
                          </span>
                          <span className="text-neutral-400">/</span>

                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="10"
                                value={editBudgetValue}
                                onChange={(e) => setEditBudgetValue(e.target.value)}
                                className="w-24 px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs text-neutral-900 dark:text-white focus:outline-none"
                                placeholder="R$ 0,00"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveBudget(category)}
                                className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                title="Salvar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-neutral-600 dark:text-neutral-300">
                                {budget > 0
                                  ? formatCurrency(budget, preferences.currency, preferences.hideValues)
                                  : 'Sem teto'}
                              </span>
                              <button
                                onClick={() => handleStartEdit(category)}
                                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 transition-colors"
                                title="Alterar teto de gastos"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {budget > 0 && (
                            <span
                              className={`text-[11px] w-12 text-right ${
                                isOverBudget
                                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                  : 'text-neutral-500 dark:text-neutral-400'
                              }`}
                            >
                              {percent.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {budget > 0 ? (
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOverBudget
                                ? 'bg-rose-500'
                                : isNearBudget
                                ? 'bg-amber-500'
                                : 'bg-neutral-800 dark:bg-neutral-200'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      ) : (
                        <div className="text-[11px] text-neutral-400">
                          Nenhum limite estipulado.{' '}
                          <button
                            onClick={() => handleStartEdit(category)}
                            className="underline hover:text-neutral-900 dark:hover:text-white"
                          >
                            Definir teto
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
