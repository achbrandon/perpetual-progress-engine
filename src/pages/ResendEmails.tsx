import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

const ResendEmails = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleResendAll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('resend-all-verifications');
      
      if (error) throw error;
      
      setResults(data);
      toast.success(`Successfully sent ${data.results.filter((r: any) => r.status === 'sent').length} verification emails!`);
    } catch (error: any) {
      console.error('Error resending emails:', error);
      toast.error('Failed to resend emails: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-6">
          <Mail className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Resend Verification Emails</h1>
          <p className="text-muted-foreground">
            This will send verification emails to all unverified accounts
          </p>
        </div>

        <Button 
          onClick={handleResendAll} 
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Sending emails...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-5 w-5" />
              Resend All Verification Emails
            </>
          )}
        </Button>

        {results && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Results:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.results.map((result: any, index: number) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    result.status === 'sent' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.email}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      result.status === 'sent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                <strong>Total:</strong> {results.total} unverified accounts<br />
                <strong>Sent:</strong> {results.results.filter((r: any) => r.status === 'sent').length}<br />
                <strong>Failed:</strong> {results.results.filter((r: any) => r.status !== 'sent').length}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResendEmails;
