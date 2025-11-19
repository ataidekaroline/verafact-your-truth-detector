import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, LogOut, Settings, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export default function Profile() {
  const navigate = useNavigate();
  const [isFetching, setIsFetching] = useState(false);

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleFetchNews = async () => {
    setIsFetching(true);
    try {
      toast.loading("Fetching and verifying news from CNN Brasil...");
      
      const { data, error } = await supabase.functions.invoke('fetch-cnn-news');
      
      if (error) throw error;
      
      toast.dismiss();
      toast.success(`Successfully verified ${data.total_verified} news items!`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Failed to fetch news");
    } finally {
      setIsFetching(false);
    }
  };

  const recentVerifications = [
    { id: 1, title: "Climate Change Report", result: true, date: "2 hours ago" },
    { id: 2, title: "Health Miracle Claim", result: false, date: "5 hours ago" },
    { id: 3, title: "Economic Forecast", result: true, date: "1 day ago" },
    { id: 4, title: "Celebrity News", result: false, date: "2 days ago" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      
      <main className="container mx-auto px-4 pt-28 max-w-5xl">
        {/* Profile Header */}
        <Card className="p-8 mb-8 shadow-[var(--shadow-medium)] border-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <Avatar className="w-24 h-24 shadow-[var(--shadow-medium)]">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-3xl">
                  JD
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-2">John Doe</h1>
                <p className="text-muted-foreground text-base">john.doe@example.com</p>
              </div>
            </div>
            <Button variant="outline" size="lg" className="h-12 w-12">
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </Card>

        {/* Verification Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-8 bg-gradient-to-br from-success/10 to-success/5 border-success/20 border-2 shadow-[var(--shadow-medium)]">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-success/20 rounded-2xl">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Verified as True</p>
                <p className="text-5xl font-bold text-success">187</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 border-2 shadow-[var(--shadow-medium)]">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-destructive/20 rounded-2xl">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Detected as False</p>
                <p className="text-5xl font-bold text-destructive">42</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card className="p-8 mb-8 shadow-[var(--shadow-medium)] border-2">
          <h2 className="text-2xl font-bold mb-5">Admin Actions</h2>
          <Button 
            onClick={handleFetchNews}
            disabled={isFetching}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-secondary shadow-[var(--shadow-glow)]"
          >
            <RefreshCw className={`w-6 h-6 mr-3 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Fetching News...' : 'Fetch Latest CNN Brasil News'}
          </Button>
          <p className="text-sm text-muted-foreground mt-3 text-center">
            Manually trigger news collection and verification from CNN Brasil RSS feed
          </p>
        </Card>

        {/* Recent Activity */}
        <Card className="p-8 mb-8 shadow-[var(--shadow-medium)] border-2">
          <h2 className="text-2xl font-bold mb-6">Recent Verifications</h2>
          <div className="space-y-4">
            {recentVerifications.map((verification) => (
              <div 
                key={verification.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  {verification.result ? (
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{verification.title}</p>
                    <p className="text-sm text-muted-foreground">{verification.date}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  verification.result 
                    ? "bg-success/20 text-success" 
                    : "bg-destructive/20 text-destructive"
                }`}>
                  {verification.result ? "True" : "False"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full h-12"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
