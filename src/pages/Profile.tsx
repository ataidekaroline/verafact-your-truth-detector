import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, LogOut, Settings, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { UsernameEditDialog } from "@/components/UsernameEditDialog";
import { VerificationHistoryCard } from "@/components/VerificationHistoryCard";

export default function Profile() {
  const navigate = useNavigate();
  const [isFetching, setIsFetching] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [usernameUpdatedAt, setUsernameUpdatedAt] = useState<string | null>(null);
  const [trueCount, setTrueCount] = useState(0);
  const [falseCount, setFalseCount] = useState(0);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      setEmail(user.email || "");

      // Get profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, username_updated_at, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
        setUsernameUpdatedAt(profile.username_updated_at);
        setAvatarUrl(profile.avatar_url);
      }

      // Get verification history
      const { data: verifications } = await supabase
        .from("verification_history")
        .select("*")
        .eq("user_id", user.id)
        .order("verified_at", { ascending: false })
        .limit(10);

      if (verifications) {
        const trueVerifications = verifications.filter(v => v.ml_result === true).length;
        const falseVerifications = verifications.filter(v => v.ml_result === false).length;
        setTrueCount(trueVerifications);
        setFalseCount(falseVerifications);
        setVerificationHistory(verifications);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error: any) {
      toast.error("Error signing out");
      console.error("Logout error:", error);
    }
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

  const getInitials = (name: string) => {
    if (name.startsWith("@user")) {
      return "U" + name.slice(5, 6);
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      
      <main className="container mx-auto px-4 pt-28 max-w-5xl">
        {/* Profile Header */}
        <Card className="p-8 mb-8 shadow-[var(--shadow-medium)] border-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <Avatar className="w-24 h-24 shadow-[var(--shadow-medium)]">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={username} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-3xl">
                    {getInitials(username)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-2">{username}</h1>
                <p className="text-muted-foreground text-base">{email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-12 w-12"
              onClick={() => navigate("/settings")}
            >
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
                <p className="text-5xl font-bold text-success">{trueCount}</p>
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
                <p className="text-5xl font-bold text-destructive">{falseCount}</p>
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


        {/* Recent Verification History */}
        {verificationHistory.length > 0 && (
          <Card className="p-8 mb-8 shadow-[var(--shadow-medium)] border-2">
            <h2 className="text-2xl font-bold mb-6">Recent Verifications</h2>
            <div className="space-y-4">
              {verificationHistory.map((verification) => (
                <VerificationHistoryCard
                  key={verification.id}
                  inputText={verification.input_text}
                  mlResult={verification.ml_result}
                  confidenceScore={verification.confidence_score}
                  verifiedAt={verification.verified_at}
                  referenceSites={verification.reference_sites}
                />
              ))}
            </div>
          </Card>
        )}

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

      <UsernameEditDialog
        open={showUsernameDialog}
        onOpenChange={setShowUsernameDialog}
        currentUsername={username}
        lastUpdated={usernameUpdatedAt}
        onSuccess={loadUserData}
      />

      <BottomNav />
    </div>
  );
}
