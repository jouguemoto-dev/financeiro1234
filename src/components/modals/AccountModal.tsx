import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AccountType } from '../../types/finance';
import { X } from 'lucide-react';

const COLORS = [
  '#0284C7', // Blue
  '#8A05BE', // Purple Nubank
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#64748B', // Slate
  '#1E1B4B', // Dark Navy
];

export const AccountModal: React.FC = () => {
  const {
    isAccountModalOpen,
    closeAccountModal,
    accountToEdit,
    preferences,
    addAccount,
    updateAccount,
  } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#0284C7');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('28');
  const [dueDay, setDueDay] = useState('5');

  useEffect(() => {
    if (!isAccountModalOpen) return;

    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setInitialBalance(accountToEdit.initialBalance.toString());
      setColor(accountToEdit.color || '#0284C7');
      setCreditLimit(accountToEdit.creditLimit ? accountToEdit.creditLimit.toString() : '');
      setClosingDay(accountToEdit.closingDay ? accountToEdit.closingDay.toString() : '28');
      setDueDay(accountToEdit.dueDay ? accountToEdit.dueDay.toString() : '5');
    } else {
      setName('');
      setType('checking');
      setInitialBalance('0');
      setColor('#0284C7');
      setCreditLimit('5000');
      setClosingDay('28');
      setDueDay('5');
    }
  }, [isAccountModalOpen, accountToEdit]);

  if (!isAccountModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedBalance = parseFloat(initialBalance.replace(',', '.')) || 0;
    const parsedLimit = parseFloat(creditLimit.replace(',', '.')) || 0;

    let iconName = 'Building2';
    if (type === 'credit') iconName = 'CreditCard';
    else if (type === 'investment') iconName = 'TrendingUp';
    else if (type === 'savings') iconName = 'ShieldCheck';
    else if (type === 'cash') iconName = 'Wallet';

    if (accountToEdit) {
      updateAccount({
        ...accountToEdit,
        name: name.trim(),
        type,
        initialBalance: type === 'credit' ? 0 : parsedBalance,
        color,
        iconName,
        creditLimit: type === 'credit' ? parsedLimit : undefined,
        closingDay: type === 'credit' ? parseInt(closingDay, 10) || 28 : undefined,
        dueDay: type === 'credit' ? parseInt(dueDay, 10) || 5 : undefined,
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        initialBalance: type === 'credit' ? 0 : parsedBalance,
        color,
        iconName,
        creditLimit: type === 'credit' ? parsedLimit : undefined,
        closingDay: type === 'credit' ? parseInt(closingDay, 10) || 28 : undefined,
        dueDay: type === 'credit' ? parseInt(dueDay, 10) || 5 : undefined,
      });
    }

    closeAccountModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {accountToEdit ? 'Editar Conta / Cartão' : 'Nova Conta ou Cartão'}
          </h2>
          <button
            onClick={closeAccountModal}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nome da Conta / Cartão
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Nubank Principal, Itaú, Carteira, XP..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Tipo de Conta
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="checking">Conta Corrente</option>
              <option value="credit">Cartão de Crédito</option>
              <option value="savings">Poupança / Reserva de Emergência</option>
              <option value="investment">Investimentos (Corretora)</option>
              <option value="cash">Dinheiro Físico / Carteira</option>
            </select>
          </div>

          {type !== 'credit' ? (
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Saldo Inicial ({preferences.currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Limite Total do Cartão ({preferences.currency})
                </label>
                <input
                  type="number"
                  step="100"
                  required
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-0.5">
                    Dia de Fechamento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-0.5">
                    Dia de Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Color palette */}
          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-neutral-900 dark:ring-white ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={closeAccountModal}
              className="px-4 py-2 font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {accountToEdit ? 'Salvar' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
