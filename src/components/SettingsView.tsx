import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { exportFinanceDataToJSON, exportTransactionsToCSV } from '../utils/exportImport';
import { CurrencyCode, FinanceData } from '../types/finance';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Plus,
  Sun,
  Moon,
  Laptop,
  Check,
  Shield,
  Layers,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    accounts,
    categories,
    transactions,
    goals,
    addCategory,
    deleteCategory,
    resetToDemoData,
    clearAllData,
    importData,
  } = useFinance();

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0284C7');
  const [newCatKakebo, setNewCatKakebo] = useState<'essential' | 'optional' | 'culture' | 'extra'>('essential');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportJSON = () => {
    const fullData: FinanceData = {
      accounts,
      categories,
      transactions,
      goals,
      preferences,
    };
    exportFinanceDataToJSON(fullData);
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(transactions, preferences.currency);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const success = importData(parsed);
        if (success) {
          setImportStatus('Dados importados com sucesso!');
        } else {
          setImportStatus('Erro: O arquivo selecionado não possui a estrutura esperada.');
        }
      } catch {
        setImportStatus('Erro ao ler arquivo JSON.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const budget = parseFloat(newCatBudget.replace(',', '.'));

    addCategory({
      name: newCatName.trim(),
      type: newCatType,
      budgetMonthly: !isNaN(budget) && budget > 0 ? budget : undefined,
      color: newCatColor,
      iconName: 'Tag',
      isKakeboGroup: newCatType === 'expense' ? newCatKakebo : undefined,
    });

    setNewCatName('');
    setNewCatBudget('');
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
          Configurações & Dados
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Preferências de exibição, moedas, categorias customizadas e controle de dados locais
        </p>
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-6">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Aparência e Formatação
        </h2>

        {/* Currency selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="text-xs font-medium text-neutral-900 dark:text-white">
              Moeda Principal
            </div>
            <div className="text-xs text-neutral-500">
              Símbolo monetário usado na formatação de valores
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-mono font-medium">
            {(
              [
                { code: 'BRL', label: 'BRL (R$)' },
                { code: 'USD', label: 'USD ($)' },
                { code: 'EUR', label: 'EUR (€)' },
              ] as { code: CurrencyCode; label: string }[]
            ).map((item) => (
              <button
                key={item.code}
                onClick={() => updatePreferences({ currency: item.code })}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  preferences.currency === item.code
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="text-xs font-medium text-neutral-900 dark:text-white">Tema Visual</div>
            <div className="text-xs text-neutral-500">
              Escolha entre o modo claro, escuro ou automático do sistema
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => updatePreferences({ theme: 'light' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                preferences.theme === 'light'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Claro</span>
            </button>
            <button
              onClick={() => updatePreferences({ theme: 'dark' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                preferences.theme === 'dark'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Escuro</span>
            </button>
            <button
              onClick={() => updatePreferences({ theme: 'system' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                preferences.theme === 'system'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Sistema</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Management */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Gerenciamento de Categorias
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Adicione novas categorias ou exclua categorias existentes
          </p>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg">
          <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Nova Categoria
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Nome da categoria"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
            />

            <select
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as 'expense' | 'income')}
              className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
            >
              <option value="expense">Tipo: Despesa</option>
              <option value="income">Tipo: Receita</option>
            </select>

            {newCatType === 'expense' ? (
              <select
                value={newCatKakebo}
                onChange={(e) => setNewCatKakebo(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
              >
                <option value="essential">Essencial (Sobrevivência)</option>
                <option value="optional">Opcional (Lazer)</option>
                <option value="culture">Cultura & Educação</option>
                <option value="extra">Extras & Imprevistos</option>
              </select>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-10 h-9 p-0.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg cursor-pointer"
                title="Escolha a cor da categoria"
              />
              <button
                type="submit"
                className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-lg transition-colors whitespace-nowrap"
              >
                Adicionar
              </button>
            </div>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
          {categories.map((cat) => (
            <div key={cat.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-medium text-neutral-900 dark:text-white">{cat.name}</span>
                <span className="text-[11px] text-neutral-400">
                  {cat.type === 'income' ? 'Receita' : 'Despesa'}
                </span>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Excluir categoria "${cat.name}"?`)) {
                    deleteCategory(cat.id);
                  }
                }}
                className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 p-1"
                title="Excluir categoria"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Backup, Export & Reset */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-2xs space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Segurança & Portabilidade dos Dados
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Seus dados são salvos de forma 100% privada e local no seu navegador. Exporte backups a qualquer momento.
          </p>
        </div>

        {importStatus && (
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-xs font-medium">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export JSON */}
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white text-xs font-semibold">
              <Download className="w-4 h-4" />
              <span>Exportar Backup Completo (JSON)</span>
            </div>
            <p className="text-xs text-neutral-500">
              Gera um arquivo com todas as contas, transações, orçamentos e metas para restauração futura.
            </p>
            <button
              onClick={handleExportJSON}
              className="w-full py-2 px-3 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors"
            >
              Baixar Arquivo JSON
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white text-xs font-semibold">
              <Upload className="w-4 h-4" />
              <span>Restaurar Backup (JSON)</span>
            </div>
            <p className="text-xs text-neutral-500">
              Carregue um arquivo JSON gerado anteriormente para restaurar todas as informações.
            </p>
            <label className="block w-full text-center py-2 px-3 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer">
              <span>Selecionar Arquivo</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Export CSV */}
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white text-xs font-semibold">
              <Download className="w-4 h-4" />
              <span>Exportar Planilha (CSV)</span>
            </div>
            <p className="text-xs text-neutral-500">
              Exporte todos os lançamentos em formato CSV compatível com Excel e Google Planilhas.
            </p>
            <button
              onClick={handleExportCSV}
              className="w-full py-2 px-3 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors"
            >
              Baixar CSV
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white text-xs font-semibold">
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Dados de Exemplo</span>
            </div>
            <p className="text-xs text-neutral-500">
              Recarrega o conjunto de dados realistas de demonstração para testar todas as funcionalidades.
            </p>
            <button
              onClick={() => {
                if (confirm('Deseja recarregar os dados de demonstração? Isso substituirá os lançamentos atuais.')) {
                  resetToDemoData();
                }
              }}
              className="w-full py-2 px-3 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors"
            >
              Recarregar Demonstração
            </button>
          </div>
        </div>

        {/* Danger zone: Clear data */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Zerar Todos os Dados
            </div>
            <div className="text-xs text-neutral-500">
              Remove todos os lançamentos, contas e metas do armazenamento local.
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Atenção: Deseja apagar TODOS os seus lançamentos e começar do zero? Esta ação é irreversível.')) {
                clearAllData();
              }
            }}
            className="px-3.5 py-2 text-xs font-medium text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors shrink-0"
          >
            Apagar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};
