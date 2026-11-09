import { Account, Category, Goal, Transaction, UserPreferences } from '../types/finance';
import { getCurrentYearMonth } from '../utils/formatters';

export const initialPreferences: UserPreferences = {
  currency: 'BRL',
  theme: 'system',
  hideValues: false,
};

export const initialAccounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Nubank Principal',
    type: 'checking',
    initialBalance: 4250.80,
    color: '#8A05BE',
    iconName: 'Building2',
  },
  {
    id: 'acc-2',
    name: 'XP Investimentos',
    type: 'investment',
    initialBalance: 38400.00,
    color: '#10B981',
    iconName: 'TrendingUp',
  },
  {
    id: 'acc-3',
    name: 'Reserva no Tesouro Selic',
    type: 'savings',
    initialBalance: 24500.00,
    color: '#0284C7',
    iconName: 'ShieldCheck',
  },
  {
    id: 'acc-4',
    name: 'Carteira Física (Dinheiro)',
    type: 'cash',
    initialBalance: 320.00,
    color: '#64748B',
    iconName: 'Wallet',
  },
  {
    id: 'acc-5',
    name: 'Cartão Nubank Ultravioleta',
    type: 'credit',
    initialBalance: 0,
    creditLimit: 15000.00,
    closingDay: 28,
    dueDay: 5,
    color: '#1E1B4B',
    iconName: 'CreditCard',
  },
];

export const initialCategories: Category[] = [
  // Despesas Essenciais (Kakebo: Sobrevivência)
  {
    id: 'cat-housing',
    name: 'Moradia & Contas',
    type: 'expense',
    budgetMonthly: 2800.00,
    color: '#0284C7',
    iconName: 'Home',
    isKakeboGroup: 'essential',
  },
  {
    id: 'cat-groceries',
    name: 'Alimentação & Mercado',
    type: 'expense',
    budgetMonthly: 1600.00,
    color: '#10B981',
    iconName: 'ShoppingBag',
    isKakeboGroup: 'essential',
  },
  {
    id: 'cat-transport',
    name: 'Transporte & Mobilidade',
    type: 'expense',
    budgetMonthly: 700.00,
    color: '#F59E0B',
    iconName: 'Car',
    isKakeboGroup: 'essential',
  },
  {
    id: 'cat-health',
    name: 'Saúde & Farmácia',
    type: 'expense',
    budgetMonthly: 450.00,
    color: '#EF4444',
    iconName: 'HeartPulse',
    isKakeboGroup: 'essential',
  },
  // Lazer & Opcionais
  {
    id: 'cat-leisure',
    name: 'Lazer & Restaurantes',
    type: 'expense',
    budgetMonthly: 800.00,
    color: '#EC4899',
    iconName: 'Utensils',
    isKakeboGroup: 'optional',
  },
  {
    id: 'cat-subscriptions',
    name: 'Assinaturas & Streaming',
    type: 'expense',
    budgetMonthly: 220.00,
    color: '#8B5CF6',
    iconName: 'Tv',
    isKakeboGroup: 'optional',
  },
  {
    id: 'cat-shopping',
    name: 'Compras Pessoais',
    type: 'expense',
    budgetMonthly: 600.00,
    color: '#6366F1',
    iconName: 'Package',
    isKakeboGroup: 'optional',
  },
  // Cultura & Educação
  {
    id: 'cat-education',
    name: 'Educação & Livros',
    type: 'expense',
    budgetMonthly: 350.00,
    color: '#14B8A6',
    iconName: 'BookOpen',
    isKakeboGroup: 'culture',
  },
  // Extras & Imprevistos
  {
    id: 'cat-extra',
    name: 'Outros & Imprevistos',
    type: 'expense',
    budgetMonthly: 500.00,
    color: '#64748B',
    iconName: 'HelpCircle',
    isKakeboGroup: 'extra',
  },
  // Receitas
  {
    id: 'cat-salary',
    name: 'Salário & Remuneração',
    type: 'income',
    color: '#059669',
    iconName: 'Briefcase',
  },
  {
    id: 'cat-freelance',
    name: 'Freelances & Projetos',
    type: 'income',
    color: '#0EA5E9',
    iconName: 'Laptop',
  },
  {
    id: 'cat-dividends',
    name: 'Rendimentos & Dividendos',
    type: 'income',
    color: '#8B5CF6',
    iconName: 'Percent',
  },
];

export const initialGoals: Goal[] = [
  {
    id: 'goal-1',
    name: 'Reserva de Emergência (6 Meses)',
    targetAmount: 36000.00,
    currentAmount: 24500.00,
    deadline: '2027-06-30',
    color: '#0284C7',
    category: 'Segurança Financeira',
    notes: 'Alocado 100% em Tesouro Selic com liquidez diária.',
    linkedAccountId: 'acc-3',
  },
  {
    id: 'goal-2',
    name: 'Viagem ao Japão',
    targetAmount: 22000.00,
    currentAmount: 14200.00,
    deadline: '2027-10-15',
    color: '#EC4899',
    category: 'Lazer e Sonhos',
    notes: 'Passagens aéreas + hospedagem em Tóquio e Quioto.',
    linkedAccountId: 'all_savings',
  },
  {
    id: 'goal-3',
    name: 'Troca de Computador de Trabalho',
    targetAmount: 9500.00,
    currentAmount: 6800.00,
    deadline: '2027-04-10',
    color: '#10B981',
    category: 'Equipamentos',
    notes: 'MacBook Pro para desenvolvimento.',
  },
];

export function generateSeedTransactions(): Transaction[] {
  const currentYM = getCurrentYearMonth();
  const [year, month] = currentYM.split('-');
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);

  // Helper to format date relative to current month
  const relDate = (monthOffset: number, day: number) => {
    const d = new Date(y, m - 1 + monthOffset, day);
    const ry = d.getFullYear();
    const rm = String(d.getMonth() + 1).padStart(2, '0');
    const rd = String(d.getDate()).padStart(2, '0');
    return `${ry}-${rm}-${rd}`;
  };

  const nowIso = new Date().toISOString();

  const transactions: Transaction[] = [
    // Receitas do mês
    {
      id: 'tx-1',
      description: 'Salário Mensal CLT',
      amount: 9800.00,
      type: 'income',
      category: 'Salário & Remuneração',
      accountId: 'acc-1',
      date: `${year}-${month}-05`,
      status: 'completed',
      isRecurring: true,
      recurrence: 'monthly',
      recurringGroupId: 'rec-salary',
      createdAt: nowIso,
    },
    {
      id: 'tx-2',
      description: 'Consultoria de Software (Projeto Alpha)',
      amount: 2400.00,
      type: 'income',
      category: 'Freelances & Projetos',
      accountId: 'acc-1',
      date: `${year}-${month}-12`,
      status: 'completed',
      createdAt: nowIso,
    },
    {
      id: 'tx-3',
      description: 'Rendimento Dividendos FIIs & CDI',
      amount: 382.50,
      type: 'income',
      category: 'Rendimentos & Dividendos',
      accountId: 'acc-2',
      date: `${year}-${month}-15`,
      status: 'completed',
      isRecurring: true,
      recurrence: 'monthly',
      recurringGroupId: 'rec-dividends',
      createdAt: nowIso,
    },
    // Despesas fixas e recorrentes
    {
      id: 'tx-4',
      description: 'Aluguel do Apartamento & Condomínio',
      amount: 2350.00,
      type: 'expense',
      category: 'Moradia & Contas',
      accountId: 'acc-1',
      date: `${year}-${month}-08`,
      status: 'completed',
      isRecurring: true,
      recurrence: 'monthly',
      recurringGroupId: 'rec-rent',
      createdAt: nowIso,
    },
    {
      id: 'tx-5',
      description: 'Conta de Energia (Enel)',
      amount: 215.40,
      type: 'expense',
      category: 'Moradia & Contas',
      accountId: 'acc-1',
      date: `${year}-${month}-10`,
      status: 'completed',
      isRecurring: true,
      recurrence: 'monthly',
      recurringGroupId: 'rec-energy',
      createdAt: nowIso,
    },
    {
      id: 'tx-6',
      description: 'Internet Fibra Óptica 600Mb',
      amount: 129.90,
      type: 'expense',
      category: 'Moradia & Contas',
      accountId: 'acc-1',
      date: `${year}-${month}-11`,
      status: 'completed',
      isRecurring: true,
      recurrence: 'monthly',
      recurringGroupId: 'rec-internet',
      createdAt: nowIso,
    },
    {
      id: 'tx-7',
      description: 'Supermercado Pão de Açúcar (Compras da Quinzena)',
      amount: 684.20,
      type: 'expense',
      category: 'Alimentação & Mercado',
      accountId: 'acc-5',
      date: `${year}-${month}-06`,
      status: 'completed',
      createdAt: nowIso,
    },
    {
      id: 'tx-8',
      description: 'Feira Orgânica & Hortifruti',
      amount: 142.00,
      type: 'expense',
      category: 'Alimentação & Mercado',
      accountId: 'acc-1',
      date: `${year}-${month}-13`,
      status: 'completed',
      createdAt: nowIso,
    },
    {
      id: 'tx-9',
      description: 'Combustível Posto Shell (Gasolina V-Power)',
      amount: 260.00,
      type: 'expense',
      category: 'Transporte & Mobilidade',
      accountId: 'acc-5',
      date: `${year}-${month}-07`,
      status: 'completed',
      createdAt: nowIso,
    },
    {
      id: 'tx-10',
      description: 'Seguro Auto Mensal',
      amount: 195.00,
      type: 'expense',
      category: 'Transporte & Mobilidade',
      accountId: 'acc-1',
      date: `${year}-${month}-14`,
      status: 'completed',
      isRecurring: true,
      recurrence: 'monthly',
      recurringGroupId: 'rec-car-insurance',
      createdAt: nowIso,
    },
    {
      id: 'tx-11',
      description: 'Jantar Restaurante Italiano (Comemoração)',
      amount: 320.00,
      type: 'expense',
      category: 'Lazer & Restaurantes',
      accountId: 'acc-5',
      date: `${year}-${month}-09`,
      status: 'completed',
      createdAt: nowIso,
    },
    {
      id: 'tx-12',
      description: 'Netflix, Spotify & iCloud',
      amount: 94.70,
      type: 'expense',
      category: 'Assinaturas & Streaming',
      accountId: 'acc-5',
      date: `${year}-${month}-05`,
      status: 'completed',
      isRecurring: true,
      recurrence: 'monthly',
      recurringGroupId: 'rec-streaming',
      createdAt: nowIso,
    },
    {
      id: 'tx-13',
      description: 'Farmácia & Vitaminas',
      amount: 185.00,
      type: 'expense',
      category: 'Saúde & Farmácia',
      accountId: 'acc-1',
      date: `${year}-${month}-15`,
      status: 'completed',
      createdAt: nowIso,
    },
    {
      id: 'tx-15',
      description: 'Livro Design Systems & Tipografia',
      amount: 89.00,
      type: 'expense',
      category: 'Educação & Livros',
      accountId: 'acc-5',
      date: `${year}-${month}-16`,
      status: 'completed',
      createdAt: nowIso,
    },
    {
      id: 'tx-16',
      description: 'Plano de Saúde Coparticipação',
      amount: 240.00,
      type: 'expense',
      category: 'Saúde & Farmácia',
      accountId: 'acc-1',
      date: `${year}-${month}-24`,
      status: 'pending',
      createdAt: nowIso,
    },
    {
      id: 'tx-17',
      description: 'Supermercado (2ª Quinzena)',
      amount: 450.00,
      type: 'expense',
      category: 'Alimentação & Mercado',
      accountId: 'acc-5',
      date: `${year}-${month}-22`,
      status: 'pending',
      createdAt: nowIso,
    },
    {
      id: 'tx-18',
      description: 'Aporte Mensal para Reserva Selic',
      amount: 1500.00,
      type: 'transfer',
      category: 'Transferência',
      accountId: 'acc-1',
      destinationAccountId: 'acc-3',
      date: `${year}-${month}-06`,
      status: 'completed',
      createdAt: nowIso,
    },
  ];

  // Parcelamento 1: Monitor Ultrawide 34" (10 parcelas de R$ 289,90 = R$ 2.899,00)
  // Parcela 4 é neste mês. Parcelas 1, 2, 3 foram nos 3 meses anteriores. Parcelas 5..10 nos próximos.
  const monitorGroupId = 'inst-monitor-34';
  const monitorTotal = 10;
  const monitorCurrentInThisMonth = 4;
  for (let i = 1; i <= monitorTotal; i++) {
    const offset = i - monitorCurrentInThisMonth;
    const isPastOrCurrent = offset <= 0;
    transactions.push({
      id: `tx-inst-mon-${i}`,
      description: 'Monitor Ultrawide 34"',
      amount: 289.90,
      type: 'expense',
      category: 'Compras Pessoais',
      accountId: 'acc-5',
      date: relDate(offset, 10),
      status: isPastOrCurrent ? 'completed' : 'pending',
      installmentGroupId: monitorGroupId,
      installmentCurrent: i,
      installmentTotal: monitorTotal,
      installmentTotalAmount: 2899.00,
      createdAt: nowIso,
    });
  }

  // Parcelamento 2: Smartphone Galaxy / iPhone (6 parcelas de R$ 450,00 = R$ 2.700,00)
  // Parcela 2 é neste mês. Parcela 1 mês passado. Parcelas 3..6 nos próximos.
  const phoneGroupId = 'inst-phone-galaxy';
  const phoneTotal = 6;
  const phoneCurrentInThisMonth = 2;
  for (let i = 1; i <= phoneTotal; i++) {
    const offset = i - phoneCurrentInThisMonth;
    const isPastOrCurrent = offset <= 0;
    transactions.push({
      id: `tx-inst-phone-${i}`,
      description: 'Smartphone 256GB Trabalho',
      amount: 450.00,
      type: 'expense',
      category: 'Compras Pessoais',
      accountId: 'acc-5',
      date: relDate(offset, 18),
      status: isPastOrCurrent ? 'completed' : 'pending',
      installmentGroupId: phoneGroupId,
      installmentCurrent: i,
      installmentTotal: phoneTotal,
      installmentTotalAmount: 2700.00,
      createdAt: nowIso,
    });
  }

  return transactions;
}
