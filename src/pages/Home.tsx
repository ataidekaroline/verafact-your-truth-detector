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
import { Search, CheckCircle, XCircle, AlertTriangle, TrendingUp, X, Landmark, Microscope, Cpu, HeartPulse } from "lucide-react";
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

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'politics':
        return <Landmark className="w-5 h-5" />;
      case 'science':
        return <Microscope className="w-5 h-5" />;
      case 'tech':
        return <Cpu className="w-5 h-5" />;
      case 'health':
        return <HeartPulse className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const trendingCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: getCategoryIcon(cat.slug),
    color: cat.slug === 'politics' ? 'bg-gradient-to-br from-purple-400 to-pink-400' :
           cat.slug === 'science' ? 'bg-gradient-to-br from-blue-400 to-cyan-400' :
           cat.slug === 'tech' ? 'bg-gradient-to-br from-green-400 to-emerald-400' :
           'bg-gradient-to-br from-orange-400 to-red-400'
  }));

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 max-w-7xl">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl mb-10 shadow-[var(--shadow-medium)]">
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              backgroundImage: `url(${heroBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 p-10 md:p-16">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                The Truth is Out There.
                <span className="block mt-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Find It.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Verify news articles, detect misinformation, and discover the real story behind the headlines.
              </p>
            </div>
          </div>
        </section>

        {/* Verification Input */}
        <Card className="p-8 mb-10 shadow-[var(--shadow-large)] border-2">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Verify News</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Paste a news article URL or text to verify..."
                value={newsInput}
                onChange={(e) => setNewsInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="flex-1 h-14 text-base px-6"
              />
              <Button 
                onClick={handleVerify}
                disabled={isChecking}
                className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[var(--shadow-glow)] whitespace-nowrap"
              >
                {isChecking ? "Checking..." : "Verify"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Verification Result */}
        {verificationResult && !showFloatingResult && (
          <section id="verification-result" className="mb-12 animate-in fade-in slide-in-from-top-5 duration-500">
            <VerificationResult result={verificationResult} />
          </section>
        )}

        {/* Trending Categories with Verified News */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Verified News by Category</h2>
          </div>
          
          {/* Category Tabs */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {trendingCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.slug)}
                className={`whitespace-nowrap h-12 px-6 text-base gap-2 transition-all ${
                  selectedCategory === category.slug 
                    ? 'shadow-[var(--shadow-glow)]' 
                    : ''
                }`}
              >
                {category.icon}
                {category.name}
              </Button>
            ))}
          </div>

          {/* News Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-5">
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
              <Card className="p-10 col-span-2 text-center">
                <div className="flex flex-col items-center gap-3">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground opacity-50" />
                  <p className="text-lg text-muted-foreground">No verified news available in this category yet.</p>
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* Recent Verifications Examples */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCircle className="w-7 h-7 text-primary" />
            </div>
            Recent Verifications
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <GradientCard gradient="blue">
              <div className="flex items-start gap-4 text-white p-2">
                <CheckCircle className="w-7 h-7 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-3">Climate Report Verified</h3>
                  <p className="text-sm text-white/90 mb-4 leading-relaxed">
                    Recent UN climate report data confirmed by multiple scientific sources.
                  </p>
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                    Verified as True
                  </Badge>
                </div>
              </div>
            </GradientCard>

            <GradientCard gradient="coral">
              <div className="flex items-start gap-4 text-white p-2">
                <XCircle className="w-7 h-7 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-3">Health Claim Debunked</h3>
                  <p className="text-sm text-white/90 mb-4 leading-relaxed">
                    Viral social media post about miracle cure found to be false.
                  </p>
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                    Detected as False
                  </Badge>
                </div>
              </div>
            </GradientCard>
          </div>
        </section>
      </main>

      {/* Floating Result Button */}
      {showFloatingResult && verificationResult && (
        <div className="fixed bottom-28 md:bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <Button
            onClick={handleShowResult}
            className="h-16 px-8 text-base font-semibold shadow-[var(--shadow-glow)] bg-gradient-to-r from-primary to-secondary hover:opacity-90 hover:scale-105 transition-all"
          >
            <CheckCircle className="w-6 h-6 mr-3" />
            Analysis Complete - View Results
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
