import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UsernameEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
  lastUpdated: string | null;
  onSuccess: () => void;
}

export const UsernameEditDialog = ({ 
  open, 
  onOpenChange, 
  currentUsername, 
  lastUpdated,
  onSuccess 
}: UsernameEditDialogProps) => {
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canUpdate = () => {
    if (!lastUpdated) return true;
    
    const lastUpdateDate = new Date(lastUpdated);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceUpdate >= 30;
  };

  const daysUntilNextUpdate = () => {
    if (!lastUpdated) return 0;
    
    const lastUpdateDate = new Date(lastUpdated);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, 30 - daysSinceUpdate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canUpdate()) {
      toast.error(`You can change your username again in ${daysUntilNextUpdate()} days`);
      return;
    }

    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ 
          username: newUsername.trim(),
          username_updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("This username is already taken");
        } else {
          toast.error("Failed to update username");
        }
        return;
      }

      toast.success("Username updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Username</DialogTitle>
          <DialogDescription>
            {canUpdate() 
              ? "You can change your username once every 30 days."
              : `You can change your username again in ${daysUntilNextUpdate()} days.`
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
                disabled={!canUpdate() || isSubmitting}
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canUpdate() || isSubmitting}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              {isSubmitting ? "Updating..." : "Update Username"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
