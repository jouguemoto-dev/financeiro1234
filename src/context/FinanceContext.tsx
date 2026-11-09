import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Account,
  Category,
  FinanceData,
  Goal,
  Transaction,
  TransactionType,
  RecurrenceType,
  UserPreferences,
} from '../types/finance';
import {
  generateSeedTransactions,
  initialAccounts,
  initialCategories,
  initialGoals,
  initialPreferences,
} from '../data/initialData';
import { getCurrentYearMonth, getMonthOffset } from '../utils/formatters';

const STORAGE_KEY = 'kakebo_finance_data_v1';

export type ActiveTab = 'dashboard' | 'transactions' | 'budgets' | 'accounts' | 'goals' | 'reports' | 'settings';

export interface TxModalOptions {
  isRecurring?: boolean;
  recurrence?: RecurrenceType;
  isInstallment?: boolean;
}

interface FinanceContextType {
  // Data
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  preferences: UserPreferences;
  selectedMonth: string;
  activeTab: ActiveTab;

  // Setters
  setSelectedMonth: (month: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  goToCurrentMonth: () => void;

  // Calculators
  getAccountBalance: (accountId: string) => number;
  getCreditCardUsage: (accountId: string) => { currentInvoice: number; availableLimit: number };
  totalNetWorth: number;
  savingsAccounts: Account[];
  totalSavingsBalance: number;
  getGoalCurrentAmount: (goal: Goal) => number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  monthPendingIncome: number;
  monthPendingExpense: number;
  monthSavingsRate: number;
  monthTransactions: Transaction[];

  // Mutations
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'createdAt'>,
    createAllInstallments?: boolean,
    occurrencesToGenerate?: number
  ) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  toggleTransactionStatus: (id: string) => void;
  duplicateTransaction: (id: string) => void;
  anticipateInstallments: (installmentGroupId: string, count?: number) => void;
  deleteInstallmentSeries: (installmentGroupId: string, onlyFuture?: boolean) => void;
  generateRecurringForMonth: (targetMonth: string) => number;
  deleteRecurringSeries: (recurringGroupId: string, onlyFuture?: boolean) => void;

  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  updateGoalTarget: (goalId: string, newTarget: number, linkedAccountId?: string) => void;
  deleteGoal: (id: string) => void;
  depositToGoal: (goalId: string, amount: number, accountId?: string) => void;

  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  importData: (data: FinanceData) => boolean;

  // Modals
  isTxModalOpen: boolean;
  openTxModal: (type?: TransactionType, txToEdit?: Transaction, options?: TxModalOptions) => void;
  closeTxModal: () => void;
  txToEdit: Transaction | null;
  txModalDefaultType: TransactionType;
  txModalOptions?: TxModalOptions;

  isAccountModalOpen: boolean;
  openAccountModal: (accountToEdit?: Account) => void;
  closeAccountModal: () => void;
  accountToEdit: Account | null;

  isGoalModalOpen: boolean;
  openGoalModal: (goalToEdit?: Goal) => void;
  closeGoalModal: () => void;
  goalToEdit: Goal | null;

  isDepositModalOpen: boolean;
  openDepositModal: (goal: Goal) => void;
  closeDepositModal: () => void;
  goalForDeposit: Goal | null;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load data from localStorage or fallback to defaults
  const [financeData, setFinanceData] = useState<FinanceData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FinanceData;
        if (parsed.accounts && parsed.transactions && parsed.categories) {
          return parsed;
        }
      }
    } catch {
      // Fallback on error
    }
    return {
      accounts: initialAccounts,
      categories: initialCategories,
      transactions: generateSeedTransactions(),
      goals: initialGoals,
      preferences: initialPreferences,
    };
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txModalDefaultType, setTxModalDefaultType] = useState<TransactionType>('expense');
  const [txModalOptions, setTxModalOptions] = useState<TxModalOptions | undefined>(undefined);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [goalForDeposit, setGoalForDeposit] = useState<Goal | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(financeData));
    } catch (err) {
      console.error('Failed to save finance data to localStorage', err);
    }
  }, [financeData]);

  // Sync theme with <html> class
  useEffect(() => {
    const theme = financeData.preferences.theme;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [financeData.preferences.theme]);

  // Month navigation
  const prevMonth = useCallback(() => {
    setSelectedMonth((prev) => getMonthOffset(prev, -1));
  }, []);

  const nextMonth = useCallback(() => {
    setSelectedMonth((prev) => getMonthOffset(prev, 1));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setSelectedMonth(getCurrentYearMonth());
  }, []);

  // Modal open/close handlers
  const openTxModal = useCallback(
    (type: TransactionType = 'expense', tx?: Transaction, options?: TxModalOptions) => {
      setTxModalDefaultType(type);
      setTxToEdit(tx || null);
      setTxModalOptions(options);
      setIsTxModalOpen(true);
    },
    []
  );

  const closeTxModal = useCallback(() => {
    setIsTxModalOpen(false);
    setTxToEdit(null);
    setTxModalOptions(undefined);
  }, []);

  const openAccountModal = useCallback((acc?: Account) => {
    setAccountToEdit(acc || null);
    setIsAccountModalOpen(true);
  }, []);

  const closeAccountModal = useCallback(() => {
    setIsAccountModalOpen(false);
    setAccountToEdit(null);
  }, []);

  const openGoalModal = useCallback((goal?: Goal) => {
    setGoalToEdit(goal || null);
    setIsGoalModalOpen(true);
  }, []);

  const closeGoalModal = useCallback(() => {
    setIsGoalModalOpen(false);
    setGoalToEdit(null);
  }, []);

  const openDepositModal = useCallback((goal: Goal) => {
    setGoalForDeposit(goal);
    setIsDepositModalOpen(true);
  }, []);

  const closeDepositModal = useCallback(() => {
    setIsDepositModalOpen(false);
    setGoalForDeposit(null);
  }, []);

  // Account balance computation
  const getAccountBalance = useCallback(
    (accountId: string): number => {
      const account = financeData.accounts.find((a) => a.id === accountId);
      if (!account) return 0;

      let balance = account.initialBalance;

      financeData.transactions.forEach((tx) => {
        if (tx.status !== 'completed') return;

        if (tx.type === 'income' && tx.accountId === accountId) {
          balance += tx.amount;
        } else if (tx.type === 'expense' && tx.accountId === accountId) {
          balance -= tx.amount;
        } else if (tx.type === 'transfer') {
          if (tx.accountId === accountId) {
            balance -= tx.amount;
          }
          if (tx.destinationAccountId === accountId) {
            balance += tx.amount;
          }
        }
      });

      return balance;
    },
    [financeData.accounts, financeData.transactions]
  );

  const getCreditCardUsage = useCallback(
    (accountId: string): { currentInvoice: number; availableLimit: number } => {
      const account = financeData.accounts.find((a) => a.id === accountId);
      if (!account || account.type !== 'credit') {
        return { currentInvoice: 0, availableLimit: 0 };
      }

      // Sum of expenses made on this card for current month or uncompleted
      const limit = account.creditLimit || 0;
      let used = 0;

      financeData.transactions.forEach((tx) => {
        if (tx.accountId === accountId && tx.type === 'expense') {
          // If transaction is in current month or still marked as unpaid invoice
          if (tx.date.startsWith(selectedMonth)) {
            used += tx.amount;
          }
        }
      });

      return {
        currentInvoice: used,
        availableLimit: Math.max(0, limit - used),
      };
    },
    [financeData.accounts, financeData.transactions, selectedMonth]
  );

  // Overall Net Worth (Patrimônio Líquido)
  const totalNetWorth = useMemo(() => {
    return financeData.accounts.reduce((acc, account) => {
      if (account.type === 'credit') {
        // Credit card invoice is a liability
        const { currentInvoice } = getCreditCardUsage(account.id);
        return acc - currentInvoice;
      }
      return acc + getAccountBalance(account.id);
    }, 0);
  }, [financeData.accounts, getAccountBalance, getCreditCardUsage]);

  // Savings accounts and combined savings balance
  const savingsAccounts = useMemo(() => {
    return financeData.accounts.filter((a) => a.type === 'savings');
  }, [financeData.accounts]);

  const totalSavingsBalance = useMemo(() => {
    return savingsAccounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  }, [savingsAccounts, getAccountBalance]);

  // Dynamic goal progress calculator linked to savings accounts
  const getGoalCurrentAmount = useCallback(
    (goal: Goal): number => {
      if (goal.linkedAccountId) {
        if (goal.linkedAccountId === 'all_savings') {
          return totalSavingsBalance;
        }
        return getAccountBalance(goal.linkedAccountId);
      }
      return goal.currentAmount;
    },
    [totalSavingsBalance, getAccountBalance]
  );

  // Selected Month Transactions
  const monthTransactions = useMemo(() => {
    return financeData.transactions
      .filter((tx) => tx.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [financeData.transactions, selectedMonth]);

  // Month aggregations
  const { monthIncome, monthExpense, monthPendingIncome, monthPendingExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let pInc = 0;
    let pExp = 0;

    monthTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        if (tx.status === 'completed') inc += tx.amount;
        else pInc += tx.amount;
      } else if (tx.type === 'expense') {
        if (tx.status === 'completed') exp += tx.amount;
        else pExp += tx.amount;
      }
    });

    return {
      monthIncome: inc,
      monthExpense: exp,
      monthPendingIncome: pInc,
      monthPendingExpense: pExp,
    };
  }, [monthTransactions]);

  const monthNet = monthIncome - monthExpense;

  const monthSavingsRate = useMemo(() => {
    if (monthIncome <= 0) return 0;
    const rate = ((monthIncome - monthExpense) / monthIncome) * 100;
    return Math.max(0, Math.round(rate * 10) / 10);
  }, [monthIncome, monthExpense]);

  // Mutations
  const addTransaction = useCallback(
    (
      txData: Omit<Transaction, 'id' | 'createdAt'>,
      createAllInstallments = false,
      occurrencesToGenerate = 1
    ) => {
      const nowStr = new Date().toISOString();
      const baseId = `tx-${Date.now()}`;

      // Case 1: Installment purchase
      if (createAllInstallments && txData.installmentTotal && txData.installmentTotal > 1) {
        const total = txData.installmentTotal;
        const current = txData.installmentCurrent || 1;
        const newTxs: Transaction[] = [];
        const installmentGroupId = txData.installmentGroupId || `inst-${Date.now()}`;
        const totalAmount = txData.installmentTotalAmount || txData.amount * total;

        const [startYear, startMonth, startDay] = txData.date.split('-').map(Number);

        for (let i = current; i <= total; i++) {
          const offset = i - current;
          const targetDate = new Date(startYear, startMonth - 1 + offset, startDay);
          const y = targetDate.getFullYear();
          const m = String(targetDate.getMonth() + 1).padStart(2, '0');
          const d = String(targetDate.getDate()).padStart(2, '0');

          newTxs.push({
            ...txData,
            id: `${baseId}-${i}`,
            installmentGroupId,
            installmentCurrent: i,
            installmentTotal: total,
            installmentTotalAmount: totalAmount,
            date: `${y}-${m}-${d}`,
            status: i === current ? txData.status : 'pending',
            createdAt: nowStr,
          });
        }

        setFinanceData((prev) => ({
          ...prev,
          transactions: [...newTxs, ...prev.transactions],
        }));
      }
      // Case 2: Recurring transaction with advance projection (e.g. 3, 6, 12 months)
      else if (txData.isRecurring && occurrencesToGenerate > 1) {
        const recurringGroupId = txData.recurringGroupId || `rec-${Date.now()}`;
        const [startYear, startMonth, startDay] = txData.date.split('-').map(Number);
        const newTxs: Transaction[] = [];

        for (let i = 0; i < occurrencesToGenerate; i++) {
          const targetDate = new Date(startYear, startMonth - 1 + i, startDay);
          const y = targetDate.getFullYear();
          const m = String(targetDate.getMonth() + 1).padStart(2, '0');
          const d = String(targetDate.getDate()).padStart(2, '0');

          newTxs.push({
            ...txData,
            id: `${baseId}-${i}`,
            recurringGroupId,
            date: `${y}-${m}-${d}`,
            status: i === 0 ? txData.status : 'pending',
            createdAt: nowStr,
          });
        }

        setFinanceData((prev) => ({
          ...prev,
          transactions: [...newTxs, ...prev.transactions],
        }));
      }
      // Case 3: Standard single transaction
      else {
        const newTx: Transaction = {
          ...txData,
          id: baseId,
          recurringGroupId: txData.isRecurring ? txData.recurringGroupId || `rec-${Date.now()}` : undefined,
          createdAt: nowStr,
        };
        setFinanceData((prev) => ({
          ...prev,
          transactions: [newTx, ...prev.transactions],
        }));
      }
    },
    []
  );

  const updateTransaction = useCallback((updatedTx: Transaction) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) => (tx.id === updatedTx.id ? updatedTx : tx)),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== id),
    }));
  }, []);

  const toggleTransactionStatus = useCallback((id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((tx) =>
        tx.id === id ? { ...tx, status: tx.status === 'completed' ? 'pending' : 'completed' } : tx
      ),
    }));
  }, []);

  const duplicateTransaction = useCallback((id: string) => {
    setFinanceData((prev) => {
      const original = prev.transactions.find((t) => t.id === id);
      if (!original) return prev;
      const duplicated: Transaction = {
        ...original,
        id: `tx-${Date.now()}`,
        description: `${original.description} (Cópia)`,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        transactions: [duplicated, ...prev.transactions],
      };
    });
  }, []);

  // Anticipate installments in a series (e.g., pay ahead)
  const anticipateInstallments = useCallback((installmentGroupId: string, count?: number) => {
    setFinanceData((prev) => {
      // Find all pending installments in this group sorted by installmentCurrent
      const pendingTxs = prev.transactions
        .filter((tx) => tx.installmentGroupId === installmentGroupId && tx.status === 'pending')
        .sort((a, b) => (a.installmentCurrent || 0) - (b.installmentCurrent || 0));

      const toMarkCompleted = count !== undefined ? pendingTxs.slice(0, count) : pendingTxs;
      const idsToUpdate = new Set(toMarkCompleted.map((t) => t.id));

      return {
        ...prev,
        transactions: prev.transactions.map((tx) =>
          idsToUpdate.has(tx.id) ? { ...tx, status: 'completed' } : tx
        ),
      };
    });
  }, []);

  // Delete all or future installments in a series
  const deleteInstallmentSeries = useCallback((installmentGroupId: string, onlyFuture = false) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => {
        if (tx.installmentGroupId !== installmentGroupId) return true;
        if (onlyFuture) {
          return tx.status === 'completed'; // Keep past completed ones, delete future pending
        }
        return false; // Delete all in series
      }),
    }));
  }, []);

  // Generate missing recurring transactions for a given month
  const generateRecurringForMonth = useCallback((targetMonth: string): number => {
    let generatedCount = 0;

    setFinanceData((prev) => {
      // Find unique recurring templates by recurringGroupId or recurring description
      const recurringTemplates = new Map<string, Transaction>();

      prev.transactions.forEach((tx) => {
        if (tx.isRecurring && (tx.recurringGroupId || tx.description)) {
          const key = tx.recurringGroupId || tx.description;
          if (!recurringTemplates.has(key)) {
            recurringTemplates.set(key, tx);
          }
        }
      });

      const newTxs: Transaction[] = [];
      const [tYear, tMonth] = targetMonth.split('-');

      recurringTemplates.forEach((template, key) => {
        // Check if there is already a transaction for this recurring template in targetMonth
        const alreadyExists = prev.transactions.some((tx) => {
          const matchesGroup = tx.recurringGroupId && tx.recurringGroupId === key;
          const matchesDesc = tx.description === template.description && tx.isRecurring;
          return (matchesGroup || matchesDesc) && tx.date.startsWith(targetMonth);
        });

        if (!alreadyExists) {
          // Extract day of month from template date
          const templateDay = template.date.slice(8, 10) || '05';
          const newDate = `${tYear}-${tMonth}-${templateDay}`;

          newTxs.push({
            ...template,
            id: `tx-rec-${Date.now()}-${generatedCount}`,
            date: newDate,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
          generatedCount++;
        }
      });

      if (newTxs.length === 0) return prev;

      return {
        ...prev,
        transactions: [...newTxs, ...prev.transactions],
      };
    });

    return generatedCount;
  }, []);

  // Delete all or future recurring occurrences of a series
  const deleteRecurringSeries = useCallback((recurringGroupId: string, onlyFuture = true) => {
    setFinanceData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => {
        if (tx.recurringGroupId !== recurringGroupId) return true;
        if (onlyFuture) {
          return tx.status === 'completed';
        }
        return false;
      }),
    }));
  }, []);

  const addAccount = useCallback((accData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accData,
      id: `acc-${Date.now()}`,
    };
    setFinanceData((prev) => ({
      ...prev,
      accounts: [...prev.accounts, newAcc],
    }));
  }, []);

  const updateAccount = useCallback((updated: Account) => {
    setFinanceData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === updated.id ? updated : a)),
    }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }));
  }, []);

  const addCategory = useCallback((catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
    };
    setFinanceData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
  }, []);

  const updateCategory = useCallback((updated: Category) => {
    setFinanceData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === updated.id ? updated : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  }, []);

  const addGoal = useCallback((goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    setFinanceData((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  }, []);

  const updateGoal = useCallback((updated: Goal) => {
    setFinanceData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === updated.id ? updated : g)),
    }));
  }, []);

  const updateGoalTarget = useCallback(
    (goalId: string, newTarget: number, linkedAccountId?: string) => {
      setFinanceData((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            targetAmount: newTarget,
            ...(linkedAccountId !== undefined ? { linkedAccountId } : {}),
          };
        }),
      }));
    },
    []
  );

  const deleteGoal = useCallback((id: string) => {
    setFinanceData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, []);

  const depositToGoal = useCallback((goalId: string, amount: number, accountId?: string) => {
    if (amount <= 0) return;

    setFinanceData((prev) => {
      const goal = prev.goals.find((g) => g.id === goalId);
      if (!goal) return prev;

      const updatedGoal: Goal = {
        ...goal,
        currentAmount: goal.currentAmount + amount,
      };

      let newTxs = prev.transactions;
      if (accountId) {
        // If goal has a linked savings account and user specified a different source account,
        // register this as a real transfer to the linked savings account!
        const today = new Date().toISOString().slice(0, 10);
        const isTransfer =
          goal.linkedAccountId &&
          goal.linkedAccountId !== 'all_savings' &&
          goal.linkedAccountId !== accountId;

        const newTx: Transaction = {
          id: `tx-goal-${Date.now()}`,
          description: `Aporte Meta: ${goal.name}`,
          amount,
          type: isTransfer ? 'transfer' : 'expense',
          category: isTransfer ? 'Transferência' : 'Outros & Imprevistos',
          accountId,
          destinationAccountId: isTransfer ? goal.linkedAccountId : undefined,
          date: today,
          status: 'completed',
          notes: `Aporte direto registrado para a meta ${goal.name}`,
          createdAt: new Date().toISOString(),
        };
        newTxs = [newTx, ...prev.transactions];
      }

      return {
        ...prev,
        goals: prev.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
        transactions: newTxs,
      };
    });
  }, []);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setFinanceData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...prefs },
    }));
  }, []);

  const resetToDemoData = useCallback(() => {
    const freshData: FinanceData = {
      accounts: initialAccounts,
      categories: initialCategories,
      transactions: generateSeedTransactions(),
      goals: initialGoals,
      preferences: initialPreferences,
    };
    setFinanceData(freshData);
    setSelectedMonth(getCurrentYearMonth());
  }, []);

  const clearAllData = useCallback(() => {
    const emptyData: FinanceData = {
      accounts: [],
      categories: initialCategories.filter((c) => c.type === 'expense').slice(0, 4),
      transactions: [],
      goals: [],
      preferences: initialPreferences,
    };
    setFinanceData(emptyData);
  }, []);

  const importData = useCallback((data: FinanceData): boolean => {
    if (Array.isArray(data.accounts) && Array.isArray(data.transactions) && Array.isArray(data.categories)) {
      setFinanceData(data);
      return true;
    }
    return false;
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        accounts: financeData.accounts,
        categories: financeData.categories,
        transactions: financeData.transactions,
        goals: financeData.goals,
        preferences: financeData.preferences,
        selectedMonth,
        activeTab,
        setSelectedMonth,
        setActiveTab,
        prevMonth,
        nextMonth,
        goToCurrentMonth,
        getAccountBalance,
        getCreditCardUsage,
        totalNetWorth,
        savingsAccounts,
        totalSavingsBalance,
        getGoalCurrentAmount,
        monthIncome,
        monthExpense,
        monthNet,
        monthPendingIncome,
        monthPendingExpense,
        monthSavingsRate,
        monthTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleTransactionStatus,
        duplicateTransaction,
        anticipateInstallments,
        deleteInstallmentSeries,
        generateRecurringForMonth,
        deleteRecurringSeries,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        addGoal,
        updateGoal,
        updateGoalTarget,
        deleteGoal,
        depositToGoal,
        updatePreferences,
        resetToDemoData,
        clearAllData,
        importData,
        isTxModalOpen,
        openTxModal,
        closeTxModal,
        txToEdit,
        txModalDefaultType,
        txModalOptions,
        isAccountModalOpen,
        openAccountModal,
        closeAccountModal,
        accountToEdit,
        isGoalModalOpen,
        openGoalModal,
        closeGoalModal,
        goalToEdit,
        isDepositModalOpen,
        openDepositModal,
        closeDepositModal,
        goalForDeposit,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
