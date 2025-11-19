import { Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/verafact-logo.png";

export const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 md:px-6 py-5 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="VeraFact" className="w-12 h-12 rounded-xl" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            VeraFact
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="lg" onClick={() => navigate("/home")} className="text-base font-medium">
                Discover
              </Button>
              <Button variant="default" size="lg" onClick={() => navigate("/profile")} className="bg-gradient-to-r from-primary to-secondary text-base font-semibold">
                Profile
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="lg" onClick={() => navigate("/login")} className="text-base font-medium">
                Sign In
              </Button>
              <Button variant="default" size="lg" onClick={() => navigate("/register")} className="bg-gradient-to-r from-primary to-secondary text-base font-semibold">
                Sign Up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
