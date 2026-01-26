export interface LinkAnalysisResult {
  status: "safe" | "warning" | "danger" | "scam";
  score: number;
  domain: string;
  issues: string[];
  recommendations: string[];
  modusOperandi?: string;
  scamType?: string;
  aiAnalysis?: string;
  isBrandSquatting: boolean;
  isUrlShortener: boolean;
  targetedBrand?: string;
}

export interface StatusConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  cardBg?: string;
}
