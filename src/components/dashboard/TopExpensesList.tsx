import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { TopExpenseDto } from "@/types";

interface TopExpensesListProps {
	expenses: TopExpenseDto[];
}

/**
 * Displays a list of the top 5 expenses.
 * Shows expense name, amount, and date in a table format.
 */
export function TopExpensesList({ expenses }: TopExpensesListProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Największe wydatki</CardTitle>
			</CardHeader>
			<CardContent>
				{expenses.length === 0 ? (
					<div className="flex h-32 items-center justify-center text-center">
						<p className="text-sm text-muted-foreground">
							Brak wydatków do wyświetlenia
						</p>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nazwa</TableHead>
								<TableHead className="hidden sm:table-cell">Data</TableHead>
								<TableHead className="text-right">Kwota</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{expenses.map((expense) => (
								<TableRow key={expense.id}>
									<TableCell className="font-medium">
										{expense.name}
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										{formatDate(expense.date)}
									</TableCell>
									<TableCell className="text-right font-semibold">
										{formatCurrency(expense.amount)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}

/**
 * Formats a date string to a readable Polish format.
 */
function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat("pl-PL", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
}

/**
 * Formats a number as PLN currency.
 */
function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("pl-PL", {
		style: "currency",
		currency: "PLN",
	}).format(amount);
}

