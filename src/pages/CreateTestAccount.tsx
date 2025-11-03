import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Loader2, Copy, CheckCircle } from "lucide-react";

const CreateTestAccount = () => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-test-account');
      
      if (error) throw error;
      
      setCredentials(data.credentials);
      toast.success(data.message);
    } catch (error: any) {
      console.error('Error creating test account:', error);
      toast.error('Failed to create test account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-6">
          <UserPlus className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Create Test Account</h1>
          <p className="text-muted-foreground">
            Generate a fully functional test account with funds for testing
          </p>
        </div>

        <Button 
          onClick={handleCreateAccount} 
          disabled={loading}
          size="lg"
          className="w-full mb-6"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-5 w-5" />
              Create Test Account
            </>
          )}
        </Button>

        {credentials && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Account Created Successfully!</h3>
              </div>
              <p className="text-sm text-green-700">
                Your test account has been created with $50,000 in checking and $100,000 in savings.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-card border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-mono font-medium">{credentials.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.email, 'Email')}
                  >
                    {copied === 'Email' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-card border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Password</p>
                    <p className="font-mono font-medium">{credentials.password}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.password, 'Password')}
                  >
                    {copied === 'Password' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-card border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Security PIN</p>
                    <p className="font-mono font-medium">{credentials.pin}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(credentials.pin, 'PIN')}
                  >
                    {copied === 'PIN' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Save these credentials! You can now use this account to test the email verification system after configuring your Resend API key.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CreateTestAccount;
