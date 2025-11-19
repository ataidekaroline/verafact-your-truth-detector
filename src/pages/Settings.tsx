import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Upload, User, Bell, Lock, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UsernameEditDialog } from "@/components/UsernameEditDialog";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [usernameUpdatedAt, setUsernameUpdatedAt] = useState<string | null>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [verificationAlerts, setVerificationAlerts] = useState(true);

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

      setUserId(user.id);
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url, username_updated_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
        setAvatarUrl(profile.avatar_url);
        setUsernameUpdatedAt(profile.username_updated_at);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File must be an image");
        return;
      }

      setUploading(true);

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Profile picture updated!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      if (!avatarUrl) return;

      const filePath = avatarUrl.split("/").slice(-2).join("/");
      
      await supabase.storage.from("avatars").remove([filePath]);
      
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      setAvatarUrl(null);
      toast.success("Profile picture removed");
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("Failed to remove image");
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
    <div className="min-h-screen bg-background pb-24 sm:pb-28 md:pb-8">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 max-w-3xl">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        </div>

        {/* Profile Picture */}
        <Card className="p-6 sm:p-8 mb-5 sm:mb-6 shadow-[var(--shadow-medium)] border-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 shadow-[var(--shadow-medium)] flex-shrink-0">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={username} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl sm:text-3xl">
                  {getInitials(username)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 w-full">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Profile Picture</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Upload a profile picture. Max size 2MB.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  className="h-10 flex-1 sm:flex-initial min-w-[120px]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
                {avatarUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="h-10 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Account Information */}
        <Card className="p-6 sm:p-8 mb-5 sm:mb-6 shadow-[var(--shadow-medium)] border-2">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold">Account Information</h2>
          </div>
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
              <div className="flex gap-3">
                <Input
                  id="username"
                  value={username}
                  disabled
                  className="h-11 sm:h-12 bg-muted flex-1 text-sm sm:text-base"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowUsernameDialog(true)}
                  className="h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You can change your username once every 30 days
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="h-11 sm:h-12 bg-muted text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email
              </p>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 sm:p-8 mb-5 sm:mb-6 shadow-[var(--shadow-medium)] border-2">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold">Notifications</h2>
          </div>
          <div className="space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <Label htmlFor="email-notif" className="text-sm sm:text-base font-medium">
                  Email Notifications
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Receive verification updates via email
                </p>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                className="flex-shrink-0"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <Label htmlFor="push-notif" className="text-sm sm:text-base font-medium">
                  Push Notifications
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Get push notifications for important updates
                </p>
              </div>
              <Switch
                id="push-notif"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                className="flex-shrink-0"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <Label htmlFor="verify-alerts" className="text-sm sm:text-base font-medium">
                  Verification Alerts
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Alert me when verification completes
                </p>
              </div>
              <Switch
                id="verify-alerts"
                checked={verificationAlerts}
                onCheckedChange={setVerificationAlerts}
                className="flex-shrink-0"
              />
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6 sm:p-8 mb-5 sm:mb-6 shadow-[var(--shadow-medium)] border-2">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold">Privacy & Security</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <Button
              variant="outline"
              className="w-full h-11 sm:h-12 justify-start text-sm sm:text-base"
              onClick={() => navigate("/reset-password")}
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 sm:h-12 justify-start text-destructive hover:text-destructive text-sm sm:text-base"
            >
              Delete Account
            </Button>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-secondary shadow-[var(--shadow-glow)] mb-6"
          onClick={() => {
            toast.success("Settings saved successfully!");
          }}
        >
          Save Preferences
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
