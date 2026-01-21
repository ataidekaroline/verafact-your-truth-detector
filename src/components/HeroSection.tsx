import { Shield, ShieldCheck, Eye } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-8 sm:mb-10 shadow-[var(--shadow-large)]">
      <div 
        className="absolute inset-0 opacity-10"
        style={{ 
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="relative bg-gradient-to-br from-primary/5 via-background to-success/5 p-6 sm:p-10 md:p-16 border border-border">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <ShieldCheck className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight text-foreground">
            Proteja-se Contra
            <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
              Desinformação e Golpes
            </span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-2 leading-relaxed">
            O <strong className="text-foreground">VeraFact</strong> utiliza fontes de confiança para detetar notícias falsas e analisar a segurança de links, protegendo-o contra desinformação e golpes online.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
              <Shield className="w-4 h-4 text-primary" />
              <span>100% Gratuito</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
              <Eye className="w-4 h-4 text-success" />
              <span>Sem Registo</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Privacidade Total</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
