import type { FC } from "react";
import type { ExpenseDto } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowUpDown, Calendar, DollarSign } from "lucide-react";

interface ExpensesDataTableProps {
  expenses: ExpenseDto[];
  onEdit: (expense: ExpenseDto) => void;
  onDelete: (expenseId: string) => void;
  onSort: (sortBy: "date" | "amount") => void;
  'data-testid'?: string;
}

/**
 * Component displaying expenses in table format.
 * Table columns are interactive and allow sorting.
 */
const ExpensesDataTable: FC<ExpensesDataTableProps> = ({ expenses, onEdit, onDelete, onSort, 'data-testid': testId = 'expenses-table' }) => {
  /**
   * Formats amount to PLN currency format
   */
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(amount);
  };

  /**
   * Formats date to Polish locale
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden rounded-md border md:block" data-testid={testId}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nazwa</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 px-0 hover:bg-transparent"
                  onClick={() => onSort("amount")}
                >
                  Kwota
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 px-0 hover:bg-transparent"
                  onClick={() => onSort("date")}
                >
                  Data
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Opis</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id} data-testid={`expense-row-${expense.id}`}>
                <TableCell className="font-medium">{expense.name}</TableCell>
                <TableCell className="font-semibold">{formatAmount(expense.amount)}</TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell className="max-w-[300px] truncate text-muted-foreground">
                  {expense.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(expense)} aria-label="Edytuj wydatek">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(expense.id)}
                      aria-label="Usuń wydatek"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden" data-testid={testId}>
        {expenses.map((expense) => (
          <Card key={expense.id} data-testid={`expense-card-${expense.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold leading-none">{expense.name}</h3>
                  <p className="mt-2 text-2xl font-bold text-primary">{formatAmount(expense.amount)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(expense)} aria-label="Edytuj wydatek">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(expense.id)}
                    aria-label="Usuń wydatek"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(expense.date)}</span>
                </div>
                {expense.description && <p className="text-muted-foreground">{expense.description}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default ExpensesDataTable;
