import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LinkAnalysisResult } from "./link-analyzer/types";
import { LinkAnalysisResultCard } from "./link-analyzer/LinkAnalysisResultCard";

export const LinkAnalyzer = () => {
  const [linkInput, setLinkInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<LinkAnalysisResult | null>(null);

  const analyzeLink = async () => {
    if (!linkInput.trim()) {
      toast.error("Por favor, insira um link para analisar");
      return;
    }

    // Validate URL format
    let url: URL;
    try {
      url = new URL(linkInput.startsWith("http") ? linkInput : `https://${linkInput}`);
    } catch {
      toast.error("URL inválida. Por favor, verifique o formato.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-link', {
        body: { url: url.href }
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error("Erro ao analisar o link. Tente novamente.");
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data as LinkAnalysisResult);

      // Show appropriate toast based on result
      if (data.status === 'scam' || data.isBrandSquatting) {
        toast.error("🚨 GOLPE DETECTADO!", {
          description: data.scamType || "Este link é uma fraude. Não acesse!",
          duration: 8000,
        });
      } else if (data.status === 'danger') {
        toast.warning("⚠️ Risco Elevado", {
          description: "Este link apresenta múltiplos sinais de perigo.",
        });
      } else if (data.status === 'warning') {
        toast.warning("Atenção", {
          description: "Alguns indicadores suspeitos foram encontrados.",
        });
      } else {
        toast.success("Link analisado", {
          description: "Nenhuma ameaça óbvia detectada.",
        });
      }

    } catch (err) {
      console.error('Analysis error:', err);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-5 sm:p-8 shadow-[var(--shadow-large)] border-2">
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-2 bg-success/10 rounded-lg">
            <Link className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Analisar Link</h2>
            <p className="text-sm text-muted-foreground">Verificação ultra-rigorosa contra phishing e golpes</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 sm:gap-4">
          <Input
            placeholder="Cole aqui o link suspeito para analisar..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && analyzeLink()}
            className="h-12 sm:h-14 text-sm sm:text-base px-4 sm:px-6"
          />
          <Button 
            onClick={analyzeLink}
            disabled={isAnalyzing}
            className="h-12 sm:h-14 text-sm sm:text-base font-semibold bg-success hover:bg-success/90 text-success-foreground shadow-[var(--shadow-success)]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analisando Link...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" />
                Analisar Segurança
              </>
            )}
          </Button>
        </div>

        {/* Result Display */}
        {result && <LinkAnalysisResultCard result={result} />}
      </div>
    </Card>
  );
};
