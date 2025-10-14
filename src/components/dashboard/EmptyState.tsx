import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/**
 * Empty state component displayed when user has no expenses yet.
 * Encourages the user to add their first expense.
 */
export function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<Plus className="h-6 w-6 text-muted-foreground" />
			</div>
			<p className="mt-4 text-lg font-semibold">Brak wydatków</p>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground">
				Nie dodałeś jeszcze żadnych wydatków. Zacznij śledzić swoje
				finanse, dodając pierwszy wpis.
			</p>
			<Button asChild className="mt-6" size="lg">
				<a href="/expenses">
					<Plus className="mr-2 h-4 w-4" />
					Dodaj pierwszy wydatek
				</a>
			</Button>
		</div>
	);
}

