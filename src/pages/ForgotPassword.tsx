import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/verafact-logo.png";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      toast.error("An error occurred. Please try again.");
      console.error("Password reset error:", error);
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
            Reset Password
          </h1>
          <p className="text-muted-foreground text-lg">
            {emailSent 
              ? "Check your email for the reset link" 
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        <Card className="p-8 shadow-[var(--shadow-large)] border-2">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-base font-semibold">Email Address</Label>
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

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[var(--shadow-glow)] mt-8"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-muted/50 rounded-xl border text-center">
                <p className="text-base text-muted-foreground">
                  We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
              </div>
              
              <Button 
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full h-12 text-base"
              >
                Send Another Email
              </Button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-base text-primary hover:underline font-medium inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
