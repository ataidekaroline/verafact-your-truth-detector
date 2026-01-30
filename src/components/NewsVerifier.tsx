import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ExternalLink,
  Building2,
  ShieldCheck,
  Newspaper,
  GraduationCap,
  Info,
  Flag
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SourceReference {
  type: 'government' | 'factchecker' | 'media' | 'academic';
  name: string;
  description: string;
  url: string;
  relevance: string;
}

interface VerificationResult {
  classification: 'verified' | 'fake' | 'needs_verification';
  is_true: boolean;
  confidence: number;
  headline: string;
  reasoning: string;
  fact_summary: string;
  key_points: string[];
  limitations: string;
  sources: SourceReference[];
  references: string[];
}

// Ícone baseado no tipo de fonte
const SourceIcon = ({ type }: { type: SourceReference['type'] }) => {
  switch (type) {
    case 'government':
      return <Building2 className="w-4 h-4 text-blue-500" />;
    case 'factchecker':
      return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
    case 'media':
      return <Newspaper className="w-4 h-4 text-purple-500" />;
    case 'academic':
      return <GraduationCap className="w-4 h-4 text-amber-500" />;
    default:
      return <ExternalLink className="w-4 h-4 text-muted-foreground" />;
  }
};

// Rótulo do tipo de fonte
const getSourceTypeLabel = (type: SourceReference['type']) => {
  switch (type) {
    case 'government':
      return 'Órgão Oficial';
    case 'factchecker':
      return 'Fact-Checker';
    case 'media':
      return 'Veículo de Mídia';
    case 'academic':
      return 'Fonte Acadêmica';
    default:
      return 'Referência';
  }
};

// Skeleton de carregamento
const VerificationSkeleton = () => (
  <Card className="p-5 sm:p-6 border-2 border-muted animate-pulse">
    <div className="flex items-start gap-4">
      <Skeleton className="w-14 h-14 rounded-xl" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
    <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Consultando bases de dados e fact-checkers...</span>
    </div>
  </Card>
);

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
        body: { text: newsInput.substring(0, 5000) }
      });

      if (error) throw error;

      setResult(data);
      
      // Store in verification history
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

  const getClassificationStyle = (classification: string) => {
    switch (classification) {
      case 'verified':
        return {
          border: 'border-success/40',
          bg: 'bg-success/5',
          icon: <CheckCircle className="w-8 h-8 text-success" />,
          iconBg: 'bg-success/20',
          badge: 'bg-success text-success-foreground',
          label: 'Informação Verificada'
        };
      case 'fake':
        return {
          border: 'border-destructive/40',
          bg: 'bg-destructive/5',
          icon: <XCircle className="w-8 h-8 text-destructive" />,
          iconBg: 'bg-destructive/20',
          badge: 'bg-destructive text-destructive-foreground',
          label: 'Possível Desinformação'
        };
      default:
        return {
          border: 'border-warning/40',
          bg: 'bg-warning/5',
          icon: <AlertTriangle className="w-8 h-8 text-warning" />,
          iconBg: 'bg-warning/20',
          badge: 'bg-warning text-warning-foreground',
          label: 'Necessita Verificação'
        };
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { label: "Alta", color: "text-success" };
    if (confidence >= 0.5) return { label: "Média", color: "text-warning" };
    return { label: "Baixa", color: "text-muted-foreground" };
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
            <p className="text-sm text-muted-foreground">Cole uma alegação para analisar com fontes reais</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 sm:gap-4">
          <Input
            placeholder="Ex: O governo vai taxar o PIX em 2025..."
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
                Verificar Alegação
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isChecking && <VerificationSkeleton />}

        {/* Result Display */}
        {result && !isChecking && (
          <div className="mt-6 animate-slide-up space-y-4">
            {/* Main Result Card */}
            <Card className={`p-5 sm:p-6 border-2 ${getClassificationStyle(result.classification).border} ${getClassificationStyle(result.classification).bg}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${getClassificationStyle(result.classification).iconBg}`}>
                  {getClassificationStyle(result.classification).icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="text-xl font-bold">
                      {result.headline || getClassificationStyle(result.classification).label}
                    </h3>
                    <Badge className={getClassificationStyle(result.classification).badge}>
                      {getClassificationStyle(result.classification).label}
                    </Badge>
                  </div>
                  
                  {/* Confidence */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">Nível de Confiança:</span>
                    <span className={`font-semibold ${getConfidenceLevel(result.confidence).color}`}>
                      {Math.round(result.confidence * 100)}% ({getConfidenceLevel(result.confidence).label})
                    </span>
                  </div>
                  
                  {/* Fact Summary / Correction */}
                  {result.fact_summary && (
                    <div className="bg-background/50 border rounded-lg p-4 mb-4">
                      <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {result.classification === 'fake' ? 'Correção dos Fatos' : 'Resumo Verificado'}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.fact_summary}</p>
                    </div>
                  )}
                  
                  {/* Analysis */}
                  {result.reasoning && (
                    <div className="bg-muted/30 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2 text-sm">Análise Detalhada:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.reasoning}</p>
                    </div>
                  )}

                  {/* Key Points */}
                  {result.key_points && result.key_points.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-sm">Pontos-Chave:</h4>
                      <ul className="space-y-1">
                        {result.key_points.map((point, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Limitations */}
                  {result.limitations && (
                    <p className="text-xs text-muted-foreground italic border-t pt-3 mt-4">
                      ⚠️ {result.limitations}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Sources Card */}
            {result.sources && result.sources.length > 0 && (
              <Card className="p-5 sm:p-6 border-2">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  Fontes de Referência
                </h4>
                <div className="space-y-3">
                  {result.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background border flex-shrink-0">
                          <SourceIcon type={source.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm group-hover:text-primary transition-colors">
                              {source.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getSourceTypeLabel(source.type)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
                          <p className="text-xs text-primary/70 mt-1 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {new URL(source.url).hostname.replace('www.', '')}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Report Button */}
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Flag className="w-4 h-4" />
                    Reportar para Verificação Manual
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
