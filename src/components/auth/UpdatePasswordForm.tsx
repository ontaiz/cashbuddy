import { useState, useEffect, type FC, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/db/supabase.browser";

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

/**
 * Update password form component
 * Renders a form for setting a new password after clicking reset link
 */
const UpdatePasswordForm: FC = () => {
  const [formData, setFormData] = useState<FormData>({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  /**
   * Check if user has valid session from password reset token
   * Supabase sends a 'code' parameter in the URL that needs to be exchanged for a session
   */
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createSupabaseBrowserClient();
      
      // Check if there's a code in the URL (from email link)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          toast.error("Link resetowania hasła wygasł lub jest nieprawidłowy");
          setTimeout(() => {
            window.location.href = "/password-reset";
          }, 2000);
          setIsCheckingSession(false);
          return;
        }
      }
      
      // Now check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      } else {
        toast.error("Link resetowania hasła wygasł lub jest nieprawidłowy");
        setTimeout(() => {
          window.location.href = "/password-reset";
        }, 2000);
      }
      
      setIsCheckingSession(false);
    };

    checkSession();
  }, []);

  /**
   * Validates form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Błąd aktualizacji hasła");
        return;
      }

      toast.success("Hasło zostało zaktualizowane!");
      setIsSuccess(true);
    } catch (error) {
      console.error("Password update failed:", error);
      toast.error("Wystąpił błąd podczas aktualizacji hasła");
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

  const isFormValid = formData.password && formData.confirmPassword;

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sprawdzanie linku...</CardTitle>
          <CardDescription>Proszę czekać</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  // Don't render form if session is invalid
  if (!isValidSession) {
    return null;
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Hasło zostało zmienione</CardTitle>
          <CardDescription className="text-center">Twoje hasło zostało pomyślnie zaktualizowane</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground text-center">
              Możesz teraz zalogować się używając nowego hasła
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" size="lg">
            <a href="/login">Przejdź do logowania</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź i potwierdź swoje nowe hasło</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Password field */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Nowe hasło <span className="text-destructive">*</span>
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
              autoFocus
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
              Potwierdź nowe hasło <span className="text-destructive">*</span>
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
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" disabled={!isFormValid || isSubmitting} className="w-full" size="lg">
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Ustaw nowe hasło
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default UpdatePasswordForm;
