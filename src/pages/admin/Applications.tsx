import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, FileText, CreditCard, Eye, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminApplications() {
  const [accountApps, setAccountApps] = useState<any[]>([]);
  const [accountRequests, setAccountRequests] = useState<any[]>([]);
  const [cardApps, setCardApps] = useState<any[]>([]);
  const [loanApps, setLoanApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [appDialogOpen, setAppDialogOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('applications-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'account_applications' }, () => {
        fetchApplications();
        toast.info("New account application received!");
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'account_requests' }, () => {
        fetchApplications();
        toast.info("New account request received!");
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'card_applications' }, () => {
        fetchApplications();
        toast.info("New card application received!");
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'loan_applications' }, () => {
        fetchApplications();
        toast.info("New loan application received!");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApplications = async () => {
    try {
      const [accountRes, requestsRes, cardRes, loanRes] = await Promise.all([
        supabase
          .from("account_applications")
          .select("*")
          .order("created_at", { ascending: false}),
        supabase
          .from("account_requests")
          .select(`
            *,
            profiles(full_name, email)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("card_applications")
          .select(`
            *,
            profiles(full_name, email, phone_number)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("loan_applications")
          .select(`
            *,
            profiles(full_name, email, phone_number)
          `)
          .order("created_at", { ascending: false }),
      ]);

      console.log('📊 Fetched applications:', {
        accounts: accountRes.data?.length || 0,
        requests: requestsRes.data?.length || 0,
        cards: cardRes.data?.length || 0,
        loans: loanRes.data?.length || 0
      });

      setAccountApps(accountRes.data || []);
      setAccountRequests(requestsRes.data || []);
      setCardApps(cardRes.data || []);
      setLoanApps(loanRes.data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAccount = async (appId: string) => {
    try {
      const app = accountApps.find(a => a.id === appId);
      if (!app) throw new Error("Application not found");

      // Generate unique account number
      const accountNumber = `${Math.floor(100000000 + Math.random() * 900000000)}`;

      // Create the account
      const { error: accountError } = await supabase
        .from("accounts")
        .insert({
          user_id: app.user_id,
          account_number: accountNumber,
          account_type: app.account_type,
          balance: 0,
          status: "active"
        });

      if (accountError) throw accountError;

      // Update application status
      const { error } = await supabase
        .from("account_applications")
        .update({ status: "approved" })
        .eq("id", appId);

      if (error) throw error;

      // Send approval email
      await supabase.functions.invoke("send-application-decision", {
        body: {
          applicantName: app.full_name,
          applicantEmail: app.email,
          applicationType: "account",
          decision: "approved",
          accountType: app.account_type,
        },
      });

      toast.success("Account created and approval email sent!");
      fetchApplications();
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("Failed to approve application");
    }
  };

  const handleRejectAccount = async (appId: string) => {
    try {
      const app = accountApps.find(a => a.id === appId);
      if (!app) throw new Error("Application not found");

      const { error } = await supabase
        .from("account_applications")
        .update({ status: "rejected" })
        .eq("id", appId);

      if (error) throw error;

      // Send rejection email
      await supabase.functions.invoke("send-application-decision", {
        body: {
          applicantName: app.full_name,
          applicantEmail: app.email,
          applicationType: "account",
          decision: "rejected",
          accountType: app.account_type,
        },
      });

      toast.success("Account application rejected and email sent");
      fetchApplications();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const request = accountRequests.find(r => r.id === requestId);
      if (!request) throw new Error("Request not found");

      // Generate unique account number
      const accountNumber = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      // Create the account - trigger will automatically create account_details
      const { error: accountError } = await supabase
        .from("accounts")
        .insert({
          user_id: request.user_id,
          account_number: accountNumber,
          account_type: request.account_type,
          balance: 0,
          status: "active"
        });

      if (accountError) throw accountError;

      // Update request status
      const { error } = await supabase
        .from("account_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (error) throw error;

      // Send approval email
      await supabase.functions.invoke("send-application-decision", {
        body: {
          applicantName: request.profiles?.full_name || "Customer",
          applicantEmail: request.profiles?.email || "",
          applicationType: "account",
          decision: "approved",
          accountType: request.account_type,
        },
      });

      toast.success("Account created and approval email sent!");
      fetchApplications();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const request = accountRequests.find(r => r.id === requestId);
      if (!request) throw new Error("Request not found");

      const { error } = await supabase
        .from("account_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      // Send rejection email
      await supabase.functions.invoke("send-application-decision", {
        body: {
          applicantName: request.profiles?.full_name || "Customer",
          applicantEmail: request.profiles?.email || "",
          applicationType: "account",
          decision: "rejected",
          accountType: request.account_type,
        },
      });

      toast.success("Account request rejected and email sent");
      fetchApplications();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  const handleApproveCard = async (appId: string) => {
    try {
      const app = cardApps.find(a => a.id === appId);
      if (!app) throw new Error("Application not found");

      const { error } = await supabase
        .from("card_applications")
        .update({ application_status: "approved" })
        .eq("id", appId);

      if (error) throw error;

      // Send approval email
      await supabase.functions.invoke("send-application-decision", {
        body: {
          applicantName: app.profiles?.full_name || app.full_name || "Customer",
          applicantEmail: app.profiles?.email || app.email || "",
          applicationType: "card",
          decision: "approved",
          cardType: app.card_type,
        },
      });

      toast.success("Card application approved and email sent!");
      fetchApplications();
    } catch (error) {
      console.error("Error approving card application:", error);
      toast.error("Failed to approve card application");
    }
  };

  const handleRejectCard = async (appId: string) => {
    try {
      const app = cardApps.find(a => a.id === appId);
      if (!app) throw new Error("Application not found");

      const { error } = await supabase
        .from("card_applications")
        .update({ application_status: "rejected" })
        .eq("id", appId);

      if (error) throw error;

      // Send rejection email
      await supabase.functions.invoke("send-application-decision", {
        body: {
          applicantName: app.profiles?.full_name || app.full_name || "Customer",
          applicantEmail: app.profiles?.email || app.email || "",
          applicationType: "card",
          decision: "rejected",
          cardType: app.card_type,
        },
      });

      toast.success("Card application rejected and email sent");
      fetchApplications();
    } catch (error) {
      console.error("Error rejecting card application:", error);
      toast.error("Failed to reject card application");
    }
  };

  const handleApproveLoan = async (appId: string) => {
    try {
      const app = loanApps.find(a => a.id === appId);
      if (!app) throw new Error("Application not found");

      const { error } = await supabase
        .from("loan_applications")
        .update({ status: "approved" })
        .eq("id", appId);

      if (error) throw error;

      // Send approval email
      await supabase.functions.invoke("send-application-decision", {
        body: {
          applicantName: app.profiles?.full_name || app.full_name || "Customer",
          applicantEmail: app.profiles?.email || app.email || "",
          applicationType: "loan",
          decision: "approved",
          loanAmount: app.loan_amount,
        },
      });

      toast.success("Loan application approved and email sent!");
      fetchApplications();
    } catch (error) {
      console.error("Error approving loan application:", error);
      toast.error("Failed to approve loan application");
    }
  };

  const handleRejectLoan = async (appId: string) => {
    try {
      const app = loanApps.find(a => a.id === appId);
      if (!app) throw new Error("Application not found");

      const { error } = await supabase
        .from("loan_applications")
        .update({ status: "rejected" })
        .eq("id", appId);

      if (error) throw error;

      // Send rejection email
      await supabase.functions.invoke("send-application-decision", {
        body: {
          applicantName: app.profiles?.full_name || app.full_name || "Customer",
          applicantEmail: app.profiles?.email || app.email || "",
          applicationType: "loan",
          decision: "rejected",
          loanAmount: app.loan_amount,
        },
      });

      toast.success("Loan application rejected and email sent");
      fetchApplications();
    } catch (error) {
      console.error("Error rejecting loan application:", error);
      toast.error("Failed to reject loan application");
    }
  };

  const handleDeleteAccountApp = async (appId: string) => {
    if (!confirm("Are you sure you want to permanently delete this application? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("account_applications")
        .delete()
        .eq("id", appId);

      if (error) throw error;

      toast.success("Application deleted permanently");
      fetchApplications();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    }
  };

  const handleDeleteAccountRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to permanently delete this request? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("account_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Request deleted permanently");
      fetchApplications();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request");
    }
  };

  const handleDeleteCardApp = async (appId: string) => {
    if (!confirm("Are you sure you want to permanently delete this card application? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("card_applications")
        .delete()
        .eq("id", appId);

      if (error) throw error;

      toast.success("Card application deleted permanently");
      fetchApplications();
    } catch (error) {
      console.error("Error deleting card application:", error);
      toast.error("Failed to delete card application");
    }
  };

  const handleDeleteLoanApp = async (appId: string) => {
    if (!confirm("Are you sure you want to permanently delete this loan application? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("loan_applications")
        .delete()
        .eq("id", appId);

      if (error) throw error;

      toast.success("Loan application deleted permanently");
      fetchApplications();
    } catch (error) {
      console.error("Error deleting loan application:", error);
      toast.error("Failed to delete loan application");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-white">Loading applications...</div>;
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Applications Management
        </h1>
        <p className="text-slate-300">Review and approve customer applications</p>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="requests" className="data-[state=active]:bg-slate-700">
            Account Requests
            {accountRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">
                {accountRequests.filter(r => r.status === 'pending').length} New
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="accounts" className="data-[state=active]:bg-slate-700">
            Account Applications 
            {accountApps.filter(a => a.status === 'pending').length > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">
                {accountApps.filter(a => a.status === 'pending').length} New
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cards" className="data-[state=active]:bg-slate-700">
            Card Applications 
            {cardApps.filter(a => a.application_status === 'pending').length > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">
                {cardApps.filter(a => a.application_status === 'pending').length} New
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="loans" className="data-[state=active]:bg-slate-700">
            Loan Applications 
            {loanApps.filter(a => a.status === 'pending').length > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">
                {loanApps.filter(a => a.status === 'pending').length} New
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">User Name</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Account Type</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      No account requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  accountRequests.map((request) => (
                    <TableRow key={request.id} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell className="font-medium text-white">
                        {request.profiles?.full_name || "N/A"}
                      </TableCell>
                      <TableCell className="text-slate-300">{request.profiles?.email || "N/A"}</TableCell>
                      <TableCell className="text-slate-300 capitalize">{request.account_type.replace('_', ' ')}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/30"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-slate-700/50 hover:bg-slate-700 text-red-400 border-slate-600"
                          onClick={() => handleDeleteAccountRequest(request.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Applicant</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Phone</TableHead>
                  <TableHead className="text-slate-300">Account Type</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountApps.map((app) => (
                  <TableRow key={app.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="font-medium text-white">
                      {app.full_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-slate-300">{app.email || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">{app.phone || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">{app.account_type}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog open={appDialogOpen && selectedApp?.id === app.id} onOpenChange={(open) => {
                        setAppDialogOpen(open);
                        if (!open) setSelectedApp(null);
                      }}>
...
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/50"
                            onClick={() => handleApproveAccount(app.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/50"
                            onClick={() => handleRejectAccount(app.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-slate-700/50 hover:bg-slate-700 text-red-400 border-slate-600"
                        onClick={() => handleDeleteAccountApp(app.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="cards" className="mt-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Applicant</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Phone</TableHead>
                  <TableHead className="text-slate-300">Card Type</TableHead>
                  <TableHead className="text-slate-300">Credit Limit</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardApps.map((app) => (
                  <TableRow key={app.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="font-medium text-white">
                      {app.profiles?.full_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-slate-300">{app.profiles?.email || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">{app.profiles?.phone_number || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">{app.card_type}</TableCell>
                    <TableCell className="text-slate-300">
                      ${app.requested_credit_limit?.toLocaleString() || "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.application_status)}</TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {app.application_status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/50"
                            onClick={() => handleApproveCard(app.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/50"
                            onClick={() => handleRejectCard(app.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-slate-700/50 hover:bg-slate-700 text-red-400 border-slate-600"
                        onClick={() => handleDeleteCardApp(app.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="mt-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Applicant</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Phone</TableHead>
                  <TableHead className="text-slate-300">Loan Amount</TableHead>
                  <TableHead className="text-slate-300">Purpose</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanApps.map((app) => (
                  <TableRow key={app.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="font-medium text-white">
                      {app.profiles?.full_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-slate-300">{app.profiles?.email || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">{app.profiles?.phone_number || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">
                      ${app.loan_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-300">{app.loan_purpose}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/50"
                            onClick={() => handleApproveLoan(app.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/50"
                            onClick={() => handleRejectLoan(app.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-slate-700/50 hover:bg-slate-700 text-red-400 border-slate-600"
                        onClick={() => handleDeleteLoanApp(app.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
