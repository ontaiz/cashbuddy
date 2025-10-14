import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { MonthlySummaryDto } from "@/types";
import { Line, LineChart, XAxis, YAxis } from "recharts";

interface MonthlyExpensesChartProps {
	data: MonthlySummaryDto[];
}

/**
 * Displays a line chart showing monthly expense totals.
 * Provides interactive tooltips and accessible table alternative.
 */
export function MonthlyExpensesChart({ data }: MonthlyExpensesChartProps) {
	// Transform data for the chart
	const chartData = data.map((item) => ({
		month: formatMonthLabel(item.month),
		total: item.total,
	}));

	// Chart configuration
	const chartConfig = {
		total: {
			label: "Suma wydatków",
			color: "hsl(var(--chart-1))",
		},
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Wydatki według miesięcy</CardTitle>
				<CardDescription>
					Podsumowanie wydatków w ostatnich miesiącach
				</CardDescription>
			</CardHeader>
			<CardContent>
				{data.length === 0 ? (
					<div className="flex h-64 items-center justify-center text-center">
						<p className="text-sm text-muted-foreground">
							Brak danych do wyświetlenia
						</p>
					</div>
				) : (
					<>
						<ChartContainer config={chartConfig} className="h-64 w-full">
							<LineChart
								data={chartData}
								margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
							>
								<XAxis
									dataKey="month"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									tick={{ fontSize: 12 }}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									tick={{ fontSize: 12 }}
									tickFormatter={(value) => `${value} zł`}
								/>
								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent
											formatter={(value) =>
												new Intl.NumberFormat("pl-PL", {
													style: "currency",
													currency: "PLN",
												}).format(value as number)
											}
										/>
									}
								/>
								<Line
									type="linear"
									dataKey="total"
									stroke="#3b82f6"
									strokeWidth={3}
									dot={false}
									activeDot={false}
									isAnimationActive={true}
								/>
							</LineChart>
						</ChartContainer>

						{/* Accessible table alternative (visually hidden) */}
						<table className="sr-only" aria-label="Wydatki według miesięcy">
							<thead>
								<tr>
									<th>Miesiąc</th>
									<th>Suma wydatków</th>
								</tr>
							</thead>
							<tbody>
								{data.map((item) => (
									<tr key={item.month}>
										<td>{formatMonthLabel(item.month)}</td>
										<td>
											{new Intl.NumberFormat("pl-PL", {
												style: "currency",
												currency: "PLN",
											}).format(item.total)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</>
				)}
			</CardContent>
		</Card>
	);
}

/**
 * Formats a month string from "YYYY-MM" to a readable Polish format.
 */
function formatMonthLabel(monthString: string): string {
	const [year, month] = monthString.split("-");
	const date = new Date(Number(year), Number(month) - 1);

	return new Intl.DateTimeFormat("pl-PL", {
		month: "short",
		year: "numeric",
	}).format(date);
}

