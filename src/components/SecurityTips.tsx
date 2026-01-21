import { Card } from "@/components/ui/card";
import { Lightbulb, AlertTriangle, Link, Eye, Shield, Search } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tips = [
  {
    icon: Search,
    title: "Verifique a Fonte",
    description: "Confirme se a notícia vem de um veículo de comunicação confiável e reconhecido.",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: Eye,
    title: "Leia Além do Título",
    description: "Manchetes sensacionalistas podem distorcer o conteúdo real da notícia.",
    color: "bg-success/10 text-success"
  },
  {
    icon: AlertTriangle,
    title: "Desconfie de Urgência",
    description: "Golpistas usam pressão e urgência para forçar decisões precipitadas.",
    color: "bg-warning/10 text-warning"
  },
  {
    icon: Link,
    title: "Analise URLs",
    description: "Verifique se o domínio é oficial. Golpistas usam variações sutis.",
    color: "bg-destructive/10 text-destructive"
  }
];

export const SecurityTips = () => {
  return (
    <section className="mb-8 sm:mb-12">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-2 bg-warning/10 rounded-lg">
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Dicas de Segurança</h2>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <TooltipProvider>
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Card className="p-3 sm:p-4 cursor-pointer hover:shadow-[var(--shadow-medium)] transition-all hover:scale-[1.02] border-2">
                    <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                      <div className={`p-2 sm:p-3 rounded-xl ${tip.color}`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <h3 className="font-semibold text-xs sm:text-sm text-foreground">{tip.title}</h3>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px] p-3">
                  <p className="text-sm">{tip.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </section>
  );
};
