import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { X, PiggyBank, Link2 } from 'lucide-react';

const COLORS = [
  '#0284C7',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#6366F1',
];

export const GoalModal: React.FC = () => {
  const {
    isGoalModalOpen,
    closeGoalModal,
    goalToEdit,
    preferences,
    accounts,
    getAccountBalance,
    totalSavingsBalance,
    addGoal,
    updateGoal,
  } = useFinance();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Reserva & Sonhos');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#0284C7');
  const [linkedAccountId, setLinkedAccountId] = useState('');

  useEffect(() => {
    if (!isGoalModalOpen) return;

    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmount(goalToEdit.targetAmount.toString());
      setCurrentAmount(goalToEdit.currentAmount.toString());
      setDeadline(goalToEdit.deadline || '');
      setCategory(goalToEdit.category || 'Reserva & Sonhos');
      setNotes(goalToEdit.notes || '');
      setColor(goalToEdit.color || '#0284C7');
      setLinkedAccountId(goalToEdit.linkedAccountId || '');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline('');
      setCategory('Reserva & Sonhos');
      setNotes('');
      setColor('#0284C7');
      // Default to first savings account if available
      const firstSavings = accounts.find((a) => a.type === 'savings');
      setLinkedAccountId(firstSavings ? firstSavings.id : '');
    }
  }, [isGoalModalOpen, goalToEdit, accounts]);

  if (!isGoalModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedTarget = parseFloat(targetAmount.replace(',', '.'));
    const parsedCurrent = parseFloat(currentAmount.replace(',', '.')) || 0;

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      alert('Informe um valor alvo válido maior que zero.');
      return;
    }

    if (goalToEdit) {
      updateGoal({
        ...goalToEdit,
        name: name.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline,
        category: category.trim(),
        notes: notes.trim() || undefined,
        color,
        linkedAccountId: linkedAccountId || undefined,
      });
    } else {
      addGoal({
        name: name.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline,
        category: category.trim(),
        notes: notes.trim() || undefined,
        color,
        linkedAccountId: linkedAccountId || undefined,
      });
    }

    closeGoalModal();
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
            {goalToEdit ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
          </h2>
          <button
            onClick={closeGoalModal}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nome da Meta
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Reserva de Emergência, Viagem de Férias, Carro..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Valor Alvo ({preferences.currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="R$ 10.000,00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Já Acumulado ({preferences.currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                disabled={Boolean(linkedAccountId)}
                title={linkedAccountId ? 'Sincronizado automaticamente com o saldo da conta vinculada' : undefined}
                className={`w-full px-3 py-2 font-mono border rounded-xl text-neutral-900 dark:text-white focus:outline-none ${
                  linkedAccountId
                    ? 'bg-neutral-100 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                }`}
              />
            </div>
          </div>

          {/* Vincular ao Saldo de Conta de Poupança / Reserva */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-medium">
              <PiggyBank className="w-3.5 h-3.5 text-sky-500" />
              <span>Vincular a uma Conta de Poupança / Reserva</span>
            </div>
            <select
              value={linkedAccountId}
              onChange={(e) => {
                const val = e.target.value;
                setLinkedAccountId(val);
                if (val === 'all_savings') {
                  setCurrentAmount(totalSavingsBalance.toString());
                } else if (val) {
                  setCurrentAmount(getAccountBalance(val).toString());
                }
              }}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="">Nenhuma conta vinculada (saldo manual da meta)</option>
              <option value="all_savings">
                ✨ Todas as Contas de Poupança / Reservas (Saldo: {formatCurrency(totalSavingsBalance, preferences.currency, false)})
              </option>
              {accounts
                .filter((a) => a.type === 'savings' || a.type === 'investment')
                .map((a) => {
                  const bal = getAccountBalance(a.id);
                  return (
                    <option key={a.id} value={a.id}>
                      {a.type === 'savings' ? '🏦 [Poupança] ' : '📈 [Investimento] '}
                      {a.name} — Saldo: {formatCurrency(bal, preferences.currency, false)}
                    </option>
                  );
                })}
            </select>
            {linkedAccountId && (
              <p className="text-[11px] text-sky-600 dark:text-sky-400">
                O progresso da meta e a barra de progresso no Dashboard acompanharão o saldo real desta conta automaticamente.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Prazo Estimado
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Categoria da Meta
              </label>
              <input
                type="text"
                placeholder="Ex: Sonhos, Segurança"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Estratégia ou Notas
            </label>
            <input
              type="text"
              placeholder="Ex: Investido no Tesouro Selic com liquidez imediata..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Cor de Identificação
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
              onClick={closeGoalModal}
              className="px-4 py-2 font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {goalToEdit ? 'Salvar' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
