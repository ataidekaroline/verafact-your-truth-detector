import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GradientCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, CheckCircle, XCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bg.png";

export default function Home() {
  const [newsInput, setNewsInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleVerify = async () => {
    if (!newsInput.trim()) {
      toast.error("Please enter some text or URL to verify");
      return;
    }

    setIsChecking(true);
    
    // Simulate API call - in real app, this would call the ML backend
    setTimeout(() => {
      setIsChecking(false);
      toast.success("Analysis complete! Check the results below.");
    }, 2000);
  };

  const trendingCategories = [
    { name: "Politics", color: "bg-gradient-to-br from-purple-400 to-pink-400" },
    { name: "Science", color: "bg-gradient-to-br from-blue-400 to-cyan-400" },
    { name: "Tech", color: "bg-gradient-to-br from-green-400 to-emerald-400" },
    { name: "Health", color: "bg-gradient-to-br from-orange-400 to-red-400" },
  ];

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

        {/* Trending Categories */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Trending Categories
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trendingCategories.map((category) => (
              <Card 
                key={category.name}
                className="p-6 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className={`w-12 h-12 rounded-xl ${category.color} mb-3`} />
                <h3 className="font-semibold">{category.name}</h3>
              </Card>
            ))}
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

      <BottomNav />
    </div>
  );
}
