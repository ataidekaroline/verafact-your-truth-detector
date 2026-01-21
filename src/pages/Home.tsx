import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { HeroSection } from "@/components/HeroSection";
import { NewsVerifier } from "@/components/NewsVerifier";
import { LinkAnalyzer } from "@/components/LinkAnalyzer";
import { VerifiedNewsFeed } from "@/components/VerifiedNewsFeed";
import { SecurityTips } from "@/components/SecurityTips";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Link, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 safe-bottom">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 max-w-7xl">
        {/* Hero Section */}
        <HeroSection />

        {/* Analysis Tools */}
        <section className="mb-8 sm:mb-12">
          <Tabs defaultValue="news" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-14 mb-6 bg-muted/50">
              <TabsTrigger value="news" className="h-12 text-sm sm:text-base gap-2 data-[state=active]:shadow-[var(--shadow-glow)]">
                <Search className="w-4 h-4" />
                Verificar Notícia
              </TabsTrigger>
              <TabsTrigger value="link" className="h-12 text-sm sm:text-base gap-2 data-[state=active]:shadow-[var(--shadow-glow)]">
                <Link className="w-4 h-4" />
                Analisar Link
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="news" className="mt-0">
              <NewsVerifier />
            </TabsContent>
            
            <TabsContent value="link" className="mt-0">
              <LinkAnalyzer />
            </TabsContent>
          </Tabs>
        </section>

        {/* Quick Security Tips */}
        <SecurityTips />

        {/* Verified News Feed */}
        <VerifiedNewsFeed />
      </main>

      <BottomNav />
    </div>
  );
}
