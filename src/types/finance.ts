export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'completed' | 'pending';
export type RecurrenceType = 'none' | 'monthly' | 'yearly' | 'weekly';

export interface Transaction {
  id: string;
  description: string;
  amount: number; // positive number (installment amount if installment)
  type: TransactionType;
  category: string; // Category name or ID
  accountId: string; // Source account
  destinationAccountId?: string; // For transfers
  date: string; // YYYY-MM-DD
  status: TransactionStatus;
  isRecurring?: boolean;
  recurrence?: RecurrenceType;
  recurringGroupId?: string;
  notes?: string;
  installmentGroupId?: string;
  installmentCurrent?: number;
  installmentTotal?: number;
  installmentTotalAmount?: number;
  createdAt: string;
}

export type AccountType = 'checking' | 'cash' | 'savings' | 'investment' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  iconName: string;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  budgetMonthly?: number; // spending limit
  color: string;
  iconName: string;
  isKakeboGroup?: 'essential' | 'optional' | 'culture' | 'extra'; // Kakebo methodology
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  color: string;
  category?: string;
  notes?: string;
  linkedAccountId?: string; // ID of linked account (e.g. savings account) or 'all_savings'
}

export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

export interface UserPreferences {
  currency: CurrencyCode;
  theme: 'light' | 'dark' | 'system';
  hideValues: boolean;
}

export interface FinanceData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  preferences: UserPreferences;
}
