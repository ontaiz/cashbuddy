import { useState, type FC, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Login form component
 * Renders a form for user authentication with email and password
 */
const LoginForm: FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string>("");

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
    setGeneralError("");

    try {
      const response = await fetch("/api/auth/login", {
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
        const errorMessage = data.error || "Błąd logowania";
        setGeneralError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success("Zalogowano pomyślnie!");

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = "Wystąpił błąd podczas logowania";
      setGeneralError(errorMessage);
      toast.error(errorMessage);
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
    // Clear general error when user starts typing
    if (generalError) {
      setGeneralError("");
    }
  };

  const isFormValid = formData.email.trim() && formData.password;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold" data-testid="login-title">
          Zaloguj się
        </CardTitle>
        <CardDescription>Wprowadź swoje dane, aby uzyskać dostęp do swojego konta</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* General error message */}
          {generalError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive" data-testid="error-message">
              <p className="text-sm text-destructive">{generalError}</p>
            </div>
          )}

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
              data-testid="login-email-input"
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
              autoComplete="current-password"
              data-testid="login-password-input"
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          {/* Forgot password link */}
          <div className="text-right">
            <a href="/password-reset" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Zapomniałeś hasła?
            </a>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full"
            size="lg"
            data-testid="login-submit-button"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Logowanie...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Zaloguj się
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Nie masz konta?{" "}
            <a href="/register" className="font-medium text-foreground hover:underline">
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
