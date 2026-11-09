import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType, TransactionStatus, RecurrenceType } from '../../types/finance';
import { formatCurrency, getTodayString } from '../../utils/formatters';
import { X, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Calendar, Repeat, CreditCard } from 'lucide-react';

export const TransactionModal: React.FC = () => {
  const {
    isTxModalOpen,
    closeTxModal,
    txToEdit,
    txModalDefaultType,
    txModalOptions,
    accounts,
    categories,
    preferences,
    addTransaction,
    updateTransaction,
  } = useFinance();

  const [type, setType] = useState<TransactionType>(txModalDefaultType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(''); // Represents single transaction amount or installment amount
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [status, setStatus] = useState<TransactionStatus>('completed');
  
  // Installment states
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentMode, setInstallmentMode] = useState<'total' | 'installment'>('total');
  const [installmentTotalAmount, setInstallmentTotalAmount] = useState('');
  const [installmentCurrent, setInstallmentCurrent] = useState(1);
  const [installmentTotal, setInstallmentTotal] = useState(10);
  const [createAllInstallments, setCreateAllInstallments] = useState(true);

  // Recurrence states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [recurringAdvanceMonths, setRecurringAdvanceMonths] = useState<number>(6);

  const [notes, setNotes] = useState('');

  // Sync modal state when opening or when txToEdit changes
  useEffect(() => {
    if (!isTxModalOpen) return;

    if (txToEdit) {
      setType(txToEdit.type);
      setDescription(txToEdit.description);
      setAmount(txToEdit.amount.toString());
      setCategory(txToEdit.category);
      setAccountId(txToEdit.accountId);
      setDestinationAccountId(txToEdit.destinationAccountId || '');
      setDate(txToEdit.date);
      setStatus(txToEdit.status);
      setIsRecurring(!!txToEdit.isRecurring);
      setRecurrence(txToEdit.recurrence || 'monthly');
      setIsInstallment(!!txToEdit.installmentTotal);
      setInstallmentCurrent(txToEdit.installmentCurrent || 1);
      setInstallmentTotal(txToEdit.installmentTotal || 10);
      setInstallmentTotalAmount(
        txToEdit.installmentTotalAmount
          ? txToEdit.installmentTotalAmount.toString()
          : (txToEdit.amount * (txToEdit.installmentTotal || 1)).toString()
      );
      setCreateAllInstallments(false);
      setNotes(txToEdit.notes || '');
    } else {
      setType(txModalDefaultType);
      setDescription('');
      setAmount('');
      const defaultCat = categories.find((c) =>
        txModalDefaultType === 'income' ? c.type === 'income' : c.type === 'expense'
      );
      setCategory(defaultCat ? defaultCat.name : '');
      const defaultAcc = accounts[0]?.id || '';
      setAccountId(defaultAcc);
      setDestinationAccountId(accounts[1]?.id || '');
      setDate(getTodayString());
      setStatus('completed');
      setIsRecurring(Boolean(txModalOptions?.isRecurring));
      setRecurrence(txModalOptions?.recurrence || 'monthly');
      setRecurringAdvanceMonths(6);
      setIsInstallment(Boolean(txModalOptions?.isInstallment));
      setInstallmentMode('total');
      setInstallmentTotalAmount('');
      setInstallmentCurrent(1);
      setInstallmentTotal(10);
      setCreateAllInstallments(true);
      setNotes('');
    }
  }, [isTxModalOpen, txToEdit, txModalDefaultType, txModalOptions, categories, accounts]);

  // Handle auto-calculation between Total and Installment amounts
  const handleTotalAmountChange = (val: string, totalInst: number = installmentTotal) => {
    setInstallmentTotalAmount(val);
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0 && totalInst > 0) {
      const perInst = (parsed / totalInst).toFixed(2);
      setAmount(perInst);
    }
  };

  const handleInstallmentAmountChange = (val: string, totalInst: number = installmentTotal) => {
    setAmount(val);
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0 && totalInst > 0) {
      const total = (parsed * totalInst).toFixed(2);
      setInstallmentTotalAmount(total);
    }
  };

  const handleInstallmentCountChange = (count: number) => {
    setInstallmentTotal(count);
    if (installmentMode === 'total') {
      const parsedTotal = parseFloat(installmentTotalAmount.replace(',', '.'));
      if (!isNaN(parsedTotal) && parsedTotal > 0 && count > 0) {
        setAmount((parsedTotal / count).toFixed(2));
      }
    } else {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (!isNaN(parsedAmount) && parsedAmount > 0 && count > 0) {
        setInstallmentTotalAmount((parsedAmount * count).toFixed(2));
      }
    }
  };

  if (!isTxModalOpen) return null;

  const filteredCategories = categories.filter((c) =>
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      alert('Informe uma descrição para o lançamento.');
      return;
    }

    const parsedTotalAmount = parseFloat(installmentTotalAmount.replace(',', '.')) || (parsedAmount * installmentTotal);

    if (txToEdit) {
      updateTransaction({
        ...txToEdit,
        type,
        description: description.trim(),
        amount: parsedAmount,
        category: type === 'transfer' ? 'Transferência' : category,
        accountId,
        destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
        date,
        status,
        isRecurring,
        recurrence: isRecurring ? recurrence : undefined,
        installmentCurrent: isInstallment ? installmentCurrent : undefined,
        installmentTotal: isInstallment ? installmentTotal : undefined,
        installmentTotalAmount: isInstallment ? parsedTotalAmount : undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addTransaction(
        {
          type,
          description: description.trim(),
          amount: parsedAmount,
          category: type === 'transfer' ? 'Transferência' : category,
          accountId,
          destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
          date,
          status,
          isRecurring,
          recurrence: isRecurring ? recurrence : undefined,
          installmentCurrent: isInstallment ? installmentCurrent : undefined,
          installmentTotal: isInstallment ? installmentTotal : undefined,
          installmentTotalAmount: isInstallment ? parsedTotalAmount : undefined,
          notes: notes.trim() || undefined,
        },
        isInstallment && createAllInstallments,
        isRecurring ? recurringAdvanceMonths : 1
      );
    }

    closeTxModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {txToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button
            onClick={closeTxModal}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Segmented Buttons */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const defaultCat = categories.find((c) => c.type === 'expense');
                if (defaultCat) setCategory(defaultCat.name);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
                type === 'expense'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
              <span>Despesa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                setIsInstallment(false);
                const defaultCat = categories.find((c) => c.type === 'income');
                if (defaultCat) setCategory(defaultCat.name);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
                type === 'income'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>Receita</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setIsInstallment(false);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
                type === 'transfer'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
              <span>Transferência</span>
            </button>
          </div>

          {/* Amount and Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {isInstallment ? `Valor da Parcela (${preferences.currency})` : `Valor (${preferences.currency})`}
              </label>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                placeholder="0,00"
                value={amount}
                onChange={(e) => {
                  if (isInstallment && installmentMode === 'installment') {
                    handleInstallmentAmountChange(e.target.value);
                  } else {
                    setAmount(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-xl font-mono font-semibold bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Descrição
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Supermercado, Aluguel, Salário, Notebook..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Categories and Accounts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {type !== 'transfer' ? (
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {type === 'transfer' ? 'Conta de Origem' : 'Conta / Cartão'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type === 'credit' ? 'Cartão' : 'Conta'})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Conta de Destino
                </label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Data do Lançamento
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Status buttons */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Situação da 1ª parcela / lançamento
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  status === 'completed'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Efetivado
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  status === 'pending'
                    ? 'bg-amber-500 text-white font-medium shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Pendente
              </button>
            </div>
          </div>

          {/* INSTALLMENTS SECTION */}
          {type === 'expense' && (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    Compra Parcelada (Cartão de Crédito)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsInstallment(checked);
                    if (checked) {
                      setIsRecurring(false);
                      // Auto calculate total
                      const parsed = parseFloat(amount.replace(',', '.'));
                      if (!isNaN(parsed) && parsed > 0) {
                        setInstallmentTotalAmount((parsed * installmentTotal).toFixed(2));
                      }
                    }
                  }}
                  className="rounded text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </label>

              {isInstallment && (
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                  {/* Calculation Mode */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Como deseja informar o valor?</span>
                    <div className="flex items-center gap-1 p-0.5 bg-neutral-200/60 dark:bg-neutral-800 rounded-md">
                      <button
                        type="button"
                        onClick={() => setInstallmentMode('total')}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          installmentMode === 'total'
                            ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium shadow-2xs'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        Valor Total
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstallmentMode('installment')}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          installmentMode === 'installment'
                            ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium shadow-2xs'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        Valor por Parcela
                      </button>
                    </div>
                  </div>

                  {installmentMode === 'total' && (
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Valor Total da Compra ({preferences.currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 1200.00"
                        value={installmentTotalAmount}
                        onChange={(e) => handleTotalAmountChange(e.target.value)}
                        className="w-full px-3 py-1.5 font-mono bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Installment Presets & Counter */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Número de Parcelas
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[2, 3, 4, 6, 10, 12, 18, 24].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleInstallmentCountChange(num)}
                          className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors ${
                            installmentTotal === num
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold'
                              : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          {num}x
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[11px] text-neutral-500">Outro:</span>
                        <input
                          type="number"
                          min="2"
                          max="72"
                          value={installmentTotal}
                          onChange={(e) => handleInstallmentCountChange(parseInt(e.target.value, 10) || 2)}
                          className="w-14 px-2 py-1 text-xs font-mono bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-white text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Banner */}
                  <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-600 dark:text-neutral-400">Resumo do Parcelamento:</span>
                    <strong className="text-neutral-900 dark:text-white">
                      {installmentTotal}x de {formatCurrency(parseFloat(amount) || 0, preferences.currency)} ={' '}
                      {formatCurrency(parseFloat(installmentTotalAmount) || (parseFloat(amount) || 0) * installmentTotal, preferences.currency)}
                    </strong>
                  </div>

                  {!txToEdit && (
                    <label className="flex items-center gap-2 text-[11px] text-neutral-700 dark:text-neutral-300 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={createAllInstallments}
                        onChange={(e) => setCreateAllInstallments(e.target.checked)}
                        className="rounded text-neutral-900 focus:ring-0"
                      />
                      <span>Gerar todas as {installmentTotal} parcelas automaticamente mês a mês</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RECURRING / FIXED SECTION */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Lançamento Fixo / Recorrente (Assinatura, Aluguel, Salário)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsRecurring(checked);
                  if (checked) setIsInstallment(false);
                }}
                className="rounded text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
              />
            </label>

            {isRecurring && (
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Frequência
                    </label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
                    >
                      <option value="monthly">Mensal (Todo mês)</option>
                      <option value="yearly">Anual (Uma vez por ano)</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>

                  {!txToEdit && (
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Projetar com antecedência
                      </label>
                      <select
                        value={recurringAdvanceMonths}
                        onChange={(e) => setRecurringAdvanceMonths(parseInt(e.target.value, 10))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
                      >
                        <option value={1}>Apenas este mês</option>
                        <option value={3}>Próximos 3 meses</option>
                        <option value={6}>Próximos 6 meses</option>
                        <option value={12}>Próximos 12 meses (1 ano)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-neutral-500">
                  {recurrence === 'monthly'
                    ? `Será repetido todo dia ${date.slice(8, 10)} de cada mês.`
                    : recurrence === 'yearly'
                    ? `Será repetido todo ano na mesma data.`
                    : `Será repetido semanalmente.`}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <input
              type="text"
              placeholder="Observações ou notas adicionais (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={closeTxModal}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors shadow-xs"
            >
              {txToEdit ? 'Salvar Alterações' : 'Confirmar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
