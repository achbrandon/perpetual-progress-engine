import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminAccessDialog({ open, onOpenChange }: AdminAccessDialogProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== "Ultimateunique1#") {
      toast.error("Invalid password");
      setPassword("");
      return;
    }

    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Please sign in first");
        setLoading(false);
        return;
      }

      // Grant admin role to user
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: user.id,
          role: "admin",
        }, {
          onConflict: "user_id"
        });

      if (roleError) {
        console.error("Error granting admin role:", roleError);
        toast.error("Failed to grant admin access. Please try again.");
        setLoading(false);
        return;
      }

      toast.success("Admin access granted!");
      onOpenChange(false);
      setPassword("");
      navigate("/admin");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Access</DialogTitle>
          <DialogDescription>
            Enter the admin password to continue
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPassword("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Granting access..." : "Access Admin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
