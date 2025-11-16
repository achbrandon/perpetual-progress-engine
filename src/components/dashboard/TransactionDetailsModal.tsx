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

  // Replace "Admin" with "Deposit" anywhere in description
  let cleanDescription = transaction.description;
  if (cleanDescription) {
    cleanDescription = cleanDescription.replace(/\bAdmin\b/gi, 'Deposit');
  }

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
    // Replace "Admin" with "Deposit" in description for receipt
    let cleanDescription = transaction.description;
    if (cleanDescription) {
      cleanDescription = cleanDescription.replace(/\bAdmin\b/gi, 'Deposit');
    }
    
    const formattedDate = new Date(transaction.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = new Date(transaction.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Generate a professional HTML receipt
    const receiptHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VaultBank Transaction Receipt</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        .amount-section {
            background: #f8f9fa;
            padding: 40px;
            text-align: center;
            border-bottom: 3px solid #e9ecef;
        }
        .amount-label {
            font-size: 14px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .amount {
            font-size: 48px;
            font-weight: 700;
            color: ${isDebit ? '#dc3545' : '#28a745'};
            margin: 0;
        }
        .details-section {
            padding: 40px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #495057;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .detail-value {
            color: #212529;
            text-align: right;
            font-weight: 500;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-completed {
            background: #d4edda;
            color: #155724;
        }
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px 40px;
            text-align: center;
            border-top: 3px solid #e9ecef;
        }
        .footer p {
            color: #6c757d;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .footer strong {
            color: #495057;
        }
        .icon {
            width: 16px;
            height: 16px;
            display: inline-block;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .receipt-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <h1>🏦 VaultBank</h1>
            <p>Transaction Receipt</p>
        </div>
        
        <div class="amount-section">
            <div class="amount-label">Amount</div>
            <div class="amount">${isDebit ? '-' : '+'}$${Math.abs(parseFloat(transaction.amount)).toFixed(2)}</div>
        </div>
        
        <div class="details-section">
            <div class="detail-row">
                <div class="detail-label">
                    <span class="icon">#</span>
                    Transaction ID
                </div>
                <div class="detail-value">${transaction.id}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">
                    <span class="icon">📅</span>
                    Date & Time
                </div>
                <div class="detail-value">${formattedDate}<br/>${formattedTime}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">
                    <span class="icon">📄</span>
                    Type
                </div>
                <div class="detail-value">${transaction.type.toUpperCase()}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">
                    <span class="icon">✓</span>
                    Status
                </div>
                <div class="detail-value">
                    <span class="status-badge status-${transaction.status}">${transaction.status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Description</div>
                <div class="detail-value">${cleanDescription || 'N/A'}</div>
            </div>
            
            ${transaction.category ? `
            <div class="detail-row">
                <div class="detail-label">Category</div>
                <div class="detail-value">${transaction.category}</div>
            </div>
            ` : ''}
            
            ${transaction.merchant ? `
            <div class="detail-row">
                <div class="detail-label">Merchant</div>
                <div class="detail-value">${transaction.merchant}</div>
            </div>
            ` : ''}
            
            ${transaction.reference_number ? `
            <div class="detail-row">
                <div class="detail-label">Reference Number</div>
                <div class="detail-value">${transaction.reference_number}</div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p><strong>VaultBank - Secure Banking Solutions</strong></p>
            <p>This is an official transaction receipt.</p>
            <p>For support, contact us at info@vaulteonline.com</p>
            <p style="margin-top: 16px; font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-${transaction.id}.html`;
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
              <p className="text-sm text-muted-foreground capitalize">{cleanDescription}</p>
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
