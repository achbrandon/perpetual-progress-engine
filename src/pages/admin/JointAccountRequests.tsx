import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, AlertCircle, Shield, Eye, FileText, Package } from "lucide-react";
import { createNotification, NotificationTemplates } from "@/lib/notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { notifyApproved, notifyRejected, notifyUnderReview, notifyActivated } from "@/lib/jointAccountNotifications";

interface JointAccountRequest {
  id: string;
  account_id: string;
  requester_user_id: string;
  partner_full_name: string;
  partner_email: string;
  partner_phone: string;
  partner_address: string;
  partner_ssn: string;
  partner_id_document_url: string | null;
  partner_drivers_license_url: string | null;
  deposit_amount: number;
  required_deposit_percentage: number;
  status: string;
  otp_verified: boolean | null;
  terms_accepted: boolean | null;
  created_at: string;
  updated_at: string;
}

interface AccountDetails {
  account_number: string;
  account_type: string;
  balance: number;
  user_email: string;
  user_name: string;
}

export default function JointAccountRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<JointAccountRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<JointAccountRequest | null>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    fetchRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('joint-account-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'joint_account_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("joint_account_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountDetails = async (accountId: string, requesterUserId: string) => {
    try {
      const { data: account } = await supabase
        .from("accounts")
        .select("account_number, account_type, balance")
        .eq("id", accountId)
        .single();

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", requesterUserId)
        .single();

      if (account && profile) {
        setAccountDetails({
          account_number: account.account_number,
          account_type: account.account_type,
          balance: account.balance,
          user_email: profile.email || "",
          user_name: profile.full_name || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching account details:", error);
    }
  };

  const handleViewDetails = async (request: JointAccountRequest) => {
    setSelectedRequest(request);
    await fetchAccountDetails(request.account_id, request.requester_user_id);
    setDetailsOpen(true);
  };

  const handleApprove = async (requestId: string) => {
    try {
      // Get the request details before updating
      const { data: request } = await supabase
        .from("joint_account_requests")
        .select("requester_user_id, partner_full_name")
        .eq("id", requestId)
        .single();

      const { error } = await supabase
        .from("joint_account_requests")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      // Create notification for the user using template
      if (request) {
        const notification = NotificationTemplates.jointAccountApproved(request.partner_full_name);
        await createNotification({
          userId: request.requester_user_id,
          ...notification,
        });

        // Send automated notifications to both parties
        try {
          await notifyApproved(requestId);
        } catch (notifError) {
          console.error('Failed to send automated notification:', notifError);
        }
      }

      toast({
        title: "Request Approved",
        description: "Joint account request has been approved. Both parties have been notified.",
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error approving request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      // Get the request details before updating
      const { data: request } = await supabase
        .from("joint_account_requests")
        .select("requester_user_id, partner_full_name")
        .eq("id", requestId)
        .single();

      const { error } = await supabase
        .from("joint_account_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      // Create notification for the user using template
      if (request) {
        const notification = NotificationTemplates.jointAccountRejected(request.partner_full_name);
        await createNotification({
          userId: request.requester_user_id,
          ...notification,
        });

        // Send automated notifications to both parties
        try {
          await notifyRejected(requestId);
        } catch (notifError) {
          console.error('Failed to send automated notification:', notifError);
        }
      }

      toast({
        title: "Request Rejected",
        description: "Joint account request has been rejected. Both parties have been notified.",
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error rejecting request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOtpStatusBadge = (verified: boolean | null) => {
    if (verified === null) {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-600"><AlertCircle className="w-3 h-3 mr-1" />Not Sent</Badge>;
    }
    return verified 
      ? <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600"><Shield className="w-3 h-3 mr-1" />Verified</Badge>
      : <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-600"><Clock className="w-3 h-3 mr-1" />Pending Verification</Badge>;
  };

  if (loading) {
    return (
      <ThemeProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background">
            <AdminSidebar />
            <main className="flex-1 p-8">
              <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AdminSidebar />
          <main className="flex-1">
            <div className="border-b bg-card/50">
              <div className="flex h-16 items-center px-8 gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold">Joint Account Requests</h1>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{requests.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {requests.filter(r => r.status === "pending").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">OTP Verified</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {requests.filter(r => r.otp_verified === true).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Joint Account Requests</CardTitle>
                  <CardDescription>Manage and track joint account holder requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner Name</TableHead>
                        <TableHead>Partner Email</TableHead>
                        <TableHead>Deposit Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>OTP Status</TableHead>
                        <TableHead>Terms</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No joint account requests found
                          </TableCell>
                        </TableRow>
                      ) : (
                        requests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.partner_full_name}</TableCell>
                            <TableCell>{request.partner_email}</TableCell>
                            <TableCell>${request.deposit_amount.toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>{getOtpStatusBadge(request.otp_verified)}</TableCell>
                            <TableCell>
                              {request.terms_accepted ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />Accepted
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-600">
                                  <XCircle className="w-3 h-3 mr-1" />Not Accepted
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{format(new Date(request.created_at), "MMM dd, yyyy")}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(request)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Details
                                </Button>
                                {request.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-green-500/10 text-green-600 border-green-600 hover:bg-green-500/20"
                                      onClick={() => handleApprove(request.id)}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-red-500/10 text-red-600 border-red-600 hover:bg-red-500/20"
                                      onClick={() => handleReject(request.id)}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Joint Account Request Details</DialogTitle>
              <DialogDescription>Complete information about this joint account request</DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6">
                {/* Account Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Account Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-medium">{accountDetails?.account_number || "Loading..."}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Type</p>
                      <p className="font-medium">{accountDetails?.account_type.replace('_', ' ').toUpperCase() || "Loading..."}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="font-medium">${accountDetails?.balance.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Holder</p>
                      <p className="font-medium">{accountDetails?.user_name || "Loading..."}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Holder Email</p>
                      <p className="font-medium">{accountDetails?.user_email || "Loading..."}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Partner Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Partner Information</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{selectedRequest.partner_full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedRequest.partner_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedRequest.partner_phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">SSN</p>
                      <p className="font-medium">{selectedRequest.partner_ssn}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedRequest.partner_address}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Request Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Request Status</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">OTP Verification</p>
                      <div className="mt-1">{getOtpStatusBadge(selectedRequest.otp_verified)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Terms Accepted</p>
                      <div className="mt-1">
                        {selectedRequest.terms_accepted ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-600">
                            <XCircle className="w-3 h-3 mr-1" />No
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Required Deposit</p>
                      <p className="font-medium">${selectedRequest.deposit_amount.toFixed(2)} ({(selectedRequest.required_deposit_percentage * 100).toFixed(1)}%)</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{format(new Date(selectedRequest.created_at), "MMM dd, yyyy HH:mm")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{format(new Date(selectedRequest.updated_at), "MMM dd, yyyy HH:mm")}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">ID Document</p>
                      {selectedRequest.partner_id_document_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedRequest.partner_id_document_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-2" />
                            View Document
                          </a>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not uploaded</p>
                      )}
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Driver's License</p>
                      {selectedRequest.partner_drivers_license_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedRequest.partner_drivers_license_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-2" />
                            View Document
                          </a>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not uploaded</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedRequest.status === "pending" && (
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      variant="outline"
                      className="bg-green-500/10 text-green-600 border-green-600 hover:bg-green-500/20"
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setDetailsOpen(false);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Request
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-red-500/10 text-red-600 border-red-600 hover:bg-red-500/20"
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setDetailsOpen(false);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Request
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </ThemeProvider>
  );
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
