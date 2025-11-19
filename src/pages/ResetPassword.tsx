import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/verafact-logo.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();

  // Password validation rules
  const passwordRules = {
    minLength: password.length >= 8,
    maxLength: password.length <= 10,
    hasUppercase: /[A-Z]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    // Check if user came from password reset email
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isValidSession) {
      toast.error("Invalid or expired reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully!");
      navigate("/login");
    } catch (error: any) {
      toast.error("An error occurred. Please try again.");
      console.error("Password update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <Header />
        
        <main className="container mx-auto px-4 pt-32 pb-12 max-w-md">
          <div className="text-center mb-10">
            <img src={logo} alt="VeraFact" className="w-24 h-24 rounded-2xl mx-auto mb-6 shadow-[var(--shadow-large)]" />
            <h1 className="text-4xl font-bold mb-3">
              Invalid Reset Link
            </h1>
            <p className="text-muted-foreground text-lg">
              This password reset link is invalid or has expired
            </p>
          </div>

          <Card className="p-8 shadow-[var(--shadow-large)] border-2 text-center">
            <p className="text-base text-muted-foreground mb-6">
              Please request a new password reset link to continue.
            </p>
            <Button 
              onClick={() => navigate("/forgot-password")}
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[var(--shadow-glow)]"
            >
              Request New Link
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-12 max-w-md">
        <div className="text-center mb-10">
          <img src={logo} alt="VeraFact" className="w-24 h-24 rounded-2xl mx-auto mb-6 shadow-[var(--shadow-large)]" />
          <h1 className="text-4xl font-bold mb-3">
            Set New Password
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose a strong password for your account
          </p>
        </div>

        <Card className="p-8 shadow-[var(--shadow-large)] border-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="password" className="text-base font-semibold">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-base font-semibold">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 text-base"
                disabled={isLoading}
              />
            </div>

            {password && (
              <div className="space-y-3 p-5 bg-muted/50 rounded-xl border">
                <p className="text-base font-semibold mb-3">Password Requirements:</p>
                <div className="space-y-2.5 text-sm">
                  <ValidationItem valid={passwordRules.minLength} text="Minimum 8 characters" />
                  <ValidationItem valid={passwordRules.maxLength} text="Maximum 10 characters" />
                  <ValidationItem valid={passwordRules.hasUppercase} text="At least 1 uppercase letter" />
                  <ValidationItem valid={passwordRules.hasSpecial} text="At least 1 special character" />
                  <ValidationItem valid={passwordRules.hasNumber} text="At least 1 number" />
                  {confirmPassword && (
                    <ValidationItem valid={passwordsMatch} text="Passwords match" />
                  )}
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[var(--shadow-glow)] mt-8"
              disabled={isLoading || (password && !isPasswordValid) || (confirmPassword && !passwordsMatch)}
            >
              {isLoading ? "Updating password..." : "Update Password"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}

const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
  <div className="flex items-center gap-3">
    <div className={`p-1 rounded-full ${valid ? 'bg-success/20' : 'bg-muted'}`}>
      {valid ? (
        <Check className="w-4 h-4 text-success" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
    <span className={`text-base ${valid ? "text-success font-medium" : "text-muted-foreground"}`}>{text}</span>
  </div>
);
