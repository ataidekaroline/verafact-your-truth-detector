import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerificationResultProps {
  result: {
    is_true: boolean;
    confidence: number;
    reasoning: string;
    fact_summary: string;
    references: string[];
  };
}

export const VerificationResult = ({ result }: VerificationResultProps) => {
  const isTrue = result.is_true;
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <div className="space-y-4">
      {/* Result Header */}
      <Card className={`border-2 ${isTrue ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {isTrue ? (
              <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">
                {isTrue ? '✓ Fact Verified as True' : '✗ ALERT: Detected as Fake News'}
              </CardTitle>
              <Badge variant={isTrue ? "default" : "destructive"} className="text-xs">
                Confidence: {confidencePercent}%
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reasoning */}
      {result.reasoning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              {isTrue ? 'Verification Analysis' : 'Why It\'s False'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{result.reasoning}</p>
          </CardContent>
        </Card>
      )}

      {/* Fact Summary */}
      {result.fact_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isTrue ? 'Verified Summary' : 'The True Fact'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{result.fact_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* References */}
      {result.references && result.references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isTrue ? 'Reliable Sources' : 'Debunking References'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.references.map((ref, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {ref}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};