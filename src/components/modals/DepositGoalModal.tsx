import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { X, Plus, PiggyBank } from 'lucide-react';

export const DepositGoalModal: React.FC = () => {
  const {
    isDepositModalOpen,
    closeDepositModal,
    goalForDeposit,
    accounts,
    preferences,
    depositToGoal,
    getGoalCurrentAmount,
  } = useFinance();

  const [amount, setAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState(() => {
    const checking = accounts.find((a) => a.type === 'checking');
    return checking ? checking.id : '';
  });

  if (!isDepositModalOpen || !goalForDeposit) return null;

  const currentVal = getGoalCurrentAmount(goalForDeposit);
  const remaining = Math.max(0, goalForDeposit.targetAmount - currentVal);
  const linkedAccount = goalForDeposit.linkedAccountId === 'all_savings'
    ? { name: 'Todas as Contas de Poupança' }
    : accounts.find((a) => a.id === goalForDeposit.linkedAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      alert('Informe um valor de aporte válido.');
      return;
    }

    depositToGoal(goalForDeposit.id, parsed, sourceAccountId || undefined);
    setAmount('');
    closeDepositModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <PiggyBank className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Aporte para Meta de Economia
            </h2>
          </div>
          <button
            onClick={closeDepositModal}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <div className="text-neutral-500">Destino do Aporte:</div>
            <div className="font-semibold text-neutral-900 dark:text-white text-sm mt-0.5">
              {goalForDeposit.name}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
              Saldo atual: {formatCurrency(currentVal, preferences.currency, preferences.hideValues)} · Faltam {formatCurrency(remaining, preferences.currency, preferences.hideValues)}
            </div>
            {linkedAccount && (
              <div className="mt-2 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-lg text-[11px] text-sky-700 dark:text-sky-300">
                🏦 Vinculada a: <strong>{linkedAccount.name}</strong>. Ao debitar de outra conta, será realizada uma transferência para sua conta poupança.
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Valor do Aporte ({preferences.currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-lg font-mono font-semibold bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Debitar de uma Conta (Opcional)
            </label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="">Não debitar de nenhuma conta (Apenas atualizar meta)</option>
              {accounts
                .filter((a) => a.type !== 'credit')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    Debitar de {a.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={closeDepositModal}
              className="px-4 py-2 font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors shadow-xs"
            >
              Confirmar Aporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
