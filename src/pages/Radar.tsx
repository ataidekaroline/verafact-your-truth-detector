import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Radio, CheckCircle, ExternalLink, Clock, AlertTriangle, Newspaper, Shield } from "lucide-react";

interface VerifiedNews {
  id: string;
  title: string;
  snippet: string | null;
  source_name: string;
  source_url: string;
  confidence_score: number | null;
  verified_at: string | null;
  category_id: string | null;
  image_url: string | null;
  categories: {
    name: string;
    slug: string;
  } | null;
}

const AUTO_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes

// Source badge component
const SourceBadge = ({ source }: { source: string }) => {
  const isNYT = source.toLowerCase().includes('new york times') || source.toLowerCase().includes('nyt');
  const isCNN = source.toLowerCase().includes('cnn');
  
  if (isNYT) {
    return (
      <Badge className="text-[10px] bg-slate-900 text-white border-slate-700 gap-1 px-1.5 py-0.5">
        <Newspaper className="w-2.5 h-2.5" />
        NYT
      </Badge>
    );
  }
  
  if (isCNN) {
    return (
      <Badge className="text-[10px] bg-red-600 text-white border-red-500 gap-1 px-1.5 py-0.5">
        <Newspaper className="w-2.5 h-2.5" />
        CNN
      </Badge>
    );
  }
  
  return (
    <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0.5">
      <Shield className="w-2.5 h-2.5" />
      Verificado
    </Badge>
  );
};

// Enhanced skeleton loader
const NewsCardSkeleton = ({ showMessage }: { showMessage?: boolean }) => (
  <Card className="p-5 border-2 animate-pulse">
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    {showMessage && (
      <div className="mt-3 pt-3 border-t border-dashed">
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Buscando NYT e CNN, traduzindo e verificando...
        </p>
      </div>
    )}
  </Card>
);

const Radar = () => {
  const [news, setNews] = useState<VerifiedNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("verified_news")
        .select(`
          *,
          categories(name, slug)
        `)
        .eq("is_verified", true)
        .order("verified_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNews(data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
      toast.error("Falha ao carregar feed de notícias");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    toast.info("Buscando notícias do NYT e CNN Brasil...", {
      description: "Traduzindo e verificando automaticamente"
    });

    try {
      // Try new unified function first
      let error;
      try {
        const response = await supabase.functions.invoke("fetch-news");
        error = response.error;
        
        if (!error && response.data) {
          const sources = response.data.sources;
          toast.success("Feed atualizado!", {
            description: `NYT: ${sources?.nyt || 0} | CNN: ${sources?.cnn || 0} artigos processados`
          });
        }
      } catch (e) {
        // Fallback to legacy function
        const response = await supabase.functions.invoke("fetch-cnn-news");
        error = response.error;
        if (!error) {
          toast.success("Feed atualizado com sucesso!");
        }
      }
      
      if (error) throw error;

      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchNews();
    } catch (error) {
      console.error("Erro ao atualizar feed:", error);
      toast.error("Não foi possível atualizar as notícias");
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNews();

    // Real-time subscription
    const channel = supabase
      .channel("radar-news-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verified_news" },
        () => fetchNews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNews]);

  // Auto-refresh every 60 minutes
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      handleManualRefresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, []);

  // Refresh on page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastUpdate) {
        const timeSinceUpdate = Date.now() - lastUpdate.getTime();
        if (timeSinceUpdate > 5 * 60 * 1000) {
          fetchNews();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastUpdate, fetchNews]);

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 safe-bottom">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Radio className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Radar em Tempo Real</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastUpdate 
                  ? `Atualizado: ${formatTimeAgo(lastUpdate.toISOString())}`
                  : "Fontes: NYT + CNN Brasil"
                }
              </p>
            </div>
          </div>

          <Button
            onClick={handleManualRefresh}
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        {/* Content */}
        {loading || refreshing ? (
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <NewsCardSkeleton key={i} showMessage={i === 0} />
            ))}
          </div>
        ) : news.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma notícia verificada</h3>
            <p className="text-muted-foreground mb-6">
              Clique em atualizar para buscar as notícias mais recentes do NYT e CNN
            </p>
            <Button onClick={handleManualRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Buscar Notícias
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {news.map((item) => (
              <Card key={item.id} className="p-4 sm:p-5 hover:shadow-[var(--shadow-medium)] transition-all border-2">
                {/* Source and Category Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <SourceBadge source={item.source_name} />
                  {item.categories && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      {item.categories.name}
                    </Badge>
                  )}
                  {item.confidence_score && (
                    <Badge className="text-[10px] bg-success/20 text-success border-success/30 px-1.5 py-0.5">
                      {Math.round(item.confidence_score * 100)}% verificado
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-success/10 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base leading-snug mb-2">
                      {item.title}
                    </h3>
                    
                    {item.snippet && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.snippet}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t gap-2">
                      <span className="truncate">
                        {item.source_name} • {item.verified_at ? formatTimeAgo(item.verified_at) : ''}
                      </span>
                      <a 
                        href={item.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline font-medium flex-shrink-0 min-h-[44px] py-2"
                      >
                        Ver notícia
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Radar;
