import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
	title: string;
	value: number;
	icon?: React.ReactNode;
}

/**
 * Displays a single key metric in a card format.
 * Used for showing aggregated statistics like total expenses or monthly expenses.
 */
export function StatCard({ title, value, icon }: StatCardProps) {
	// Format the value as PLN currency
	const formattedValue = new Intl.NumberFormat("pl-PL", {
		style: "currency",
		currency: "PLN",
	}).format(value);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				{icon && (
					<div className="text-muted-foreground">
						{icon}
					</div>
				)}
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{formattedValue}</div>
			</CardContent>
		</Card>
	);
}

