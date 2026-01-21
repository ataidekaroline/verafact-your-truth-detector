import { Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/verafact-logo.png";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logo} alt="VeraFact" className="w-10 h-10 rounded-xl" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-foreground">
              VeraFact
            </h1>
            <p className="text-xs text-muted-foreground">Detector de Verdade</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate("/")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive("/") 
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Início
          </button>
          <button
            onClick={() => navigate("/radar")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive("/radar") 
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Radar
          </button>
          <button
            onClick={() => navigate("/dicas")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive("/dicas") 
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Dicas
          </button>
        </nav>
      </div>
    </header>
  );
};
