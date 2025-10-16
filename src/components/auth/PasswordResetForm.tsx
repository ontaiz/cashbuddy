import { useState, type FC, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
}

/**
 * Password reset form component
 * Renders a form for initiating password reset via email
 */
const PasswordResetForm: FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Błąd wysyłania linku resetującego");
        return;
      }

      toast.success("Link do resetowania hasła został wysłany!");
      setIsSuccess(true);
    } catch {
      toast.error("Wystąpił błąd podczas resetowania hasła");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles input changes
   */
  const handleChange = (value: string) => {
    setFormData({ email: value });
    // Clear error when user starts typing
    if (errors.email) {
      setErrors({});
    }
  };

  const isFormValid = formData.email.trim();

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sprawdź swoją skrzynkę</CardTitle>
          <CardDescription>Link do resetowania hasła został wysłany</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Wysłaliśmy link do resetowania hasła na adres{" "}
              <span className="font-medium text-foreground">{formData.email}</span>. Kliknij w link, aby ustawić nowe
              hasło.
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center">Jeśli nie widzisz wiadomości, sprawdź folder spam</p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild variant="outline" className="w-full">
            <a href="/login">Powrót do logowania</a>
          </Button>
          <Button variant="ghost" onClick={() => setIsSuccess(false)} className="w-full">
            Wyślij ponownie
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold" data-testid="password-reset-title">
          Resetuj hasło
        </CardTitle>
        <CardDescription>Wprowadź swój adres e-mail, a wyślemy Ci link do resetowania hasła</CardDescription>
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
              onChange={(e) => handleChange(e.target.value)}
              placeholder="twoj@email.pl"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="email"
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" disabled={!isFormValid || isSubmitting} className="w-full" size="lg">
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Wyślij link resetujący
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Pamiętasz hasło?{" "}
            <a href="/login" className="font-medium text-foreground hover:underline">
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PasswordResetForm;
