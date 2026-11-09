import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatMonthYear, getCurrentYearMonth } from '../../utils/formatters';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const MonthSelector: React.FC = () => {
  const { selectedMonth, prevMonth, nextMonth, goToCurrentMonth } = useFinance();
  const isCurrentMonth = selectedMonth === getCurrentYearMonth();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5 shadow-2xs">
        <button
          onClick={prevMonth}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md transition-colors"
          title="Mês anterior"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 whitespace-nowrap min-w-[130px] sm:min-w-[160px] text-center">
          {formatMonthYear(selectedMonth)}
        </span>

        <button
          onClick={nextMonth}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md transition-colors"
          title="Próximo mês"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          onClick={goToCurrentMonth}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Mês Atual</span>
        </button>
      )}
    </div>
  );
};
