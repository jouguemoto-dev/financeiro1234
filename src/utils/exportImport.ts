import { FinanceData, Transaction } from '../types/finance';

export function exportFinanceDataToJSON(data: FinanceData): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `kakebo_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportTransactionsToCSV(transactions: Transaction[], currency: string): void {
  const headers = [
    'ID',
    'Data',
    'Descricao',
    'Tipo',
    'Categoria',
    `Valor (${currency})`,
    'Conta Origem',
    'Conta Destino',
    'Status',
    'Parcela',
    'Observacoes',
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.date,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.accountId,
    t.destinationAccountId || '',
    t.status === 'completed' ? 'Efetivado' : 'Pendente',
    t.installmentTotal ? `${t.installmentCurrent}/${t.installmentTotal}` : '',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `lancamentos_financeiros_${dateStr}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

export interface MonthlyReportCSVInput {
  monthKey: string;
  monthLabel: string;
  currency: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  dailyAverage: number;
  projectedMonthExpense: number;
  categories: { name: string; amount: number; percentage: number }[];
  transactions: Transaction[];
  accountMap?: Map<string, string>;
}

export function exportMonthlyReportToCSV(data: MonthlyReportCSVInput): void {
  const lines: string[] = [];

  // Section 1: Monthly Overview Header
  lines.push(`"RELATORIO FINANCEIRO MENSAL - ${data.monthLabel.toUpperCase()}"`);
  lines.push(`"Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}"`);
  lines.push('');

  lines.push('"RESUMO DO PERIODO"');
  lines.push(
    [
      'Mes',
      `Receitas Totais (${data.currency})`,
      `Despesas Totais (${data.currency})`,
      `Saldo Liquido (${data.currency})`,
      'Taxa de Poupanca (%)',
      `Gasto Medio Diario (${data.currency})`,
      `Projecao Fim do Mes (${data.currency})`,
    ].join(',')
  );
  lines.push(
    [
      `"${data.monthLabel}"`,
      data.totalIncome.toFixed(2),
      data.totalExpense.toFixed(2),
      data.netSavings.toFixed(2),
      `"${data.savingsRate.toFixed(1)}%"`,
      data.dailyAverage.toFixed(2),
      data.projectedMonthExpense.toFixed(2),
    ].join(',')
  );

  lines.push('');
  lines.push('"DISTRIBUICAO DE DESPESAS POR CATEGORIA"');
  lines.push(['Categoria', `Total Gasto (${data.currency})`, 'Participacao (%)'].join(','));
  data.categories.forEach((cat) => {
    lines.push([`"${cat.name.replace(/"/g, '""')}"`, cat.amount.toFixed(2), `"${cat.percentage.toFixed(1)}%"`].join(','));
  });

  lines.push('');
  lines.push('"DETALHAMENTO DE LANCAMENTOS DO MES"');
  lines.push(
    [
      'Data',
      'Descricao',
      'Tipo',
      'Categoria',
      'Conta',
      'Situacao',
      `Valor (${data.currency})`,
      'Parcela',
      'Observacoes',
    ].join(',')
  );

  data.transactions.forEach((tx) => {
    const typeLabel = tx.type === 'income' ? 'Receita' : tx.type === 'expense' ? 'Despesa' : 'Transferência';
    const statusLabel = tx.status === 'completed' ? 'Efetivado' : 'Pendente';
    const accountName = data.accountMap?.get(tx.accountId) || tx.accountId;
    const installmentStr = tx.installmentTotal ? `${tx.installmentCurrent}/${tx.installmentTotal}` : '';

    lines.push(
      [
        tx.date,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        `"${typeLabel}"`,
        `"${(tx.category || '').replace(/"/g, '""')}"`,
        `"${accountName.replace(/"/g, '""')}"`,
        `"${statusLabel}"`,
        tx.amount.toFixed(2),
        `"${installmentStr}"`,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
  });

  const csvContent = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `relatorio_mensal_${data.monthKey}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}
