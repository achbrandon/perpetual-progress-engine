import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Hash,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";

interface TransactionDetailsModalProps {
  transaction: any;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({ transaction, open, onClose }: TransactionDetailsModalProps) {
  if (!transaction) return null;

  const isDebit = transaction.type === 'debit' || transaction.type === 'payment' || transaction.type === 'withdrawal' || transaction.type === 'fee';
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      disputed: "outline"
    };
    return <Badge variant={variants[status] || "secondary"} className="capitalize">{status}</Badge>;
  };

  const handleDownloadReceipt = () => {
    // Generate a simple receipt
    const receiptContent = `
VaultBank Transaction Receipt
================================

Transaction ID: ${transaction.id}
Date: ${new Date(transaction.created_at).toLocaleString()}
Type: ${transaction.type.toUpperCase()}
Amount: $${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
Description: ${transaction.description}
Status: ${transaction.status.toUpperCase()}

${transaction.category ? `Category: ${transaction.category}` : ''}
${transaction.merchant ? `Merchant: ${transaction.merchant}` : ''}
${transaction.reference_number ? `Reference: ${transaction.reference_number}` : ''}

Thank you for banking with VaultBank!
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-${transaction.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              isDebit 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : 'bg-green-100 dark:bg-green-900/20'
            }`}>
              {isDebit ? (
                <ArrowUpRight className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : (
                <ArrowDownLeft className="h-6 w-6 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold">Transaction Details</h3>
              <p className="text-sm text-muted-foreground font-normal">
                {new Date(transaction.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Section */}
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Amount</p>
            <p className={`text-4xl font-bold ${
              isDebit 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {isDebit ? '-' : '+'}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
            </p>
          </div>

          <Separator />

          {/* Transaction Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>Transaction ID</span>
              </div>
              <p className="text-sm font-mono text-xs break-all">{transaction.id}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Date & Time</span>
              </div>
              <p className="text-sm font-medium">
                {new Date(transaction.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Type</span>
              </div>
              <p className="text-sm font-medium capitalize">{transaction.type}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getStatusIcon(transaction.status)}
                <span>Status</span>
              </div>
              <div>{getStatusBadge(transaction.status)}</div>
            </div>
          </div>

          <Separator />

          {/* Description & Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Description</h4>
              <p className="text-sm text-muted-foreground">{transaction.description}</p>
            </div>

            {transaction.category && (
              <div className="space-y-2">
                <h4 className="font-semibold">Category</h4>
                <Badge variant="outline" className="capitalize">
                  {transaction.category}
                </Badge>
              </div>
            )}

            {transaction.merchant && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Merchant
                </h4>
                <p className="text-sm">{transaction.merchant}</p>
              </div>
            )}

            {transaction.reference_number && (
              <div className="space-y-2">
                <h4 className="font-semibold">Reference Number</h4>
                <p className="text-sm font-mono">{transaction.reference_number}</p>
              </div>
            )}

            {transaction.crypto_currency && (
              <div className="space-y-2">
                <h4 className="font-semibold">Cryptocurrency</h4>
                <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500">
                  {transaction.crypto_currency}
                </Badge>
              </div>
            )}

            {transaction.destination_wallet_address && (
              <div className="space-y-2">
                <h4 className="font-semibold">Destination Wallet</h4>
                <p className="text-sm font-mono break-all text-muted-foreground">
                  {transaction.destination_wallet_address}
                </p>
              </div>
            )}

            {transaction.proof_of_payment_url && (
              <div className="space-y-2">
                <h4 className="font-semibold">Proof of Payment</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(transaction.proof_of_payment_url, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Document
                </Button>
              </div>
            )}

            {transaction.auto_complete_at && transaction.status === 'pending' && (
              <div className="space-y-2 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                  <Clock className="h-4 w-4" />
                  Scheduled Completion
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This transaction will be automatically completed on{' '}
                  {new Date(transaction.auto_complete_at).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadReceipt} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline" onClick={handlePrintReceipt} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
