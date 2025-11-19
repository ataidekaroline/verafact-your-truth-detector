import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/verafact-logo.png";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address is required");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Verification email resent! Check your inbox.");
    } catch (error: any) {
      toast.error("Failed to resend verification email");
      console.error("Resend error:", error);
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
            Verify Your Email
          </h1>
          <p className="text-muted-foreground text-lg">
            Check your inbox to complete registration
          </p>
        </div>

        <Card className="p-8 shadow-[var(--shadow-large)] border-2">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-primary" />
            </div>
          </div>

          <Alert className="border-primary/50 bg-primary/10 mb-6">
            <AlertCircle className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              <p className="font-semibold text-foreground mb-2">Verification Required</p>
              {email && (
                <p className="text-muted-foreground mb-3">
                  We've sent a confirmation email to <span className="font-semibold text-foreground">{email}</span>
                </p>
              )}
              <p className="text-muted-foreground">
                Click the verification link in the email to activate your VeraFact account. 
                You won't be able to sign in until you verify your email address.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendVerification}
              disabled={isLoading || !email}
              className="w-full h-12 text-base"
            >
              {isLoading ? "Resending..." : "Resend Verification Email"}
            </Button>

            <Button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[var(--shadow-glow)]"
            >
              Go to Login
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Check your spam folder if you don't see the email within a few minutes.
          </p>
        </Card>
      </main>
    </div>
  );
}
