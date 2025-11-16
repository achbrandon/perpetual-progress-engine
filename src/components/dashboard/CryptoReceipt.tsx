import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Download, X, Bitcoin } from "lucide-react";
import { format } from "date-fns";

interface CryptoReceiptProps {
  open: boolean;
  onClose: () => void;
  transactionData: {
    type: 'deposit' | 'withdrawal';
    currency: string;
    amount: string;
    destinationAddress?: string;
    reference: string;
    date: Date;
    status: 'pending';
  };
}

export function CryptoReceipt({ open, onClose, transactionData }: CryptoReceiptProps) {
  const handleDownload = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Clock className="h-6 w-6 text-yellow-500" />
            Transaction Pending
          </DialogTitle>
        </DialogHeader>

        <Card className="p-6 space-y-6 print:shadow-none">
          <div className="text-center border-b pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Bitcoin className="h-8 w-8 text-orange-500" />
              <h2 className="text-3xl font-bold text-primary">VaultBank</h2>
            </div>
            <p className="text-muted-foreground">Crypto Transaction Receipt</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                Transaction Pending Verification
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                Your {transactionData.type} request has been submitted and is awaiting confirmation. 
                You will be notified once processed.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Reference Number</span>
              <span className="font-mono font-bold">{transactionData.reference}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">{format(transactionData.date, 'PPpp')}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Transaction Type</span>
              <span className="font-medium capitalize">{transactionData.type}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Cryptocurrency</span>
              <span className="font-medium">{transactionData.currency}</span>
            </div>

            {transactionData.destinationAddress && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Destination Address</span>
                <span className="font-mono text-sm">
                  {transactionData.destinationAddress.substring(0, 10)}...
                  {transactionData.destinationAddress.slice(-10)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b bg-muted/50 px-3 rounded">
              <span className="font-semibold">Amount</span>
              <span className="text-2xl font-bold text-primary">
                ${parseFloat(transactionData.amount).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 font-medium">
                <Clock className="h-4 w-4" />
                Pending
              </span>
            </div>

            <div className="pt-4 text-center text-sm text-muted-foreground">
              <p>Thank you for banking with VaultBank</p>
              <p className="mt-2">For support, contact us at info@vaulteonline.com</p>
              <p className="mt-2 text-xs">
                Processing time: {transactionData.type === 'deposit' ? '1-24 hours' : '1-48 hours'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
