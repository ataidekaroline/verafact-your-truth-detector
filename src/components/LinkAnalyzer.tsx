import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, ShieldCheck, ShieldAlert, ShieldX, Loader2, AlertTriangle, ExternalLink, Globe } from "lucide-react";
import { toast } from "sonner";

interface LinkAnalysisResult {
  status: "safe" | "warning" | "danger";
  score: number;
  domain: string;
  issues: string[];
  recommendations: string[];
}

// Known suspicious patterns
const SUSPICIOUS_PATTERNS = [
  { pattern: /bit\.ly|goo\.gl|tinyurl|t\.co|shorturl/i, issue: "URL encurtada - pode esconder destino real" },
  { pattern: /login|signin|account|verify|confirm|secure|update/i, issue: "Contém palavras típicas de phishing" },
  { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i, issue: "URL com IP numérico - suspeito" },
  { pattern: /@/i, issue: "Contém caractere @ - técnica de ofuscação" },
  { pattern: /\.tk$|\.ml$|\.ga$|\.cf$|\.gq$/i, issue: "Domínio gratuito frequentemente usado em golpes" },
  { pattern: /paypal.*\.(?!com)|bank.*\.(?!com)|apple.*\.(?!com)/i, issue: "Possível clone de site legítimo" },
  { pattern: /\.ru$|\.cn$|\.xyz$/i, issue: "Domínio de alto risco" },
  { pattern: /-{2,}|_{2,}/i, issue: "Padrão de URL suspeito" },
  { pattern: /free.*money|prize|winner|lottery|bitcoin.*free/i, issue: "Palavras associadas a fraudes" },
];

const TRUSTED_DOMAINS = [
  "google.com", "facebook.com", "twitter.com", "instagram.com",
  "youtube.com", "linkedin.com", "microsoft.com", "apple.com",
  "amazon.com", "netflix.com", "spotify.com", "github.com",
  "wikipedia.org", "gov.br", "bbc.com", "cnn.com", "reuters.com",
  "globo.com", "uol.com.br", "folha.uol.com.br", "estadao.com.br"
];

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

    // Simulate analysis delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    const domain = url.hostname.replace("www.", "");

    // Check for suspicious patterns
    SUSPICIOUS_PATTERNS.forEach(({ pattern, issue }) => {
      if (pattern.test(linkInput)) {
        issues.push(issue);
        score -= 20;
      }
    });

    // Check HTTPS
    if (url.protocol !== "https:") {
      issues.push("Conexão não segura (sem HTTPS)");
      score -= 15;
      recommendations.push("Evite inserir dados pessoais em sites sem HTTPS");
    }

    // Check if it's a known trusted domain
    const isTrusted = TRUSTED_DOMAINS.some(trusted => 
      domain === trusted || domain.endsWith(`.${trusted}`)
    );
    
    if (isTrusted) {
      score = Math.min(100, score + 30);
    }

    // Check subdomain depth (phishing often uses many subdomains)
    const subdomainCount = domain.split(".").length - 2;
    if (subdomainCount > 2) {
      issues.push("Muitos subdomínios - padrão comum em phishing");
      score -= 15;
    }

    // Generate recommendations based on issues
    if (issues.length > 0) {
      recommendations.push("Verifique o remetente antes de clicar");
      recommendations.push("Não insira dados pessoais ou bancários");
      recommendations.push("Em caso de dúvida, acesse o site oficial diretamente");
    }

    // Determine status
    let status: "safe" | "warning" | "danger";
    if (score >= 70) {
      status = "safe";
    } else if (score >= 40) {
      status = "warning";
    } else {
      status = "danger";
    }

    score = Math.max(0, Math.min(100, score));

    setResult({
      status,
      score,
      domain,
      issues,
      recommendations
    });

    setIsAnalyzing(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "safe":
        return {
          icon: ShieldCheck,
          title: "Link Seguro",
          description: "Este link parece ser seguro para acessar.",
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success/30",
          badgeColor: "bg-success text-success-foreground"
        };
      case "warning":
        return {
          icon: ShieldAlert,
          title: "Atenção: Possível Risco",
          description: "Este link apresenta alguns indicadores suspeitos.",
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/30",
          badgeColor: "bg-warning text-warning-foreground"
        };
      case "danger":
        return {
          icon: ShieldX,
          title: "Risco Elevado",
          description: "Este link apresenta múltiplos sinais de perigo.",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
          badgeColor: "bg-destructive text-destructive-foreground"
        };
      default:
        return {
          icon: ShieldCheck,
          title: "Analisando...",
          description: "",
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
          badgeColor: "bg-muted"
        };
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
            <p className="text-sm text-muted-foreground">Verifique se um link é seguro ou suspeito</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 sm:gap-4">
          <Input
            placeholder="Cole aqui o link suspeito para analisar..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyzeLink()}
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
        {result && (
          <div className="mt-6 animate-slide-up">
            {(() => {
              const config = getStatusConfig(result.status);
              const StatusIcon = config.icon;
              
              return (
                <Card className={`p-5 sm:p-6 border-2 ${config.borderColor} ${config.bgColor}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${config.bgColor}`}>
                      <StatusIcon className={`w-8 h-8 ${config.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className={`text-xl font-bold ${config.color}`}>
                          {config.title}
                        </h3>
                        <Badge className={config.badgeColor}>
                          Pontuação: {result.score}/100
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        <span className="font-medium">{result.domain}</span>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">
                        {config.description}
                      </p>
                      
                      {result.issues.length > 0 && (
                        <div className="bg-card/50 p-4 rounded-lg mb-4 border border-border">
                          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                            Problemas Detetados:
                          </h4>
                          <ul className="space-y-1">
                            {result.issues.map((issue, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-destructive">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.recommendations.length > 0 && (
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            Recomendações:
                          </h4>
                          <ul className="space-y-1">
                            {result.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary">✓</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })()}
          </div>
        )}
      </div>
    </Card>
  );
};
