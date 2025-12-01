import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Package, FileText, Mail } from "lucide-react";
import { format } from "date-fns";
import { JointAccountFlowDiagram } from "@/components/dashboard/JointAccountFlowDiagram";

interface JointRequest {
  id: string;
  account_id: string;
  partner_full_name: string;
  partner_email: string;
  deposit_amount: number;
  status: string;
  agreement_sent: boolean | null;
  documents_verified: boolean | null;
  activation_date: string | null;
  created_at: string;
}

interface Document {
  id: string;
  document_type: string;
  status: string;
  sent_to_email: string | null;
  shipped_to_address: string | null;
  tracking_number: string | null;
  signature_date: string | null;
  created_at: string;
}

export default function JointAccountStatus() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<JointRequest[]>([]);
  const [documents, setDocuments] = useState<Record<string, Document[]>>({});

  useEffect(() => {
    checkAuth();
    fetchRequests();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/bank/login");
    }
  };

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: requestsData, error: requestsError } = await supabase
        .from("joint_account_requests")
        .select("*")
        .eq("requester_user_id", user.id)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      setRequests(requestsData || []);

      // Fetch documents for each request
      if (requestsData && requestsData.length > 0) {
        const docsMap: Record<string, Document[]> = {};
        
        for (const request of requestsData) {
          const { data: docsData } = await supabase
            .from("joint_account_documents")
            .select("*")
            .eq("joint_request_id", request.id)
            .order("created_at", { ascending: false });

          if (docsData) {
            docsMap[request.id] = docsData;
          }
        }

        setDocuments(docsMap);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending Review" },
      documents_sent: { variant: "default" as const, label: "Documents Sent" },
      approved: { variant: "default" as const, label: "Approved" },
      rejected: { variant: "destructive" as const, label: "Rejected" },
      active: { variant: "default" as const, label: "Active" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "agreement_letter":
        return <Mail className="h-5 w-5" />;
      case "credit_card":
        return <Package className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <DashboardSidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center mb-6">
            <SidebarTrigger className="mr-4" />
            <div>
              <h1 className="text-3xl font-bold">Joint Account Status</h1>
              <p className="text-muted-foreground">Track your joint account requests and documents</p>
            </div>
          </div>

          <JointAccountFlowDiagram />

          {requests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No joint account requests found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Joint Account with {request.partner_full_name}</CardTitle>
                        <CardDescription>
                          Requested on {format(new Date(request.created_at), "MMM dd, yyyy")}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Partner Email</p>
                        <p className="font-medium">{request.partner_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Required Deposit</p>
                        <p className="font-medium">${request.deposit_amount.toFixed(2)}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Progress Status
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {request.agreement_sent ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className={request.agreement_sent ? "text-foreground" : "text-muted-foreground"}>
                            Agreement sent to both parties
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {request.documents_verified ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className={request.documents_verified ? "text-foreground" : "text-muted-foreground"}>
                            Documents received and verified
                          </span>
                        </div>
                        {request.activation_date && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>
                              Account activated on {format(new Date(request.activation_date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {documents[request.id] && documents[request.id].length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Shipment Tracking
                          </h4>
                          <div className="space-y-3">
                            {documents[request.id].map((doc) => (
                              <div key={doc.id} className="bg-muted p-3 rounded-lg">
                                <div className="flex items-start gap-3">
                                  {getDocumentIcon(doc.document_type)}
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {doc.document_type.replace(/_/g, " ").toUpperCase()}
                                    </p>
                                    {doc.shipped_to_address && (
                                      <p className="text-sm text-muted-foreground">
                                        Shipped to: {doc.shipped_to_address}
                                      </p>
                                    )}
                                    {doc.tracking_number && (
                                      <p className="text-sm">
                                        <strong>Tracking:</strong> {doc.tracking_number}
                                      </p>
                                    )}
                                    {doc.signature_date && (
                                      <p className="text-sm text-green-600">
                                        Signed on {format(new Date(doc.signature_date), "MMM dd, yyyy")}
                                      </p>
                                    )}
                                    <Badge variant="outline" className="mt-1">
                                      {doc.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
