import { useState, type FC, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Registration form component
 * Renders a form for creating a new user account
 */
const RegisterForm: FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Validates form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Adres e-mail jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Wprowadź poprawny adres e-mail";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Hasło jest wymagane";
    } else if (formData.password.length < 8) {
      newErrors.password = "Hasło musi mieć co najmniej 8 znaków";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Hasło musi zawierać małą literę, wielką literę i cyfrę";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Hasła nie są identyczne";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Błąd rejestracji");
        return;
      }

      toast.success("Rejestracja zakończona pomyślnie!");
      setIsSuccess(true);
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Wystąpił błąd podczas rejestracji");
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

  const isFormValid = formData.email.trim() && formData.password && formData.confirmPassword;

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sprawdź swoją skrzynkę</CardTitle>
          <CardDescription>Rejestracja zakończona pomyślnie!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Wysłaliśmy link weryfikacyjny na adres{" "}
              <span className="font-medium text-foreground">{formData.email}</span>. Kliknij w link, aby potwierdzić
              swoje konto i rozpocząć korzystanie z CashBuddy.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <a href="/login">Przejdź do logowania</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold" data-testid="register-title">
          Utwórz konto
        </CardTitle>
        <CardDescription>Wprowadź swoje dane, aby założyć nowe konto</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Adres e-mail <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="twoj@email.pl"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="email"
              data-testid="register-email-input"
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Hasło <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              autoComplete="new-password"
              data-testid="register-password-input"
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
            {!errors.password && (
              <p className="text-xs text-muted-foreground">
                Minimum 8 znaków, w tym wielka litera, mała litera i cyfra
              </p>
            )}
          </div>

          {/* Confirm password field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Potwierdź hasło <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              autoComplete="new-password"
              data-testid="register-confirm-password-input"
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full"
            size="lg"
            data-testid="register-submit-button"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Tworzenie konta...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Zarejestruj się
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Masz już konto?{" "}
            <a href="/login" className="font-medium text-foreground hover:underline">
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RegisterForm;
