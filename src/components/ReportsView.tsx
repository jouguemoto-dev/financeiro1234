import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { MonthSelector } from './common/MonthSelector';
import { formatCurrency, formatMonthYear, getMonthOffset } from '../utils/formatters';
import { TrendingUp, PieChart as PieChartIcon, ShieldCheck, Zap, Download } from 'lucide-react';
import { exportMonthlyReportToCSV } from '../utils/exportImport';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const {
    transactions,
    categories,
    accounts,
    selectedMonth,
    preferences,
    monthIncome,
    monthExpense,
    monthNet,
    monthSavingsRate,
  } = useFinance();

  // Last 6 months historical trend
  const historyTrend = useMemo(() => {
    const months: { monthKey: string; label: string; income: number; expense: number; net: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const mKey = getMonthOffset(selectedMonth, -i);
      const mLabel = formatMonthYear(mKey).split(' de ')[0];

      let inc = 0;
      let exp = 0;

      transactions.forEach((tx) => {
        if (tx.status === 'completed' && tx.date.startsWith(mKey)) {
          if (tx.type === 'income') inc += tx.amount;
          if (tx.type === 'expense') exp += tx.amount;
        }
      });

      months.push({
        monthKey: mKey,
        label: mLabel,
        income: inc,
        expense: exp,
        net: inc - exp,
      });
    }

    const maxVal = Math.max(...months.map((m) => Math.max(m.income, m.expense)), 1000);
    const totalPeriodNet = months.reduce((acc, m) => acc + m.net, 0);

    return { months, maxVal, totalPeriodNet };
  }, [transactions, selectedMonth]);

  // 50-30-20 & Kakebo Rule Distribution for the selected month
  const rule503020 = useMemo(() => {
    let essential = 0;
    let optional = 0;
    let culture = 0;
    let extra = 0;

    const monthExpTxs = transactions.filter(
      (tx) => tx.type === 'expense' && tx.status === 'completed' && tx.date.startsWith(selectedMonth)
    );

    monthExpTxs.forEach((tx) => {
      const cat = categories.find((c) => c.name === tx.category);
      const group = cat?.isKakeboGroup || 'extra';
      if (group === 'essential') essential += tx.amount;
      else if (group === 'optional') optional += tx.amount;
      else if (group === 'culture') culture += tx.amount;
      else extra += tx.amount;
    });

    const totalExpense = essential + optional + culture + extra;
    const baseIncome = Math.max(monthIncome, totalExpense);

    const essentialPct = baseIncome > 0 ? (essential / baseIncome) * 100 : 0;
    const lifestylePct = baseIncome > 0 ? ((optional + culture) / baseIncome) * 100 : 0;
    const savingsPct = monthSavingsRate;

    return {
      essential,
      optional,
      culture,
      extra,
      totalExpense,
      essentialPct,
      lifestylePct,
      savingsPct,
    };
  }, [transactions, categories, selectedMonth, monthIncome, monthSavingsRate]);

  // Top 5 largest single expenses of the selected month
  const topExpenses = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense' && tx.date.startsWith(selectedMonth))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, selectedMonth]);

  // Daily average spending
  const daysPassed = Math.min(new Date().getDate(), 30);
  const dailyAverage = monthExpense > 0 ? monthExpense / daysPassed : 0;
  const projectedMonthExpense = dailyAverage * 30;

  // Active hover slice for Recharts Pie Chart
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Category expenses for Recharts Pie Chart in selected month
  const categoryPieData = useMemo(() => {
    const monthExpTxs = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date.startsWith(selectedMonth)
    );
    const total = monthExpTxs.reduce((sum, tx) => sum + tx.amount, 0);

    const map = new Map<string, number>();
    monthExpTxs.forEach((tx) => {
      map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
    });

    const FALLBACK_COLORS = [
      '#0284C7',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#EC4899',
      '#8B5CF6',
      '#6366F1',
      '#14B8A6',
      '#64748B',
      '#0EA5E9',
    ];

    const items = Array.from(map.entries())
      .map(([name, value], index) => {
        const cat = categories.find((c) => c.name === name);
        return {
          name,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          color: cat?.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);

    return { items, total };
  }, [transactions, selectedMonth, categories]);

  const handleExportMonthlyCSV = () => {
    const monthTxs = transactions
      .filter((tx) => tx.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const accountMap = new Map<string, string>();
    accounts.forEach((acc) => accountMap.set(acc.id, acc.name));

    exportMonthlyReportToCSV({
      monthKey: selectedMonth,
      monthLabel: formatMonthYear(selectedMonth),
      currency: preferences.currency,
      totalIncome: monthIncome,
      totalExpense: monthExpense,
      netSavings: monthNet,
      savingsRate: monthSavingsRate,
      dailyAverage,
      projectedMonthExpense,
      categories: categoryPieData.items.map((c) => ({
        name: c.name,
        amount: c.value,
        percentage: c.percentage,
      })),
      transactions: monthTxs,
      accountMap,
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
            Relatórios & Análise
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Diagnóstico profundo dos seus hábitos financeiros, tendências e proporções
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <MonthSelector />
          <button
            onClick={handleExportMonthlyCSV}
            title="Exportar dados financeiros do mês para arquivo CSV"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>Exportar CSV Mensal</span>
          </button>
        </div>
      </div>

      {/* 6-Month Historical Evolution */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Evolução Semestral (Últimos 6 Meses)
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Comparativo direto entre receitas e despesas realizadas
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
              <span>Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-neutral-900 dark:bg-neutral-300" />
              <span>Despesas</span>
            </div>
          </div>
        </div>

        {/* Minimalist Bar Chart */}
        <div className="h-52 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-neutral-100 dark:border-neutral-800">
          {historyTrend.months.map((m, idx) => {
            const incH = Math.min(100, Math.round((m.income / historyTrend.maxVal) * 100));
            const expH = Math.min(100, Math.round((m.expense / historyTrend.maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full group">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  <div
                    style={{ height: `${Math.max(incH, 4)}%` }}
                    className="w-full max-w-[20px] bg-emerald-500/80 rounded-t-xs hover:bg-emerald-500 transition-all"
                    title={`Receitas: ${formatCurrency(m.income, preferences.currency)}`}
                  />
                  <div
                    style={{ height: `${Math.max(expH, 4)}%` }}
                    className="w-full max-w-[20px] bg-neutral-800 dark:bg-neutral-300 rounded-t-xs hover:bg-neutral-950 dark:hover:bg-white transition-all"
                    title={`Despesas: ${formatCurrency(m.expense, preferences.currency)}`}
                  />
                </div>
                <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-2 truncate w-full text-center">
                  {m.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Semiannual Balance Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 gap-2 font-mono">
          <span>Resultado acumulado nos últimos 6 meses:</span>
          <span
            className={`text-sm font-semibold ${
              historyTrend.totalPeriodNet >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {historyTrend.totalPeriodNet >= 0 ? '+' : ''}
            {formatCurrency(historyTrend.totalPeriodNet, preferences.currency, preferences.hideValues)}
          </span>
        </div>
      </div>

      {/* Recharts Pie Chart Section: Distribuição de Despesas por Categoria */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Distribuição de Despesas por Categoria ({formatMonthYear(selectedMonth).split(' de ')[0]})
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Proporção de gastos de cada categoria visualizada em gráfico de pizza Recharts
            </p>
          </div>
          <div className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
            Total Despesas:{' '}
            <strong className="text-neutral-900 dark:text-white font-semibold">
              {formatCurrency(categoryPieData.total, preferences.currency, preferences.hideValues)}
            </strong>
          </div>
        </div>

        {categoryPieData.items.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Nenhuma despesa registrada para o mês selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Recharts Pie Chart */}
            <div className="lg:col-span-5 h-[280px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-neutral-950/95 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-neutral-800 backdrop-blur-md">
                            <div className="font-semibold">{data.name}</div>
                            <div className="font-mono text-neutral-300 mt-0.5">
                              {formatCurrency(data.value, preferences.currency, preferences.hideValues)} ({data.percentage.toFixed(1)}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={categoryPieData.items}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {categoryPieData.items.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="transparent"
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          filter: activeIndex === index ? 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' : 'none',
                          transform: activeIndex === index ? 'scale(1.03)' : 'scale(1)',
                          transformOrigin: 'center center',
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center label inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[11px] text-neutral-400 font-medium">
                  {activeIndex !== null && categoryPieData.items[activeIndex]
                    ? categoryPieData.items[activeIndex].name
                    : 'Total Despesas'}
                </span>
                <span className="text-sm font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
                  {activeIndex !== null && categoryPieData.items[activeIndex]
                    ? `${categoryPieData.items[activeIndex].percentage.toFixed(1)}%`
                    : formatCurrency(categoryPieData.total, preferences.currency, preferences.hideValues)}
                </span>
              </div>
            </div>

            {/* Right: Detailed Legend & Breakdown */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {categoryPieData.items.map((cat, idx) => {
                const isHovered = activeIndex === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-neutral-100/90 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-600 shadow-2xs'
                        : 'bg-neutral-50/60 dark:bg-neutral-800/40 border-neutral-200/70 dark:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium text-neutral-900 dark:text-white truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300 shrink-0">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="font-mono text-neutral-500 dark:text-neutral-400 text-[11px] mt-1 pl-4.5">
                      {formatCurrency(cat.value, preferences.currency, preferences.hideValues)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Section: 50-30-20 Framework & Daily Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metodologia 50 / 30 / 20 */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Distribuição 50 / 30 / 20
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Equilíbrio recomendado entre necessidades, estilo de vida e poupança
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* 50% Necessidades */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Necessidades & Essenciais (Alvo: até 50%)
                </span>
                <span className="font-mono text-neutral-900 dark:text-white font-medium">
                  {rule503020.essentialPct.toFixed(1)}% (
                  {formatCurrency(rule503020.essential, preferences.currency, preferences.hideValues)})
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rule503020.essentialPct > 55 ? 'bg-amber-500' : 'bg-neutral-900 dark:bg-neutral-100'
                  }`}
                  style={{ width: `${Math.min(100, rule503020.essentialPct)}%` }}
                />
              </div>
            </div>

            {/* 30% Estilo de Vida */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Estilo de Vida & Lazer (Alvo: até 30%)
                </span>
                <span className="font-mono text-neutral-900 dark:text-white font-medium">
                  {rule503020.lifestylePct.toFixed(1)}% (
                  {formatCurrency(
                    rule503020.optional + rule503020.culture,
                    preferences.currency,
                    preferences.hideValues
                  )}
                  )
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rule503020.lifestylePct > 35 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, rule503020.lifestylePct)}%` }}
                />
              </div>
            </div>

            {/* 20% Poupança */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Poupança & Investimentos (Alvo: no mín. 20%)
                </span>
                <span className="font-mono text-neutral-900 dark:text-white font-medium">
                  {rule503020.savingsPct.toFixed(1)}% (
                  {formatCurrency(Math.max(0, monthNet), preferences.currency, preferences.hideValues)})
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rule503020.savingsPct >= 20 ? 'bg-emerald-500' : 'bg-neutral-400'
                  }`}
                  style={{ width: `${Math.min(100, rule503020.savingsPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Spending & Forecast */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Ritmo de Gastos & Projeção
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Consumo diário médio e estimativa para o fechamento
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Gasto Médio por Dia
              </span>
              <div className="text-xl font-semibold font-mono text-neutral-900 dark:text-white mt-1">
                {formatCurrency(dailyAverage, preferences.currency, preferences.hideValues)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Baseado em {daysPassed} dias
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Projeção Fim de Mês
              </span>
              <div className="text-xl font-semibold font-mono text-neutral-900 dark:text-white mt-1">
                {formatCurrency(projectedMonthExpense, preferences.currency, preferences.hideValues)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Se mantido o ritmo atual
              </div>
            </div>
          </div>

          {/* Top 5 Expenses of Month */}
          <div className="pt-2">
            <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              Maiores Lançamentos Individuais
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
              {topExpenses.map((tx) => (
                <div key={tx.id} className="py-2 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <div className="font-medium text-neutral-900 dark:text-white truncate">
                      {tx.description}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">{tx.category}</div>
                  </div>
                  <div className="font-mono font-medium text-neutral-900 dark:text-white shrink-0">
                    {formatCurrency(tx.amount, preferences.currency, preferences.hideValues)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
