import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Sparkles } from "lucide-react";

export function CategorizeTransactionsButton() {
  const [loading, setLoading] = useState(false);

  const handleCategorize = async () => {
    try {
      setLoading(true);
      toast.info("Analyzing your transactions...");

      const { data, error } = await supabase.functions.invoke('categorize-transactions', {
        method: 'POST'
      });

      if (error) {
        console.error('Error categorizing transactions:', error);
        toast.error("Failed to categorize transactions");
        return;
      }

      console.log('Categorization result:', data);
      
      if (data.updated > 0) {
        toast.success(`Successfully categorized ${data.updated} transactions! Refresh to see insights.`, {
          duration: 5000
        });
        
        // Refresh the page to show updated insights
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.info("All your transactions are already categorized!");
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while categorizing transactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCategorize}
      disabled={loading}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      {loading ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Categorize Transactions
        </>
      )}
    </Button>
  );
}
