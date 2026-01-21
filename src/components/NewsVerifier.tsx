import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VerificationResult {
  is_true: boolean;
  confidence: number;
  reasoning: string;
  fact_summary: string;
  references: string[];
}

export const NewsVerifier = () => {
  const [newsInput, setNewsInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!newsInput.trim()) {
      toast.error("Por favor, insira um texto ou URL para verificar");
      return;
    }

    if (newsInput.trim().length < 10) {
      toast.error("O texto deve ter pelo menos 10 caracteres");
      return;
    }

    setIsChecking(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-news', {
        body: { text: newsInput.substring(0, 5000) } // Limit input
      });

      if (error) throw error;

      setResult(data);
      
      // Store in verification history (anonymous)
      await supabase
        .from('verification_history')
        .insert({
          input_text: newsInput.substring(0, 1000),
          ml_result: data.is_true,
          confidence_score: data.confidence,
          true_fact_summary: data.fact_summary,
          reference_sites: data.references
        });
      
    } catch (error: any) {
      console.error('Erro na verificação:', error);
      toast.error(error.message || "Falha ao verificar. Por favor, tente novamente.");
    } finally {
      setIsChecking(false);
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { label: "Alta", color: "bg-success text-success-foreground" };
    if (confidence >= 0.5) return { label: "Média", color: "bg-warning text-warning-foreground" };
    return { label: "Baixa", color: "bg-destructive text-destructive-foreground" };
  };

  return (
    <Card className="p-5 sm:p-8 shadow-[var(--shadow-large)] border-2">
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Verificar Notícia</h2>
            <p className="text-sm text-muted-foreground">Cole uma notícia ou URL para analisar</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 sm:gap-4">
          <Input
            placeholder="Cole aqui o texto ou URL da notícia para verificar..."
            value={newsInput}
            onChange={(e) => setNewsInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            className="h-12 sm:h-14 text-sm sm:text-base px-4 sm:px-6"
          />
          <Button 
            onClick={handleVerify}
            disabled={isChecking}
            className="h-12 sm:h-14 text-sm sm:text-base font-semibold bg-primary hover:bg-primary/90 shadow-[var(--shadow-glow)]"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Verificar
              </>
            )}
          </Button>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mt-6 animate-slide-up">
            <Card className={`p-5 sm:p-6 border-2 ${
              result.is_true 
                ? "border-success/30 bg-success/5" 
                : "border-destructive/30 bg-destructive/5"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  result.is_true ? "bg-success/20" : "bg-destructive/20"
                }`}>
                  {result.is_true ? (
                    <CheckCircle className="w-8 h-8 text-success" />
                  ) : (
                    <XCircle className="w-8 h-8 text-destructive" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="text-xl font-bold">
                      {result.is_true ? "Informação Verificada" : "Possível Desinformação"}
                    </h3>
                    <Badge className={getConfidenceLevel(result.confidence).color}>
                      Confiança: {Math.round(result.confidence * 100)}%
                    </Badge>
                  </div>
                  
                  {result.fact_summary && (
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {result.fact_summary}
                    </p>
                  )}
                  
                  {result.reasoning && (
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2 text-sm">Análise:</h4>
                      <p className="text-sm text-muted-foreground">{result.reasoning}</p>
                    </div>
                  )}
                  
                  {result.references && result.references.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Fontes de Referência:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.references.slice(0, 3).map((ref, idx) => {
                          try {
                            const url = new URL(ref);
                            return (
                              <a
                                key={idx}
                                href={ref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full"
                              >
                                {url.hostname.replace("www.", "")}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            );
                          } catch {
                            return null;
                          }
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
};
