import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { NewsCard } from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Radio } from "lucide-react";

interface VerifiedNews {
  id: string;
  title: string;
  snippet: string | null;
  source_name: string;
  source_url: string;
  confidence_score: number | null;
  verified_at: string | null;
  category_id: string | null;
  categories: {
    name: string;
    slug: string;
  } | null;
}

const Radar = () => {
  const [news, setNews] = useState<VerifiedNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchNews = async () => {
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
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({
        title: "Error loading news",
        description: "Failed to fetch verified news feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    toast({
      title: "Fetching latest news...",
      description: "This may take a moment",
    });

    try {
      const { error } = await supabase.functions.invoke("fetch-cnn-news");
      if (error) throw error;

      setTimeout(() => {
        fetchNews();
        toast({
          title: "Feed updated",
          description: "Latest verified news loaded",
        });
      }, 2000);
    } catch (error) {
      console.error("Error refreshing feed:", error);
      toast({
        title: "Refresh failed",
        description: "Could not fetch latest news",
        variant: "destructive",
      });
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();

    const channel = supabase
      .channel("radar-news-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "verified_news",
        },
        () => {
          fetchNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-24 sm:pb-32 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Real-Time Radar</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Live verified news feed • Updated every 15-30 minutes
              </p>
            </div>
          </div>

          <Button
            onClick={handleManualRefresh}
            disabled={refreshing}
            variant="outline"
            size="lg"
            className="gap-2 w-full sm:w-auto min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="text-sm sm:text-base">Refresh</span>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-48 bg-card rounded-xl animate-pulse border border-border" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No verified news yet</h3>
            <p className="text-muted-foreground mb-6">
              Click refresh to fetch the latest verified news
            </p>
            <Button onClick={handleManualRefresh} disabled={refreshing} size="lg">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Fetch News
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <div key={item.id} className="relative">
                {item.categories && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-medium text-primary px-3 py-1 bg-primary/10 rounded-full">
                      {item.categories.name}
                    </span>
                  </div>
                )}
                <NewsCard
                  title={item.title}
                  snippet={item.snippet || ""}
                  sourceName={item.source_name}
                  sourceUrl={item.source_url}
                  confidenceScore={item.confidence_score || 0}
                  verifiedAt={item.verified_at || new Date().toISOString()}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Radar;
