import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Download, FileText, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransactionExportModalProps {
  open: boolean;
  onClose: () => void;
}

export function TransactionExportModal({ open, onClose }: TransactionExportModalProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (startDate > endDate) {
      toast.error("Start date must be before end date");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch transactions within date range
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        toast.error("No transactions found in the selected date range");
        return;
      }

      if (exportFormat === "csv") {
        exportToCSV(transactions);
      } else {
        exportToPDF(transactions);
      }

      toast.success(`Successfully exported ${transactions.length} transactions`);
      onClose();
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export transactions");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (transactions: any[]) => {
    // CSV headers
    const headers = [
      "Date",
      "Time",
      "Transaction ID",
      "Type",
      "Description",
      "Amount",
      "Status",
      "Category",
      "Reference"
    ];

    // Convert transactions to CSV rows
    const rows = transactions.map(t => [
      format(new Date(t.created_at), "yyyy-MM-dd"),
      format(new Date(t.created_at), "HH:mm:ss"),
      t.id,
      t.type,
      t.description,
      parseFloat(t.amount).toFixed(2),
      t.status,
      t.category || "",
      t.reference_number || ""
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${format(startDate!, "yyyy-MM-dd")}_to_${format(endDate!, "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (transactions: any[]) => {
    // Calculate totals
    const credits = transactions
      .filter(t => t.type === 'credit' || t.type === 'deposit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const debits = transactions
      .filter(t => t.type === 'debit' || t.type === 'payment' || t.type === 'withdrawal' || t.type === 'fee')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Transaction History</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .header h1 {
      margin: 0;
      color: #2563eb;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .summary {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-item h3 {
      margin: 0;
      font-size: 14px;
      color: #666;
      font-weight: normal;
    }
    .summary-item p {
      margin: 5px 0 0 0;
      font-size: 24px;
      font-weight: bold;
    }
    .credit { color: #10b981; }
    .debit { color: #ef4444; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #2563eb;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background: #f9fafb;
    }
    .amount-credit {
      color: #10b981;
      font-weight: 600;
    }
    .amount-debit {
      color: #ef4444;
      font-weight: 600;
    }
    .status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .status-failed {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>VaultBank Transaction History</h1>
    <p>Period: ${format(startDate!, "MMMM dd, yyyy")} - ${format(endDate!, "MMMM dd, yyyy")}</p>
    <p>Generated on ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
  </div>

  <div class="summary">
    <div class="summary-item">
      <h3>Total Transactions</h3>
      <p>${transactions.length}</p>
    </div>
    <div class="summary-item">
      <h3>Total Credits</h3>
      <p class="credit">+$${credits.toFixed(2)}</p>
    </div>
    <div class="summary-item">
      <h3>Total Debits</h3>
      <p class="debit">-$${debits.toFixed(2)}</p>
    </div>
    <div class="summary-item">
      <h3>Net Amount</h3>
      <p class="${credits >= debits ? 'credit' : 'debit'}">$${(credits - debits).toFixed(2)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Type</th>
        <th>Amount</th>
        <th>Status</th>
        <th>Reference</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.map(t => {
        const isDebit = t.type === 'debit' || t.type === 'payment' || t.type === 'withdrawal' || t.type === 'fee';
        return `
          <tr>
            <td>${format(new Date(t.created_at), "MMM dd, yyyy")}<br><small style="color: #666;">${format(new Date(t.created_at), "h:mm a")}</small></td>
            <td>${t.description}</td>
            <td style="text-transform: capitalize;">${t.type}</td>
            <td class="${isDebit ? 'amount-debit' : 'amount-credit'}">
              ${isDebit ? '-' : '+'}$${Math.abs(parseFloat(t.amount)).toFixed(2)}
            </td>
            <td>
              <span class="status status-${t.status}">${t.status}</span>
            </td>
            <td style="font-size: 11px; font-family: monospace;">${t.reference_number || '-'}</td>
          </tr>
        `;
      }).join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>VaultBank - Secure Banking Services</p>
    <p>This is an automatically generated document. For questions, please contact support.</p>
  </div>
</body>
</html>
    `;

    // Create a blob and download as HTML (which can be printed as PDF)
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
    
    // Also offer direct download
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${format(startDate!, "yyyy-MM-dd")}_to_${format(endDate!, "yyyy-MM-dd")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Transactions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as "csv" | "pdf")}>
              <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">CSV (Excel)</p>
                    <p className="text-xs text-muted-foreground">Best for data analysis and spreadsheets</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex-1 cursor-pointer flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-medium">PDF (Printable)</p>
                    <p className="text-xs text-muted-foreground">Formatted report ready to print</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Quick Date Presets */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today);
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  setStartDate(lastMonth);
                  setEndDate(today);
                }}
              >
                Last Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const last3Months = new Date(today);
                  last3Months.setMonth(last3Months.getMonth() - 3);
                  setStartDate(last3Months);
                  setEndDate(today);
                }}
              >
                Last 3 Months
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const last6Months = new Date(today);
                  last6Months.setMonth(last6Months.getMonth() - 6);
                  setStartDate(last6Months);
                  setEndDate(today);
                }}
              >
                Last 6 Months
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const lastYear = new Date(today);
                  lastYear.setFullYear(lastYear.getFullYear() - 1);
                  setStartDate(lastYear);
                  setEndDate(today);
                }}
              >
                Last Year
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={loading || !startDate || !endDate}
            className="flex-1"
          >
            {loading ? (
              "Exporting..."
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
