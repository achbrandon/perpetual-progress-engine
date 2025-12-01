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
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Please sign in first");
        setLoading(false);
        return;
      }

      // Verify password on server
      const { data, error } = await supabase.functions.invoke('verify-admin-password', {
        body: { password, userId: user.id }
      });

      if (error || !data?.success) {
        toast.error(data?.error || "Invalid password");
        setPassword("");
        setLoading(false);
        return;
      }

      toast.success("Admin access granted!");
      onOpenChange(false);
      setPassword("");
      navigate("/bank/admin");
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
