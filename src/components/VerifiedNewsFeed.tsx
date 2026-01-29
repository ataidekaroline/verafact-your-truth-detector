import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, RefreshCw, CheckCircle, ExternalLink, Clock, Landmark, Microscope, Cpu, HeartPulse, AlertTriangle, Newspaper, Shield } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

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

// Enhanced skeleton with processing message
const NewsCardSkeleton = ({ index }: { index: number }) => (
  <Card className="p-5 border-2 animate-pulse">
    <div className="flex items-start gap-3">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
    {index === 0 && (
      <div className="mt-3 pt-3 border-t border-dashed">
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Processando e traduzindo notícias...
        </p>
      </div>
    )}
  </Card>
);

export const VerifiedNewsFeed = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [verifiedNews, setVerifiedNews] = useState<Record<string, VerifiedNews[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("politics");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) {
      setCategories(data);
    }
  }, []);

  const fetchVerifiedNews = useCallback(async () => {
    const { data } = await supabase
      .from('verified_news')
      .select('*')
      .eq('is_verified', true)
      .order('verified_at', { ascending: false })
      .limit(50);
    
    if (data) {
      const grouped = data.reduce((acc, news) => {
        const catId = news.category_id || 'other';
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(news);
        return acc;
      }, {} as Record<string, VerifiedNews[]>);
      
      setVerifiedNews(grouped);
      setLastUpdate(new Date());
    }
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    toast.info("Buscando notícias do NYT e CNN Brasil...", {
      description: "Traduzindo e verificando automaticamente"
    });

    try {
      // Try new unified function first, fallback to CNN-only
      let error;
      try {
        const response = await supabase.functions.invoke('fetch-news');
        error = response.error;
        
        if (!error && response.data) {
          const sources = response.data.sources;
          toast.success("Feed atualizado!", {
            description: `NYT: ${sources?.nyt || 0} | CNN: ${sources?.cnn || 0} artigos`
          });
        }
      } catch (e) {
        // Fallback to legacy function
        const response = await supabase.functions.invoke('fetch-cnn-news');
        error = response.error;
      }
      
      if (error) throw error;

      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchVerifiedNews();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error("Falha ao atualizar notícias");
    } finally {
      setRefreshing(false);
    }
  }, [fetchVerifiedNews]);

  // Initial load and setup
  useEffect(() => {
    fetchCategories();
    fetchVerifiedNews();

    // Set up real-time subscription
    const channel = supabase
      .channel('verified-news-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verified_news' },
        () => fetchVerifiedNews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCategories, fetchVerifiedNews]);

  // Auto-refresh every 60 minutes
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      handleRefresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [handleRefresh]);

  // Refresh on page visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastUpdate) {
        const timeSinceUpdate = Date.now() - lastUpdate.getTime();
        if (timeSinceUpdate > 5 * 60 * 1000) { // 5 minutes
          fetchVerifiedNews();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastUpdate, fetchVerifiedNews]);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'politics': return <Landmark className="w-4 h-4" />;
      case 'science': return <Microscope className="w-4 h-4" />;
      case 'tech': return <Cpu className="w-4 h-4" />;
      case 'health': return <HeartPulse className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

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

  const selectedCategoryData = categories.find(c => c.slug === selectedCategory);
  const newsForCategory = selectedCategoryData 
    ? verifiedNews[selectedCategoryData.id] || []
    : [];

  return (
    <section className="mb-8 sm:mb-12">
      <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Notícias Verificadas</h2>
            {lastUpdate && (
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Última atualização: {formatTimeAgo(lastUpdate.toISOString())}
              </p>
            )}
          </div>
        </div>
        
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>
      
      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.slug ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.slug)}
            className={`whitespace-nowrap h-10 px-4 text-sm gap-2 transition-all ${
              selectedCategory === category.slug 
                ? 'shadow-[var(--shadow-glow)]' 
                : ''
            }`}
          >
            {getCategoryIcon(category.slug)}
            {category.name}
          </Button>
        ))}
      </div>

      {/* News Grid */}
      {loading || refreshing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <NewsCardSkeleton key={i} index={i} />
          ))}
        </div>
      ) : newsForCategory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsForCategory.slice(0, 6).map((news) => (
            <Card key={news.id} className="p-4 sm:p-5 hover:shadow-[var(--shadow-medium)] transition-all hover:scale-[1.01] border-2 overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-success/10 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Source Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <SourceBadge source={news.source_name} />
                    {news.confidence_score && (
                      <Badge className="text-[10px] bg-success/20 text-success border-success/30 px-1.5 py-0.5">
                        {Math.round(news.confidence_score * 100)}% confiança
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2">
                    {news.title}
                  </h3>
                  
                  {news.snippet && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {news.snippet}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t gap-2">
                    <span className="truncate">
                      {news.source_name} • {news.verified_at ? formatTimeAgo(news.verified_at) : ''}
                    </span>
                    <a 
                      href={news.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline font-medium flex-shrink-0"
                    >
                      Ver
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center border-2 border-dashed">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="w-12 h-12 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">Nenhuma notícia verificada nesta categoria.</p>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Buscar Notícias
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
};
