import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GradientCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewsCard } from "@/components/NewsCard";
import { VerificationResult } from "@/components/VerificationResult";
import { Search, CheckCircle, XCircle, AlertTriangle, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.png";

interface VerificationResultType {
  is_true: boolean;
  confidence: number;
  reasoning: string;
  fact_summary: string;
  references: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface VerifiedNews {
  id: string;
  title: string;
  snippet: string;
  source_name: string;
  source_url: string;
  confidence_score: number;
  verified_at: string;
  category_id: string;
}

export default function Home() {
  const [newsInput, setNewsInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResultType | null>(null);
  const [showFloatingResult, setShowFloatingResult] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [verifiedNews, setVerifiedNews] = useState<Record<string, VerifiedNews[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("politics");

  useEffect(() => {
    fetchCategories();
    fetchVerifiedNews();
    
    // Set up real-time subscription for new verified news
    const channel = supabase
      .channel('verified-news-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'verified_news'
        },
        () => {
          fetchVerifiedNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) {
      setCategories(data);
    }
  };

  const fetchVerifiedNews = async () => {
    const { data } = await supabase
      .from('verified_news')
      .select('*')
      .eq('is_verified', true)
      .order('verified_at', { ascending: false })
      .limit(50);
    
    if (data) {
      // Group by category
      const grouped = data.reduce((acc, news) => {
        const catId = news.category_id || 'other';
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(news);
        return acc;
      }, {} as Record<string, VerifiedNews[]>);
      
      setVerifiedNews(grouped);
    }
  };

  const handleVerify = async () => {
    if (!newsInput.trim()) {
      toast.error("Please enter some text or URL to verify");
      return;
    }

    setIsChecking(true);
    setVerificationResult(null);
    setShowFloatingResult(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-news', {
        body: { text: newsInput }
      });

      if (error) throw error;

      setVerificationResult(data);
      setShowFloatingResult(true);
      toast.success("Analysis complete! Click the button to see results.");
      
      // Store in verification history
      await supabase
        .from('verification_history')
        .insert({
          input_text: newsInput,
          ml_result: data.is_true,
          confidence_score: data.confidence,
          true_fact_summary: data.fact_summary,
          reference_sites: data.references
        });
      
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || "Failed to verify news. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleShowResult = () => {
    setShowFloatingResult(false);
    // Scroll to result
    document.getElementById('verification-result')?.scrollIntoView({ behavior: 'smooth' });
  };

  const trendingCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    color: cat.slug === 'politics' ? 'bg-gradient-to-br from-purple-400 to-pink-400' :
           cat.slug === 'science' ? 'bg-gradient-to-br from-blue-400 to-cyan-400' :
           cat.slug === 'tech' ? 'bg-gradient-to-br from-green-400 to-emerald-400' :
           'bg-gradient-to-br from-orange-400 to-red-400'
  }));

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <main className="container mx-auto px-4 pt-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl mb-8">
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              backgroundImage: `url(${heroBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 p-8 md:p-12">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                The Truth is Out There.
                <span className="block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Find It.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Verify news articles, detect misinformation, and discover the real story behind the headlines.
              </p>
            </div>
          </div>
        </section>

        {/* Verification Input */}
        <Card className="p-6 mb-8 shadow-[var(--shadow-medium)]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Verify News</h2>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Paste a news article URL or text to verify..."
                value={newsInput}
                onChange={(e) => setNewsInput(e.target.value)}
                className="flex-1 h-12"
              />
              <Button 
                onClick={handleVerify}
                disabled={isChecking}
                className="h-12 px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {isChecking ? "Checking..." : "Verify"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Verification Result */}
        {verificationResult && !showFloatingResult && (
          <section id="verification-result" className="mb-8">
            <VerificationResult result={verificationResult} />
          </section>
        )}

        {/* Trending Categories with Verified News */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Verified News by Category
            </h2>
          </div>
          
          {/* Category Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {trendingCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.slug)}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* News Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {verifiedNews[trendingCategories.find(c => c.slug === selectedCategory)?.id || '']?.slice(0, 6).map((news) => (
              <NewsCard
                key={news.id}
                title={news.title}
                snippet={news.snippet || ''}
                sourceName={news.source_name}
                sourceUrl={news.source_url}
                confidenceScore={news.confidence_score || 0}
                verifiedAt={news.verified_at}
              />
            )) || (
              <Card className="p-6 col-span-2 text-center text-muted-foreground">
                No verified news available in this category yet.
              </Card>
            )}
          </div>
        </section>

        {/* Recent Verifications */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Recent Verifications</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <GradientCard gradient="blue">
              <div className="flex items-start gap-3 text-white">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Climate Report Verified</h3>
                  <p className="text-sm text-white/90 mb-3">
                    Recent UN climate report data confirmed by multiple scientific sources.
                  </p>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Verified as True</span>
                </div>
              </div>
            </GradientCard>

            <GradientCard gradient="coral">
              <div className="flex items-start gap-3 text-white">
                <XCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Health Claim Debunked</h3>
                  <p className="text-sm text-white/90 mb-3">
                    Viral social media post about miracle cure found to be false.
                  </p>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Detected as False</span>
                </div>
              </div>
            </GradientCard>
          </div>
        </section>
      </main>

      {/* Floating Result Button */}
      {showFloatingResult && verificationResult && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <Button
            onClick={handleShowResult}
            className="h-14 px-6 text-base shadow-[var(--shadow-glow)] bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Analysis Complete - View Results
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
