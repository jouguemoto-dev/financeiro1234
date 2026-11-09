import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { MonthSelector } from './common/MonthSelector';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/formatters';
import { exportTransactionsToCSV } from '../utils/exportImport';
import { Transaction } from '../types/finance';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit2,
  Copy,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Repeat,
  CreditCard,
  CheckCheck,
  Calendar,
  AlertCircle,
  Zap,
  X,
} from 'lucide-react';

type SubViewMode = 'all' | 'installments' | 'recurring';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    selectedMonth,
    accounts,
    categories,
    preferences,
    openTxModal,
    deleteTransaction,
    toggleTransactionStatus,
    duplicateTransaction,
    anticipateInstallments,
    deleteInstallmentSeries,
    generateRecurringForMonth,
    deleteRecurringSeries,
  } = useFinance();

  const [subView, setSubView] = useState<SubViewMode>('all');

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonthScope, setFilterMonthScope] = useState<'month' | 'all'>('month');

  // Status message for recurring generation
  const [recurringNotice, setRecurringNotice] = useState<string | null>(null);

  // Group installments into purchase series
  const installmentSeries = useMemo(() => {
    const seriesMap = new Map<string, Transaction[]>();

    transactions.forEach((tx) => {
      if (tx.installmentTotal && tx.installmentTotal > 1) {
        // Group key: installmentGroupId or description
        const key = tx.installmentGroupId || tx.description;
        const list = seriesMap.get(key) || [];
        list.push(tx);
        seriesMap.set(key, list);
      }
    });

    return Array.from(seriesMap.entries()).map(([groupId, items]) => {
      // Sort items by installmentCurrent
      const sorted = [...items].sort(
        (a, b) => (a.installmentCurrent || 0) - (b.installmentCurrent || 0)
      );
      const first = sorted[0];
      const totalInstallments = first.installmentTotal || sorted.length;
      const installmentAmount = first.amount;
      const totalAmount = first.installmentTotalAmount || installmentAmount * totalInstallments;

      const completedCount = sorted.filter((i) => i.status === 'completed').length;
      const pendingCount = sorted.filter((i) => i.status === 'pending').length;
      const paidAmount = completedCount * installmentAmount;
      const remainingAmount = Math.max(0, totalAmount - paidAmount);
      const isFinished = completedCount >= totalInstallments;

      const acc = accounts.find((a) => a.id === first.accountId);

      return {
        groupId,
        description: first.description,
        category: first.category,
        accountName: acc?.name || 'Cartão',
        totalInstallments,
        installmentAmount,
        totalAmount,
        completedCount,
        pendingCount,
        paidAmount,
        remainingAmount,
        isFinished,
        items: sorted,
      };
    });
  }, [transactions, accounts]);

  // Group recurring items by recurringGroupId or description
  const recurringSeries = useMemo(() => {
    const seriesMap = new Map<string, Transaction[]>();

    transactions.forEach((tx) => {
      if (tx.isRecurring) {
        const key = tx.recurringGroupId || tx.description;
        const list = seriesMap.get(key) || [];
        list.push(tx);
        seriesMap.set(key, list);
      }
    });

    return Array.from(seriesMap.entries()).map(([key, items]) => {
      // Sort by date desc
      const sorted = [...items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const representative = sorted[0];
      const acc = accounts.find((a) => a.id === representative.accountId);

      // Check status in selected month
      const currentMonthTx = items.find((i) => i.date.startsWith(selectedMonth));

      return {
        groupId: key,
        description: representative.description,
        type: representative.type,
        amount: representative.amount,
        category: representative.category,
        accountName: acc?.name || 'Conta',
        recurrence: representative.recurrence || 'monthly',
        dayOfMonth: representative.date.slice(8, 10),
        currentMonthTx,
        historyCount: items.length,
      };
    });
  }, [transactions, accounts, selectedMonth]);

  // Filtered series for search
  const visibleInstallmentSeries = useMemo(() => {
    if (!search.trim()) return installmentSeries;
    const q = search.toLowerCase().trim();
    return installmentSeries.filter(
      (s) => s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [installmentSeries, search]);

  const visibleRecurringSeries = useMemo(() => {
    if (!search.trim()) return recurringSeries;
    const q = search.toLowerCase().trim();
    return recurringSeries.filter(
      (s) => s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [recurringSeries, search]);

  // Aggregate totals for Installments & Recurring
  const totalInstallmentFutureDebt = installmentSeries.reduce(
    (sum, s) => sum + s.remainingAmount,
    0
  );
  const totalRecurringMonthlyExpenses = recurringSeries
    .filter((s) => s.type === 'expense')
    .reduce((sum, s) => sum + s.amount, 0);
  const totalRecurringMonthlyIncomes = recurringSeries
    .filter((s) => s.type === 'income')
    .reduce((sum, s) => sum + s.amount, 0);

  // Filtered transactions for "All" tab
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Scope
        if (filterMonthScope === 'month' && !tx.date.startsWith(selectedMonth)) {
          return false;
        }

        // Search
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchDesc = tx.description.toLowerCase().includes(query);
          const matchCat = tx.category.toLowerCase().includes(query);
          const matchNote = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
          if (!matchDesc && !matchCat && !matchNote) return false;
        }

        // Quick Types
        if (filterType === 'expense' && tx.type !== 'expense') return false;
        if (filterType === 'income' && tx.type !== 'income') return false;
        if (filterType === 'transfer' && tx.type !== 'transfer') return false;
        if (filterType === 'installment' && (!tx.installmentTotal || tx.installmentTotal <= 1))
          return false;
        if (filterType === 'recurring' && !tx.isRecurring) return false;

        // Category
        if (filterCategory !== 'all' && tx.category !== filterCategory) return false;

        // Account
        if (filterAccount !== 'all') {
          if (tx.accountId !== filterAccount && tx.destinationAccountId !== filterAccount) {
            return false;
          }
        }

        // Status
        if (filterStatus !== 'all' && tx.status !== filterStatus) return false;

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    selectedMonth,
    filterMonthScope,
    search,
    filterType,
    filterCategory,
    filterAccount,
    filterStatus,
  ]);

  const filteredSummary = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') expense += tx.amount;
    });

    return {
      count: filteredTransactions.length,
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions, preferences.currency);
  };

  const handleGenerateRecurring = () => {
    const count = generateRecurringForMonth(selectedMonth);
    if (count > 0) {
      setRecurringNotice(`${count} lançamento(s) recorrente(s) gerado(s) para ${formatMonthYear(selectedMonth)}.`);
    } else {
      setRecurringNotice(`Todas as recorrências ativas já estão lançadas em ${formatMonthYear(selectedMonth)}.`);
    }
    setTimeout(() => setRecurringNotice(null), 4000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
            Lançamentos & Gestão
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Extrato detalhado, controle de compras parceladas e automação de contas recorrentes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthSelector />
          <button
            onClick={() => openTxModal('expense')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Dedicated Real-Time Search Field */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-2xs space-y-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lançamentos por descrição ou categoria em tempo real (ex: Aluguel, Alimentação, Salário)..."
            className="w-full pl-10 pr-28 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white transition-all"
          />

          {search.trim() && (
            <div className="absolute right-2.5 flex items-center gap-2">
              <span className="text-[11px] font-mono font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-200/70 dark:bg-neutral-700/60 px-2 py-0.5 rounded">
                {subView === 'all'
                  ? `${filteredTransactions.length} encontrado${filteredTransactions.length !== 1 ? 's' : ''}`
                  : subView === 'installments'
                  ? `${visibleInstallmentSeries.length} encontrada${visibleInstallmentSeries.length !== 1 ? 's' : ''}`
                  : `${visibleRecurringSeries.length} encontrada${visibleRecurringSeries.length !== 1 ? 's' : ''}`}
              </span>
              <button
                type="button"
                onClick={() => setSearch('')}
                title="Limpar campo de busca"
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {search.trim() && (
          <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-1 pt-0.5">
            <span>
              Filtrando lançamentos por descrição ou categoria com termo:{' '}
              <strong className="text-neutral-900 dark:text-white font-medium">"{search}"</strong>
            </span>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        )}
      </div>

      {/* Sub-View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3 text-xs font-medium">
        <button
          onClick={() => setSubView('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            subView === 'all'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60'
          }`}
        >
          <span>Extrato Geral</span>
          <span className="font-mono text-[11px] opacity-80">({filteredSummary.count})</span>
        </button>

        <button
          onClick={() => setSubView('installments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            subView === 'installments'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Compras Parceladas</span>
          <span className="font-mono text-[11px] opacity-80">
            ({visibleInstallmentSeries.filter((s) => !s.isFinished).length} ativas)
          </span>
        </button>

        <button
          onClick={() => setSubView('recurring')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors ${
            subView === 'recurring'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Recorrências & Fixos</span>
          <span className="font-mono text-[11px] opacity-80">({visibleRecurringSeries.length})</span>
        </button>
      </div>

      {/* VIEW 1: EXTRATO GERAL */}
      {subView === 'all' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Segmented Quick Filter */}
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium shrink-0 overflow-x-auto">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'installment', label: 'Parcelados' },
                  { id: 'recurring', label: 'Recorrentes' },
                  { id: 'expense', label: 'Despesas' },
                  { id: 'income', label: 'Receitas' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilterType(t.id)}
                    className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                      filterType === t.id
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExportCSV}
                title="Exportar registros filtrados para CSV"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>

            {/* Secondary Filters Dropdown Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <div className="flex items-center gap-1 text-neutral-500 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtros:</span>
              </div>

              <select
                value={filterMonthScope}
                onChange={(e) => setFilterMonthScope(e.target.value as 'month' | 'all')}
                className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="month">Apenas mês selecionado</option>
                <option value="all">Todo o histórico (Todos os meses)</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">Todas as contas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="completed">Apenas efetivados</option>
                <option value="pending">Apenas pendentes</option>
              </select>

              {(search ||
                filterType !== 'all' ||
                filterCategory !== 'all' ||
                filterAccount !== 'all' ||
                filterStatus !== 'all' ||
                filterMonthScope !== 'month') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterType('all');
                    setFilterCategory('all');
                    setFilterAccount('all');
                    setFilterStatus('all');
                    setFilterMonthScope('month');
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline ml-auto"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Table summary */}
          <div className="flex flex-wrap items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 px-1">
            <span>
              Exibindo <strong className="font-mono text-neutral-900 dark:text-white">{filteredSummary.count}</strong>{' '}
              lançamento{filteredSummary.count !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4 font-mono">
              <span>
                Receitas:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(filteredSummary.income, preferences.currency, preferences.hideValues)}
                </strong>
              </span>
              <span>
                Despesas:{' '}
                <strong className="text-neutral-900 dark:text-white">
                  -{formatCurrency(filteredSummary.expense, preferences.currency, preferences.hideValues)}
                </strong>
              </span>
              <span>
                Saldo:{' '}
                <strong
                  className={
                    filteredSummary.net >= 0
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {filteredSummary.net >= 0 ? '+' : ''}
                  {formatCurrency(filteredSummary.net, preferences.currency, preferences.hideValues)}
                </strong>
              </span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xs overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Nenhum lançamento encontrado
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Tente alterar os termos de busca, limpar os filtros ou criar um novo lançamento.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-10 text-center font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Data</th>
                      <th className="py-3 px-4 font-semibold">Descrição</th>
                      <th className="py-3 px-4 font-semibold">Categoria</th>
                      <th className="py-3 px-4 font-semibold">Conta</th>
                      <th className="py-3 px-4 text-right font-semibold">Valor</th>
                      <th className="py-3 px-4 text-center font-semibold w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                    {filteredTransactions.map((tx) => {
                      const acc = accounts.find((a) => a.id === tx.accountId);
                      const isIncome = tx.type === 'income';
                      const isExpense = tx.type === 'expense';
                      const isTransfer = tx.type === 'transfer';

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors group"
                        >
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => toggleTransactionStatus(tx.id)}
                              title={tx.status === 'completed' ? 'Marcar como pendente' : 'Marcar como efetivado'}
                              className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            >
                              {tx.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-500" />
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-300 font-mono text-[11px]">
                            {formatDate(tx.date)}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                              <span>{tx.description}</span>
                              {tx.isRecurring && (
                                <span
                                  title="Lançamento recorrente"
                                  className="inline-flex items-center gap-1 text-[10px] text-neutral-500 font-normal bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded"
                                >
                                  <Repeat className="w-2.5 h-2.5" />
                                  <span>Recorrente</span>
                                </span>
                              )}
                              {tx.installmentTotal && (
                                <span className="font-mono text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                  {tx.installmentCurrent}/{tx.installmentTotal}
                                </span>
                              )}
                            </div>
                            {tx.notes && (
                              <div className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                                {tx.notes}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                            {tx.category}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                            {acc?.name || 'Conta'}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span
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
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openTxModal(tx.type, tx)}
                                title="Editar"
                                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => duplicateTransaction(tx.id)}
                                title="Duplicar"
                                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Deseja excluir "${tx.description}"?`)) {
                                    deleteTransaction(tx.id);
                                  }
                                }}
                                title="Excluir"
                                className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: COMPRAS PARCELADAS (INSTALLMENTS) */}
      {subView === 'installments' && (
        <div className="space-y-6">
          {/* KPI Strip for Installments */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
              <span className="text-xs text-neutral-500">Total a Pagar em Parcelas Futuras</span>
              <div className="text-2xl font-semibold font-mono text-neutral-900 dark:text-white mt-1">
                {formatCurrency(totalInstallmentFutureDebt, preferences.currency, preferences.hideValues)}
              </div>
              <span className="text-[11px] text-neutral-400 mt-2 block">
                Comprometimento futuro em cartões
              </span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
              <span className="text-xs text-neutral-500">Parcelas Ativas</span>
              <div className="text-2xl font-semibold font-mono text-neutral-900 dark:text-white mt-1">
                {installmentSeries.filter((s) => !s.isFinished).length} compras
              </div>
              <span className="text-[11px] text-neutral-400 mt-2 block">
                {installmentSeries.filter((s) => s.isFinished).length} compras já quitadas
              </span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-xs text-neutral-500">Ação Rápida</span>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">
                  Nova Compra Parcelada
                </div>
              </div>
              <button
                onClick={() => openTxModal('expense')}
                className="mt-2 py-1.5 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 rounded-lg transition-colors text-center"
              >
                + Adicionar Parcelamento
              </button>
            </div>
          </div>

          {/* List of Installment Series */}
          {visibleInstallmentSeries.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center space-y-2">
              <CreditCard className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {search.trim() ? `Nenhum parcelamento encontrado para "${search}"` : 'Nenhum parcelamento ativo registrado'}
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {search.trim()
                  ? 'Verifique os termos digitados na busca por descrição ou categoria.'
                  : 'Ao registrar uma nova despesa, selecione "Compra Parcelada no Cartão" para gerenciar parcelas e antecipações aqui.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleInstallmentSeries.map((series) => {
                const percent = Math.min(
                  100,
                  Math.round((series.completedCount / series.totalInstallments) * 100)
                );

                return (
                  <div
                    key={series.groupId}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                            {series.description}
                          </h3>
                          {series.isFinished ? (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                              Quitado
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                              {series.completedCount} de {series.totalInstallments} pagas
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                          <span>{series.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{series.accountName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">
                            {series.totalInstallments}x de{' '}
                            {formatCurrency(series.installmentAmount, preferences.currency, preferences.hideValues)}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right font-mono">
                        <div className="text-base font-semibold text-neutral-900 dark:text-white">
                          Total:{' '}
                          {formatCurrency(series.totalAmount, preferences.currency, preferences.hideValues)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Restante:{' '}
                          <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">
                            {formatCurrency(series.remainingAmount, preferences.currency, preferences.hideValues)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-neutral-900 dark:bg-white transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                        <span>{percent}% do valor liquidado</span>
                        <span>
                          {series.pendingCount > 0
                            ? `Faltam ${series.pendingCount} parcelas`
                            : 'Todas as parcelas foram pagas'}
                        </span>
                      </div>
                    </div>

                    {/* Installments Table Strip */}
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                      <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Cronograma das Parcelas:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {series.items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                              item.status === 'completed'
                                ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/60'
                                : 'bg-white dark:bg-neutral-900 border-dashed border-neutral-300 dark:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                                {item.installmentCurrent}/{series.totalInstallments}
                              </span>
                              <button
                                onClick={() => toggleTransactionStatus(item.id)}
                                title={item.status === 'completed' ? 'Marcar pendente' : 'Marcar efetivada'}
                                className="p-0.5"
                              >
                                {item.status === 'completed' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-1">
                              {formatDate(item.date)}
                            </div>
                            <div className="font-mono text-[11px] font-medium text-neutral-800 dark:text-neutral-200 mt-1">
                              {formatCurrency(item.amount, preferences.currency, preferences.hideValues)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions on this series */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        {series.pendingCount > 0 && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja adiantar a próxima parcela pendente de "${series.description}"?`)) {
                                anticipateInstallments(series.groupId, 1);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Adiantar 1 Parcela</span>
                          </button>
                        )}
                        {series.pendingCount > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja quitar todas as ${series.pendingCount} parcelas restantes de "${series.description}"?`)) {
                                anticipateInstallments(series.groupId);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                          >
                            <span>Quitar Todas Restantes</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja cancelar todas as parcelas futuras pendentes de "${series.description}"?`)) {
                            deleteInstallmentSeries(series.groupId, true);
                          }
                        }}
                        className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] transition-colors"
                      >
                        Cancelar parcelas futuras
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: RECORRÊNCIAS & ASSINATURAS */}
      {subView === 'recurring' && (
        <div className="space-y-6">
          {/* Status banner after generating */}
          {recurringNotice && (
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-xs font-medium flex items-center justify-between">
              <span>{recurringNotice}</span>
              <button onClick={() => setRecurringNotice(null)} className="text-neutral-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* KPI Strip for Recurring */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
              <span className="text-xs text-neutral-500">Despesas Fixas Mensais</span>
              <div className="text-2xl font-semibold font-mono text-rose-600 dark:text-rose-400 mt-1">
                -{formatCurrency(totalRecurringMonthlyExpenses, preferences.currency, preferences.hideValues)}
              </div>
              <span className="text-[11px] text-neutral-400 mt-2 block">
                Aluguel, contas, internet, assinaturas
              </span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs">
              <span className="text-xs text-neutral-500">Receitas Fixas Mensais</span>
              <div className="text-2xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                +{formatCurrency(totalRecurringMonthlyIncomes, preferences.currency, preferences.hideValues)}
              </div>
              <span className="text-[11px] text-neutral-400 mt-2 block">
                Salários, pró-labore, rendimentos fixos
              </span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-xs text-neutral-500">Automação Mensal</span>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white mt-1">
                  Mês: {formatMonthYear(selectedMonth)}
                </div>
              </div>
              <button
                onClick={handleGenerateRecurring}
                className="mt-2 py-2 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Lançar Recorrências no Mês</span>
              </button>
            </div>
          </div>

          {/* List of Recurring Subscriptions and Fixed Costs */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Contas Recorrentes Cadastradas
                </h3>
                <p className="text-xs text-neutral-500">
                  Compromissos fixos mensais com repetição programada
                </p>
              </div>
              <button
                onClick={() => openTxModal('expense')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 dark:text-white hover:opacity-80"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Recorrência</span>
              </button>
            </div>

            {visibleRecurringSeries.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                {search.trim() ? `Nenhuma recorrência encontrada para "${search}"` : 'Nenhuma conta fixa ou recorrente cadastrada.'}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {visibleRecurringSeries.map((item) => {
                  const isIncome = item.type === 'income';
                  const txThisMonth = item.currentMonthTx;

                  return (
                    <div
                      key={item.groupId}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isIncome
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <Repeat className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-white text-sm">
                            {item.description}
                          </div>
                          <div className="text-neutral-500 flex items-center gap-2 mt-0.5">
                            <span>{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.accountName}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {item.recurrence === 'monthly'
                                ? `Todo dia ${item.dayOfMonth}`
                                : 'Anual'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        {/* Status in Selected Month */}
                        <div className="text-left sm:text-right">
                          {txThisMonth ? (
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 font-medium ${
                                  txThisMonth.status === 'completed'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {txThisMonth.status === 'completed' ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Efetivado no mês</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Pendente no mês</span>
                                  </>
                                )}
                              </span>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                Vencimento: {formatDate(txThisMonth.date)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">
                              Ainda não lançado em {formatMonthYear(selectedMonth).split(' de ')[0]}
                            </span>
                          )}
                        </div>

                        {/* Value and Actions */}
                        <div className="text-right shrink-0">
                          <div
                            className={`font-mono font-semibold text-sm ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-neutral-900 dark:text-white'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(item.amount, preferences.currency, preferences.hideValues)}
                            <span className="text-[10px] text-neutral-400 font-normal"> /mês</span>
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <button
                              onClick={() => {
                                if (confirm(`Deseja interromper as repetições futuras de "${item.description}"?`)) {
                                  deleteRecurringSeries(item.groupId, true);
                                }
                              }}
                              className="text-[11px] text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400"
                            >
                              Interromper recorrência
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
