import { useState, useEffect, type FC } from "react";
import type { ExpenseDto, CreateExpenseCommand, UpdateExpenseCommand } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateExpenseCommand | UpdateExpenseCommand) => Promise<void>;
  initialData?: ExpenseDto;
}

interface FormData {
  name: string;
  amount: string;
  date: string;
  description: string;
}

interface FormErrors {
  name?: string;
  amount?: string;
  date?: string;
}

/**
 * Helper function to format a Date object to YYYY-MM-DD string in local timezone
 */
const formatDateToLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Modal (dialog) containing form for adding or editing an expense.
 */
const ExpenseFormModal: FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const isEditMode = !!initialData;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    amount: "",
    date: formatDateToLocalString(new Date()),
    description: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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
   * Reset form when modal opens/closes or initialData changes
   */
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          amount: initialData.amount.toString(),
          date: initialData.date.split("T")[0], // Extract YYYY-MM-DD from ISO datetime
          description: initialData.description || "",
        });
      } else {
        setFormData({
          name: "",
          amount: "",
          date: formatDateToLocalString(new Date()),
          description: "",
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  /**
   * Validates form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Nazwa jest wymagana";
    }

    // Amount validation
    if (!formData.amount.trim()) {
      newErrors.amount = "Kwota jest wymagana";
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) {
        newErrors.amount = "Kwota musi być liczbą";
      } else if (amount <= 0) {
        newErrors.amount = "Kwota musi być większa od 0";
      }
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = "Data jest wymagana";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert date from YYYY-MM-DD to ISO 8601 datetime string
      // Parse in local timezone and set to noon to avoid timezone issues
      const dateTime = parseLocalDate(formData.date);
      dateTime.setHours(12, 0, 0, 0);

      const data: CreateExpenseCommand | UpdateExpenseCommand = {
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        date: dateTime.toISOString(),
        description: formData.description.trim() || undefined,
      };

      await onSave(data);
      // onClose will be called by parent on success
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles input changes
   */
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handles date selection
   */
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      handleChange("date", formatLocalDate(date));
      setDatePickerOpen(false);
    }
  };

  /**
   * Formats date for display
   */
  const formatDate = (dateString: string): string => {
    const date = parseLocalDate(dateString);
    return new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const isFormValid = formData.name.trim() && formData.amount.trim() && formData.date;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} data-testid="expense-form-modal">
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => {
          // Don't close dialog when clicking on calendar popover
          if (datePickerOpen) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edytuj wydatek" : "Dodaj wydatek"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Wprowadź zmiany i kliknij zapisz."
              : "Wypełnij formularz i kliknij zapisz, aby dodać nowy wydatek."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name field */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nazwa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="np. Zakupy spożywcze"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                data-testid="expense-name-input"
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Amount field */}
            <div className="grid gap-2">
              <Label htmlFor="amount">
                Kwota (PLN) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="0.00"
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? "amount-error" : undefined}
                data-testid="expense-amount-input"
              />
              {errors.amount && (
                <p id="amount-error" className="text-sm text-destructive">
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Date field */}
            <div className="grid gap-2">
              <Label htmlFor="date">
                Data <span className="text-destructive">*</span>
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !formData.date && "text-muted-foreground")}
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "date-error" : undefined}
                    data-testid="expense-date-picker"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? formatDate(formData.date) : "Wybierz datę"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date ? parseLocalDate(formData.date) : undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p id="date-error" className="text-sm text-destructive">
                  {errors.date}
                </p>
              )}
            </div>

            {/* Description field */}
            <div className="grid gap-2">
              <Label htmlFor="description">Opis (opcjonalnie)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Dodatkowe informacje o wydatku..."
                rows={3}
                data-testid="expense-description-input"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
              data-testid="expense-form-cancel-button"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full sm:w-auto"
              data-testid="expense-form-save-button"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseFormModal;
