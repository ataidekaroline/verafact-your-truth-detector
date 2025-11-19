import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/verafact-logo.png";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (!username || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setEmailExists(false);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
          }
        }
      });

      if (error) {
        // Check if error is about user already registered
        if (error.message.toLowerCase().includes("already") || 
            error.message.toLowerCase().includes("registered") ||
            error.status === 422) {
          setEmailExists(true);
          return;
        }
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success("Account created successfully! Please sign in.");
        navigate("/login");
      }
    } catch (error: any) {
      toast.error("An error occurred during registration");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-12 max-w-md">
        <div className="text-center mb-10">
          <img src={logo} alt="VeraFact" className="w-24 h-24 rounded-2xl mx-auto mb-6 shadow-[var(--shadow-large)]" />
          <h1 className="text-4xl font-bold mb-3">
            Create Account
          </h1>
          <p className="text-muted-foreground text-lg">
            Join VeraFact to start verifying news
          </p>
        </div>

        <Card className="p-8 shadow-[var(--shadow-large)] border-2">
          {emailExists && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-base">
                <p className="font-semibold text-destructive mb-3">This email is already registered</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    Go to Login
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/forgot-password")}
                    className="flex-1"
                  >
                    Recover Password
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-base font-semibold">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 text-base"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-base font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[var(--shadow-glow)] mt-8"
              disabled={isLoading || (password && !isPasswordValid)}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-base text-primary hover:underline font-medium"
            >
              Already have an account? Sign in
            </Link>
          </div>
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
