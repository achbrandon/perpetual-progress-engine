import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, FileText, CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminApplications() {
  const [accountApps, setAccountApps] = useState<any[]>([]);
  const [cardApps, setCardApps] = useState<any[]>([]);
  const [loanApps, setLoanApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('applications-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'account_applications' }, () => {
        fetchApplications();
        toast.info("New account application received!");
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
      const [accountRes, cardRes, loanRes] = await Promise.all([
        supabase
          .from("account_applications")
          .select(`
            *,
            profiles!account_applications_user_id_fkey(full_name, email, phone_number)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("card_applications")
          .select(`
            *,
            profiles!card_applications_user_id_fkey(full_name, email, phone_number)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("loan_applications")
          .select(`
            *,
            profiles!loan_applications_user_id_fkey(full_name, email, phone_number)
          `)
          .order("created_at", { ascending: false }),
      ]);

      setAccountApps(accountRes.data || []);
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
      const { error } = await supabase
        .from("account_applications")
        .update({ status: "approved" })
        .eq("id", appId);

      if (error) throw error;
      toast.success("Account application approved!");
      fetchApplications();
    } catch (error) {
      toast.error("Failed to approve application");
    }
  };

  const handleRejectAccount = async (appId: string) => {
    try {
      const { error } = await supabase
        .from("account_applications")
        .update({ status: "rejected" })
        .eq("id", appId);

      if (error) throw error;
      toast.success("Account application rejected");
      fetchApplications();
    } catch (error) {
      toast.error("Failed to reject application");
    }
  };

  const handleApproveCard = async (appId: string) => {
    try {
      const { error } = await supabase
        .from("card_applications")
        .update({ application_status: "approved" })
        .eq("id", appId);

      if (error) throw error;
      toast.success("Card application approved!");
      fetchApplications();
    } catch (error) {
      toast.error("Failed to approve card application");
    }
  };

  const handleRejectCard = async (appId: string) => {
    try {
      const { error } = await supabase
        .from("card_applications")
        .update({ application_status: "rejected" })
        .eq("id", appId);

      if (error) throw error;
      toast.success("Card application rejected");
      fetchApplications();
    } catch (error) {
      toast.error("Failed to reject card application");
    }
  };

  const handleApproveLoan = async (appId: string) => {
    try {
      const { error } = await supabase
        .from("loan_applications")
        .update({ status: "approved" })
        .eq("id", appId);

      if (error) throw error;
      toast.success("Loan application approved!");
      fetchApplications();
    } catch (error) {
      toast.error("Failed to approve loan application");
    }
  };

  const handleRejectLoan = async (appId: string) => {
    try {
      const { error } = await supabase
        .from("loan_applications")
        .update({ status: "rejected" })
        .eq("id", appId);

      if (error) throw error;
      toast.success("Loan application rejected");
      fetchApplications();
    } catch (error) {
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
            Account Applications ({accountApps.filter(a => a.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="cards" className="data-[state=active]:bg-slate-700">
            Card Applications ({cardApps.filter(a => a.application_status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="loans" className="data-[state=active]:bg-slate-700">
            Loan Applications ({loanApps.filter(a => a.status === 'pending').length})
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
                      {app.profiles?.full_name || app.full_name || "N/A"}
                    </TableCell>
                    <TableCell className="text-slate-300">{app.profiles?.email || app.email}</TableCell>
                    <TableCell className="text-slate-300">{app.profiles?.phone_number || app.phone || "N/A"}</TableCell>
                    <TableCell className="text-slate-300">{app.account_type}</TableCell>
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
                    <TableCell className="text-slate-300">{app.profiles?.email}</TableCell>
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
                    <TableCell className="text-slate-300">{app.profiles?.email}</TableCell>
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
