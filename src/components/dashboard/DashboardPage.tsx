import { DollarSign, TrendingUp } from "lucide-react";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { EmptyState } from "./EmptyState";
import { MonthlyExpensesChart } from "./MonthlyExpensesChart";
import { StatCard } from "./StatCard";
import { TopExpensesList } from "./TopExpensesList";
import { useDashboardData } from "./hooks/useDashboardData";

/**
 * Main Dashboard page component.
 * Manages data fetching and conditionally renders content based on state.
 */
export function DashboardPage() {
  const { data, isLoading, error } = useDashboardData();

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
        <p className="font-semibold">Wystąpił błąd</p>
        <p className="mt-1 text-sm">Nie udało się załadować danych. Spróbuj ponownie później.</p>
      </div>
    );
  }

  // Empty state - no expenses yet
  if (!data || data.total_expenses === 0) {
    return <EmptyState />;
  }

  // Main dashboard content
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Suma wszystkich wydatków"
          value={data.total_expenses}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Wydatki w bieżącym miesiącu"
          value={data.current_month_expenses}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Monthly Expenses Chart */}
      <MonthlyExpensesChart data={data.monthly_summary} />

      {/* Top 5 Expenses List */}
      <TopExpensesList expenses={data.top_5_expenses} />
    </div>
  );
}
