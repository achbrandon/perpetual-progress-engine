import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, Edit, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminWalletSettings() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from("crypto_deposit_addresses")
      .select("*")
      .order("currency");
    
    if (data) setAddresses(data);
  };

  const startEdit = (address: any) => {
    setEditing(address.id);
    setEditValue(address.wallet_address);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const saveEdit = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("crypto_deposit_addresses")
        .update({
          wallet_address: editValue,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Wallet address updated successfully");
      setEditing(null);
      setEditValue("");
      fetchAddresses();
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update wallet address");
    }
  };

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Wallet Management</h1>
        <p className="text-slate-300">Manage crypto deposit addresses for all users</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Crypto Deposit Addresses
          </CardTitle>
          <p className="text-slate-400 text-sm">
            These addresses will be shown to all users when they deposit crypto
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {address.currency}
                  </Badge>
                  <span className="text-slate-400 text-sm">{address.network}</span>
                </div>
                <Badge variant={address.is_active ? "default" : "secondary"}>
                  {address.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {editing === address.id ? (
                <div className="space-y-3">
                  <Label className="text-white">Wallet Address</Label>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white font-mono"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveEdit(address.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-sm text-white bg-slate-900 px-3 py-2 rounded border border-slate-600 font-mono break-all">
                      {address.wallet_address}
                    </code>
                    <Button
                      onClick={() => startEdit(address)}
                      size="sm"
                      variant="ghost"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  {address.updated_at && (
                    <p className="text-xs text-slate-500">
                      Last updated: {new Date(address.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-blue-900/20 border-blue-700">
        <CardContent className="pt-6">
          <p className="text-blue-200 text-sm">
            <strong>Important:</strong> Changes to wallet addresses will be immediately visible to all users. 
            Make sure to verify addresses carefully before saving. All crypto deposits will be directed to these addresses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
