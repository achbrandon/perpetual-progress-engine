import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Download, Calendar } from "lucide-react";

export default function StatementGenerator() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [filters, setFilters] = useState({
    accountId: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/bank/login");
      return;
    }
    setUser(user);
    fetchData(user.id);
  };

  const fetchData = async (userId: string) => {
    try {
      const { data: accountsData } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");

      if (accountsData) setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!filters.accountId || !filters.startDate || !filters.endDate) {
      toast.error("Please select account and date range");
      return;
    }

    try {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", filters.accountId)
        .gte("transaction_date", filters.startDate)
        .lte("transaction_date", filters.endDate)
        .order("transaction_date", { ascending: true });

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
    }
  };

  const generateStatement = async () => {
    if (!filters.accountId || !filters.startDate || !filters.endDate) {
      toast.error("Please select account and date range");
      return;
    }

    setGenerating(true);

    try {
      await fetchTransactions();

      // Generate HTML for the statement
      const account = accounts.find(a => a.id === filters.accountId);
      if (!account) return;

      const statementHTML = generateStatementHTML(account, transactions);

      // Create a downloadable file
      const blob = new Blob([statementHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statement_${account.account_name}_${filters.startDate}_to_${filters.endDate}.html`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Statement generated and downloaded!");
    } catch (error) {
      console.error("Error generating statement:", error);
      toast.error("Failed to generate statement");
    } finally {
      setGenerating(false);
    }
  };

  const generateStatementHTML = (account: any, transactions: any[]) => {
    const startBalance = parseFloat(account.balance);
    const endBalance = parseFloat(account.available_balance);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bank Statement</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .bank-name {
      font-size: 28px;
      font-weight: bold;
      color: #0066cc;
    }
    .statement-info {
      margin: 20px 0;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
    }
    .info-label {
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #0066cc;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .credit {
      color: #00aa00;
      font-weight: bold;
    }
    .debit {
      color: #cc0000;
      font-weight: bold;
    }
    .summary {
      margin-top: 30px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 5px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 16px;
    }
    .final-balance {
      font-size: 20px;
      font-weight: bold;
      color: #0066cc;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #0066cc;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="bank-name">VAULTBANK</div>
    <div>Financial Statement</div>
  </div>

  <div class="statement-info">
    <div class="info-row">
      <span class="info-label">Account Holder:</span>
      <span>${user?.email || ''}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Account Name:</span>
      <span>${account.account_name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Account Number:</span>
      <span>****${account.account_number.slice(-4)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Statement Period:</span>
      <span>${filters.startDate} to ${filters.endDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Generated:</span>
      <span>${new Date().toLocaleString()}</span>
    </div>
  </div>

  <h2>Transaction History</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Type</th>
        <th>Amount</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.map(tx => `
        <tr>
          <td>${new Date(tx.transaction_date).toLocaleDateString()}</td>
          <td>${tx.description}</td>
          <td>${tx.transaction_type}</td>
          <td class="${tx.transaction_type === 'credit' ? 'credit' : 'debit'}">
            ${tx.transaction_type === 'credit' ? '+' : '-'}$${parseFloat(tx.amount).toFixed(2)}
          </td>
          <td>${tx.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary">
    <h3>Account Summary</h3>
    <div class="summary-row">
      <span>Opening Balance:</span>
      <span>$${startBalance.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Total Credits:</span>
      <span class="credit">+$${transactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Total Debits:</span>
      <span class="debit">-$${transactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}</span>
    </div>
    <div class="summary-row final-balance">
      <span>Closing Balance:</span>
      <span>$${endBalance.toFixed(2)}</span>
    </div>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
    <p>VaultBank Financial, N.A. | 806 E Exchange St, Brodhead, WI 53520-0108, US</p>
    <p>Member FDIC | Equal Housing Lender</p>
  </div>
</body>
</html>
    `;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          Generate Bank Statement
        </h1>
        <p className="text-muted-foreground mt-1">Download detailed statements for your transactions</p>
      </div>

      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-500/10 to-teal-500/10">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Statement Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Account</label>
                <Select value={filters.accountId} onValueChange={(value) => setFilters({ ...filters, accountId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>

            <Button
              onClick={generateStatement}
              disabled={generating || !filters.accountId || !filters.startDate || !filters.endDate}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              {generating ? (
                "Generating Statement..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download Statement
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Statement Information</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Statements include all transactions within the selected date range</li>
                <li>• Download format: HTML (can be printed or saved as PDF)</li>
                <li>• Statements include opening and closing balances</li>
                <li>• Perfect for tax purposes, loan applications, and record keeping</li>
                <li>• All statements are generated in real-time with current data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}