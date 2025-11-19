import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/verafact-logo.png";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (isSignUp && !isPasswordValid) {
      toast.error("Please meet all password requirements");
      return;
    }

    // Simulate authentication
    setTimeout(() => {
      toast.success(isSignUp ? "Account created successfully!" : "Welcome back!");
      navigate("/profile");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-12 max-w-md">
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <img src={logo} alt="VeraFact" className="w-32 h-32 object-contain mx-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-3">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isSignUp 
              ? "Join VeraFact to start verifying news" 
              : "Sign in to access your verification history"}
          </p>
        </div>

        <Card className="p-8 shadow-[var(--shadow-large)] border-2">
          <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
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
                  />
                </div>
              )}

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
                />
              </div>

              {isSignUp && password && (
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
              >
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-base text-primary hover:underline font-medium"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"}
              </button>
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
