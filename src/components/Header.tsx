import { Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/verafact-logo.png";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="VeraFact" className="w-10 h-10 rounded-xl" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            VeraFact
          </h1>
        </div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Discover
          </Button>
          <Button variant="default" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </nav>
      </div>
    </header>
  );
};
