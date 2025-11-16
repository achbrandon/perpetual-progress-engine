import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TransferReceiptProps {
  open: boolean;
  onClose: () => void;
  transferData: {
    type: 'internal' | 'domestic' | 'international';
    fromAccount: string;
    toAccount: string;
    recipientName?: string;
    recipientBank?: string;
    amount: string;
    currency: string;
    reference: string;
    date: Date;
    fee?: string;
    swiftCode?: string;
    routingNumber?: string;
    accountNumber?: string;
  };
}

export function TransferReceipt({ open, onClose, transferData }: TransferReceiptProps) {
  const handleDownload = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {transferData.type === 'internal' ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Transfer Successful
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                Transfer Submitted
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <Card className="p-6 space-y-6 print:shadow-none">
          <div className="text-center border-b pb-6">
            <h2 className="text-3xl font-bold text-primary mb-2">VaultBank</h2>
            <p className="text-muted-foreground">Transaction Receipt</p>
          </div>

          {(transferData.type === 'domestic' || transferData.type === 'international') && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <h3 className="font-bold text-yellow-800 dark:text-yellow-500">Transaction Pending</h3>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Your {transferData.type} transfer is being processed. 
                You will be notified once the transaction is completed.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Reference Number</span>
              <span className="font-mono font-bold">{transferData.reference}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">{format(transferData.date, 'PPpp')}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Transfer Type</span>
              <span className="font-medium capitalize">{transferData.type}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">From Account</span>
              <span className="font-medium">{transferData.fromAccount}</span>
            </div>

            {transferData.type === 'internal' && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">To Account</span>
                <span className="font-medium">{transferData.toAccount}</span>
              </div>
            )}

            {(transferData.type === 'domestic' || transferData.type === 'international') && (
              <>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Recipient Name</span>
                  <span className="font-medium">{transferData.recipientName}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Recipient Bank</span>
                  <span className="font-medium">{transferData.recipientBank}</span>
                </div>

                {transferData.routingNumber && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Routing Number</span>
                    <span className="font-mono">{transferData.routingNumber}</span>
                  </div>
                )}

                {transferData.swiftCode && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">SWIFT Code</span>
                    <span className="font-mono">{transferData.swiftCode}</span>
                  </div>
                )}

                {transferData.accountNumber && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Account Number</span>
                    <span className="font-mono">****{transferData.accountNumber.slice(-4)}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center py-2 border-b bg-muted/50 px-3 rounded">
              <span className="font-semibold">Amount</span>
              <span className="text-2xl font-bold text-primary">
                {transferData.currency} {transferData.amount}
              </span>
            </div>

            {transferData.fee && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Transfer Fee</span>
                <span className="font-medium">{transferData.currency} {transferData.fee}</span>
              </div>
            )}

            <div className="pt-4 text-center text-sm text-muted-foreground">
              <p>Thank you for banking with VaultBank</p>
              <p className="mt-2">For support, contact us at info@vaulteonline.com</p>
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
