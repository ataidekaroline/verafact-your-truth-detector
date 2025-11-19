import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/verafact-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle specific error messages
        if (error.message.toLowerCase().includes("email not confirmed")) {
          toast.error("Please verify your email before signing in. Check your inbox for the verification link.");
          return;
        }
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success("Welcome back!");
        navigate("/profile");
      }
    } catch (error: any) {
      toast.error("An error occurred during login");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8 safe-bottom">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 max-w-md">
        <div className="text-center mb-8 sm:mb-10">
          <img src={logo} alt="VeraFact" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl mx-auto mb-4 sm:mb-6 shadow-[var(--shadow-large)]" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Sign in to access your verification history
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-[var(--shadow-large)] border-2">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="email" className="text-sm sm:text-base font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 sm:h-12 text-sm sm:text-base touch-manipulation"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="password" className="text-sm sm:text-base font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 sm:h-12 text-sm sm:text-base touch-manipulation"
                disabled={isLoading}
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[var(--shadow-glow)] mt-6 sm:mt-8 touch-manipulation"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <Link
              to="/register"
              className="text-base text-primary hover:underline font-medium"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
