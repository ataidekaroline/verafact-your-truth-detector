import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  AlertTriangle, 
  Globe, 
  Skull,
  ExternalLink,
  Flag,
  Link2Off,
  Target,
  Brain
} from "lucide-react";
import { LinkAnalysisResult, StatusConfig } from "./types";
import { toast } from "sonner";

interface LinkAnalysisResultCardProps {
  result: LinkAnalysisResult;
}

const getStatusConfig = (status: string, isBrandSquatting: boolean): StatusConfig => {
  if (status === "scam" || isBrandSquatting) {
    return {
      icon: Skull,
      title: "🚨 GOLPE DETECTADO",
      description: "Este link apresenta características claras de fraude. NÃO ACESSE.",
      color: "text-white",
      bgColor: "bg-gradient-to-br from-red-600 to-red-800",
      borderColor: "border-red-500",
      badgeColor: "bg-red-900 text-white border-red-400",
      cardBg: "bg-gradient-to-br from-red-950 to-red-900"
    };
  }

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
        title: "⚠️ Atenção: Possível Risco",
        description: "Este link apresenta alguns indicadores suspeitos. Prossiga com cautela.",
        color: "text-warning",
        bgColor: "bg-warning/10",
        borderColor: "border-warning/30",
        badgeColor: "bg-warning text-warning-foreground"
      };
    case "danger":
      return {
        icon: ShieldX,
        title: "🔴 Risco Elevado",
        description: "Este link apresenta múltiplos sinais de perigo. Evite acessar.",
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

export const LinkAnalysisResultCard = ({ result }: LinkAnalysisResultCardProps) => {
  const config = getStatusConfig(result.status, result.isBrandSquatting);
  const StatusIcon = config.icon;
  const isScam = result.status === "scam" || result.isBrandSquatting;

  const handleReport = () => {
    // Simulate report submission
    toast.success("Denúncia enviada!", {
      description: "O link foi reportado para análise. Obrigado por ajudar a combater fraudes.",
    });
  };

  return (
    <div className="mt-6 animate-slide-up">
      <Card className={`p-5 sm:p-6 border-2 ${config.borderColor} ${isScam ? config.cardBg : config.bgColor} ${isScam ? 'shadow-[0_0_30px_rgba(220,38,38,0.4)]' : ''}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${isScam ? 'bg-red-500/30 animate-pulse' : config.bgColor}`}>
            <StatusIcon className={`w-8 h-8 ${config.color}`} />
          </div>
          
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h3 className={`text-xl font-bold ${config.color}`}>
                {config.title}
              </h3>
              <Badge className={config.badgeColor}>
                {isScam ? "BLOQUEADO" : `Pontuação: ${result.score}/100`}
              </Badge>
            </div>
            
            {/* Domain Info */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Globe className={`w-4 h-4 ${isScam ? 'text-red-300' : 'text-muted-foreground'}`} />
              <span className={`font-medium ${isScam ? 'text-red-200 line-through' : 'text-muted-foreground'}`}>
                {result.domain}
              </span>
              {result.isUrlShortener && (
                <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                  <Link2Off className="w-3 h-3 mr-1" />
                  URL Encurtada
                </Badge>
              )}
              {result.isBrandSquatting && result.targetedBrand && (
                <Badge variant="outline" className="text-xs bg-red-500/20 text-red-300 border-red-500/50">
                  <Target className="w-3 h-3 mr-1" />
                  Imita: {result.targetedBrand}
                </Badge>
              )}
            </div>
            
            <p className={`mb-4 ${isScam ? 'text-red-100' : 'text-muted-foreground'}`}>
              {config.description}
            </p>
            
            {/* Scam Type & Modus Operandi */}
            {result.scamType && (
              <div className={`p-4 rounded-lg mb-4 border ${isScam ? 'bg-red-900/50 border-red-500/50' : 'bg-destructive/10 border-destructive/30'}`}>
                <h4 className={`font-bold mb-2 text-sm flex items-center gap-2 ${isScam ? 'text-red-100' : 'text-destructive'}`}>
                  <Skull className="w-4 h-4" />
                  Tipo de Golpe: {result.scamType}
                </h4>
                {result.modusOperandi && (
                  <p className={`text-sm ${isScam ? 'text-red-200' : 'text-muted-foreground'}`}>
                    <strong>Modus Operandi:</strong> {result.modusOperandi}
                  </p>
                )}
              </div>
            )}

            {/* AI Analysis */}
            {result.aiAnalysis && (
              <div className={`p-4 rounded-lg mb-4 border ${isScam ? 'bg-red-900/30 border-red-500/30' : 'bg-primary/5 border-primary/20'}`}>
                <h4 className={`font-semibold mb-2 text-sm flex items-center gap-2 ${isScam ? 'text-red-100' : 'text-primary'}`}>
                  <Brain className="w-4 h-4" />
                  Análise de IA:
                </h4>
                <p className={`text-sm whitespace-pre-wrap ${isScam ? 'text-red-200' : 'text-muted-foreground'}`}>
                  {result.aiAnalysis}
                </p>
              </div>
            )}
            
            {/* Issues */}
            {result.issues.length > 0 && (
              <div className={`p-4 rounded-lg mb-4 border ${isScam ? 'bg-red-900/40 border-red-500/40' : 'bg-card/50 border-border'}`}>
                <h4 className={`font-semibold mb-2 text-sm flex items-center gap-2 ${isScam ? 'text-red-100' : ''}`}>
                  <AlertTriangle className={`w-4 h-4 ${isScam ? 'text-red-300' : 'text-warning'}`} />
                  Problemas Detectados:
                </h4>
                <ul className="space-y-2">
                  {result.issues.map((issue, idx) => (
                    <li key={idx} className={`text-sm flex items-start gap-2 ${isScam ? 'text-red-200' : 'text-muted-foreground'}`}>
                      <span className={isScam ? 'text-red-400' : 'text-destructive'}>•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className={`p-4 rounded-lg border mb-4 ${isScam ? 'bg-red-900/20 border-red-500/20' : 'bg-primary/5 border-primary/20'}`}>
                <h4 className={`font-semibold mb-2 text-sm flex items-center gap-2 ${isScam ? 'text-red-100' : ''}`}>
                  <ShieldCheck className={`w-4 h-4 ${isScam ? 'text-red-300' : 'text-primary'}`} />
                  Recomendações:
                </h4>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className={`text-sm flex items-start gap-2 ${isScam ? 'text-red-200' : 'text-muted-foreground'}`}>
                      <span className={isScam ? 'text-red-400' : 'text-primary'}>✓</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Report Button */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReport}
                className={isScam ? 'border-red-500/50 text-red-200 hover:bg-red-900/50' : 'border-destructive/50 text-destructive hover:bg-destructive/10'}
              >
                <Flag className="w-4 h-4 mr-2" />
                Denunciar este Link
              </Button>
              
              {isScam && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://www.gov.br/pf/pt-br/canais_atendimento/denuncias', '_blank')}
                  className="border-red-500/50 text-red-200 hover:bg-red-900/50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Denunciar à Polícia Federal
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
