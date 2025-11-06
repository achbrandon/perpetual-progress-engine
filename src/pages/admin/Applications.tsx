import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, FileText, CreditCard, Eye } from "lucide-react";
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

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700">
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
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/50"
                            onClick={() => {
                              setSelectedApp(app);
                              setAppDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-white">Application Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-slate-400">Full Name</Label>
                                <p className="text-white font-medium">{app.full_name}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">Email</Label>
                                <p className="text-white font-medium">{app.email}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">Phone</Label>
                                <p className="text-white font-medium">{app.phone || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">Date of Birth</Label>
                                <p className="text-white font-medium">{app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString() : "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">SSN</Label>
                                <p className="text-white font-medium">{app.ssn ? `***-**-${app.ssn.slice(-4)}` : "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">Account Type</Label>
                                <p className="text-white font-medium">{app.account_type}</p>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-slate-400">Address</Label>
                                <p className="text-white font-medium">{app.address || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">City</Label>
                                <p className="text-white font-medium">{app.city || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">State</Label>
                                <p className="text-white font-medium">{app.state || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">Zip Code</Label>
                                <p className="text-white font-medium">{app.zip_code || "N/A"}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">Status</Label>
                                <div className="mt-1">{getStatusBadge(app.status)}</div>
                              </div>
                              <div>
                                <Label className="text-slate-400">Email Verified</Label>
                                <p className="text-white font-medium">{app.email_verified ? "Yes" : "No"}</p>
                              </div>
                              <div>
                                <Label className="text-slate-400">QR Verified</Label>
                                <p className="text-white font-medium">{app.qr_code_verified ? "Yes" : "No"}</p>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-slate-400">Application Date</Label>
                                <p className="text-white font-medium">{new Date(app.created_at).toLocaleString()}</p>
                              </div>

                              {/* ID Verification Documents */}
                              <div className="col-span-2 pt-4 border-t border-slate-700">
                                <Label className="text-slate-400 text-lg mb-3 block">ID Verification Documents</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {app.id_front_url && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">ID Front</Label>
                                      <a href={app.id_front_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                                        <img src={app.id_front_url} alt="ID Front" className="w-full h-32 object-cover rounded border border-slate-600 hover:opacity-80 transition" />
                                      </a>
                                    </div>
                                  )}
                                  {app.id_back_url && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">ID Back</Label>
                                      <a href={app.id_back_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                                        <img src={app.id_back_url} alt="ID Back" className="w-full h-32 object-cover rounded border border-slate-600 hover:opacity-80 transition" />
                                      </a>
                                    </div>
                                  )}
                                  {app.selfie_url && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Selfie</Label>
                                      <a href={app.selfie_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                                        <img src={app.selfie_url} alt="Selfie" className="w-full h-32 object-cover rounded border border-slate-600 hover:opacity-80 transition" />
                                      </a>
                                    </div>
                                  )}
                                  {app.address_proof_url && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Address Proof</Label>
                                      <a href={app.address_proof_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                                        <img src={app.address_proof_url} alt="Address Proof" className="w-full h-32 object-cover rounded border border-slate-600 hover:opacity-80 transition" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {app.status === "pending" && (
                              <div className="flex gap-2 pt-4">
                                <Button
                                  className="flex-1 bg-green-500 hover:bg-green-600"
                                  onClick={() => {
                                    handleApproveAccount(app.id);
                                    setAppDialogOpen(false);
                                  }}
                                >
                                  Approve Application
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/50"
                                  onClick={() => {
                                    handleRejectAccount(app.id);
                                    setAppDialogOpen(false);
                                  }}
                                >
                                  Reject Application
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
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
