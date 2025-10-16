import { useState, type FC } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AuthStatusProps {
  user: {
    id: string;
    email?: string;
  };
}

/**
 * AuthStatus component
 * Displays user info and logout button in the header
 */
const AuthStatus: FC<AuthStatusProps> = ({ user }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const getInitials = (email?: string): string => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        toast.error("Błąd podczas wylogowania");
        return;
      }

      toast.success("Wylogowano pomyślnie");

      // Redirect to login
      window.location.href = "/login";
    } catch {
      toast.error("Wystąpił błąd podczas wylogowania");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {user.email && <span className="hidden text-sm text-muted-foreground md:inline-block">{user.email}</span>}

        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
        </Avatar>

        <Button variant="ghost" size="sm" onClick={() => setShowLogoutDialog(true)} className="gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline-block">Wyloguj</span>
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdzenie wylogowania</DialogTitle>
            <DialogDescription>Czy na pewno chcesz się wylogować?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)} disabled={isLoggingOut}>
              Anuluj
            </Button>
            <Button onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Wylogowywanie...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Wyloguj
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthStatus;
