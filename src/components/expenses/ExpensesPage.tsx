import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useExpenses } from './hooks/useExpenses';
import FilterControls from './FilterControls';
import ExpensesDataTable from './ExpensesDataTable';
import Pagination from './Pagination';
import ExpenseFormModal from './ExpenseFormModal';
import ConfirmationDialog from './ConfirmationDialog';
import type { ExpenseDto, CreateExpenseCommand, UpdateExpenseCommand } from '@/types';

/**
 * Main container component for the expenses view.
 * Responsible for state management (via useExpenses hook), fetching data from API,
 * and rendering child components.
 */
const ExpensesPage: FC = () => {
  const {
    data,
    filters,
    sort,
    page,
    isLoading,
    error,
    setFilters,
    setSort,
    setPage,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses();

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDto | undefined>(undefined);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Handlers for opening modals
  const handleAddClick = () => {
    setEditingExpense(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (expense: ExpenseDto) => {
    setEditingExpense(expense);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setIsDeleteDialogOpen(true);
  };

  // CRUD operations
  const handleSaveExpense = async (data: CreateExpenseCommand | UpdateExpenseCommand) => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, data as UpdateExpenseCommand);
        toast.success('Wydatek został zaktualizowany');
      } else {
        await addExpense(data as CreateExpenseCommand);
        toast.success('Wydatek został dodany');
      }
      setIsFormModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd';
      toast.error('Nie udało się zapisać wydatku', {
        description: errorMessage,
      });
      throw err; // Re-throw to keep modal open
    }
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await deleteExpense(expenseToDelete);
      toast.success('Wydatek został usunięty');
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd';
      toast.error('Nie udało się usunąć wydatku', {
        description: errorMessage,
      });
    }
  };

  const handleSort = (sortBy: 'date' | 'amount') => {
    setSort({
      sortBy,
      order: sort.sortBy === sortBy && sort.order === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <main className="container mx-auto min-h-screen py-6 px-4 sm:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wydatki</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zarządzaj swoimi codziennymi wydatkami
          </p>
        </div>
        <Button onClick={handleAddClick} size="lg" className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj wydatek
        </Button>
      </div>

      {/* Filters and sorting */}
      <FilterControls
        filters={filters}
        sort={sort}
        onFilterChange={setFilters}
        onSortChange={setSort}
      />

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive"
        >
          <p className="font-semibold">Wystąpił błąd</p>
          <p className="mt-1 text-sm">{error.message}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16" role="status">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Ładowanie wydatków...</p>
          <span className="sr-only">Ładowanie wydatków</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && data && data.data.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold">Brak wydatków</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Rozpocznij śledzenie swoich wydatków, dodając pierwszy wpis.
          </p>
          <Button onClick={handleAddClick} className="mt-6" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Dodaj pierwszy wydatek
          </Button>
        </div>
      )}

      {/* Data table */}
      {!isLoading && data && data.data.length > 0 && (
        <>
          <ExpensesDataTable
            expenses={data.data}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onSort={handleSort}
          />

          {/* Pagination */}
          <Pagination pagination={data.pagination} onPageChange={setPage} />
        </>
      )}

      {/* Modals */}
      <ExpenseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveExpense}
        initialData={editingExpense}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Usuń wydatek"
        description="Czy na pewno chcesz usunąć ten wydatek? Ta operacja jest nieodwracalna."
      />
    </main>
  );
};

export default ExpensesPage;

