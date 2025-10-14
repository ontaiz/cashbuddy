import { useState, type FC } from "react";
import type { FilterState, SortState } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterControlsProps {
  filters: FilterState;
  sort: SortState;
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sort: SortState) => void;
}

/**
 * Set of form controls allowing filtering of expense list by date range
 * and sorting by amount or date.
 */
const FilterControls: FC<FilterControlsProps> = ({ filters, sort, onFilterChange, onSortChange }) => {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  /**
   * Parses a date string (YYYY-MM-DD) into a Date object in local timezone
   * to avoid UTC conversion issues
   */
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  /**
   * Formats a Date object to YYYY-MM-DD string in local timezone
   */
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /**
   * Formats date for display
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Wybierz datę";
    const date = parseLocalDate(dateString);
    return new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  /**
   * Converts Date to YYYY-MM-DD string
   */
  const dateToString = (date: Date): string => {
    return formatLocalDate(date);
  };

  /**
   * Handles start date change
   */
  const handleStartDateChange = (date: Date | undefined) => {
    onFilterChange({
      ...filters,
      startDate: date ? dateToString(date) : null,
    });
    setStartDateOpen(false);
  };

  /**
   * Handles end date change
   */
  const handleEndDateChange = (date: Date | undefined) => {
    onFilterChange({
      ...filters,
      endDate: date ? dateToString(date) : null,
    });
    setEndDateOpen(false);
  };

  /**
   * Clears all filters
   */
  const handleClearFilters = () => {
    onFilterChange({
      startDate: null,
      endDate: null,
    });
  };

  /**
   * Toggles sort order
   */
  const handleToggleSortOrder = () => {
    onSortChange({
      ...sort,
      order: sort.order === "asc" ? "desc" : "asc",
    });
  };

  /**
   * Handles sort field change
   */
  const handleSortByChange = (value: string) => {
    onSortChange({
      ...sort,
      sortBy: value as "date" | "amount",
    });
  };

  const hasActiveFilters = filters.startDate || filters.endDate;

  return (
    <div className="mb-6 space-y-4 rounded-lg border bg-card p-4">
      {/* Date Range Filters */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Zakres dat</label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            {/* Start Date */}
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal sm:w-[180px] sm:flex-none",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{formatDate(filters.startDate)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate ? parseLocalDate(filters.startDate) : undefined}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground">-</span>

            {/* End Date */}
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal sm:w-[180px] sm:flex-none",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{formatDate(filters.endDate)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate ? parseLocalDate(filters.endDate) : undefined}
                  onSelect={handleEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="w-full sm:w-auto">
              <X className="mr-1 h-4 w-4" />
              Wyczyść filtry
            </Button>
          )}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Sortowanie</label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Select value={sort.sortBy} onValueChange={handleSortByChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="amount">Kwota</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleSortOrder}
              aria-label={`Sortuj ${sort.order === "asc" ? "malejąco" : "rosnąco"}`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {sort.order === "asc" ? "Rosnąco (od najmniejszej)" : "Malejąco (od największej)"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
