import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CheckAdmin() {
  const [loading, setLoading] = useState(true);
  const [adminAccounts, setAdminAccounts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccounts();
  }, []);

  const checkAdminAccounts = async () => {
    try {
      // Query user_roles table for admin role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "admin");

      if (rolesError) {
        console.error("Error fetching admin roles:", rolesError);
        setLoading(false);
        return;
      }

      if (roles && roles.length > 0) {
        // Get profile details for each admin user
        const userIds = roles.map((r) => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, qr_verified, created_at")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        }

        setAdminAccounts(profiles || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Account Status</h1>
          <Button variant="outline" onClick={() => navigate("/bank/login")}>
            Back to Login
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Checking admin accounts...</p>
            </CardContent>
          </Card>
        ) : adminAccounts.length === 0 ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <XCircle className="h-16 w-16 text-destructive mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Admin Accounts Found</h2>
              <p className="text-muted-foreground mb-6 text-center">
                No admin accounts have been created yet. Create one to get started.
              </p>
              <Button onClick={() => navigate("/bank/create-admin-account")}>
                Create Admin Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Admin Accounts Found ({adminAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminAccounts.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        {account.full_name || "No name"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {account.email || "No email"}
                      </p>
                    </div>
                    <Badge variant="default">Admin</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {account.qr_verified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">QR Verified</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-600">Not QR Verified</span>
                        </>
                      )}
                    </div>
                    {account.created_at && (
                      <span className="text-muted-foreground">
                        Created: {new Date(account.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {account.id}
                  </p>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/bank/login")}
                >
                  Go to Login Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
