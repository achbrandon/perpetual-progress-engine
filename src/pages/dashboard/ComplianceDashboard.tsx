import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Shield, 
  User, 
  FileText, 
  Clock,
  Server,
  Hash,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ComplianceCase {
  id: string;
  case_id: string;
  client_name: string;
  account_type: string;
  status: string;
  kyc_verification: string;
  account_documentation: string;
  beneficiary_confirmation: string;
  aml_screening: string;
  account_reference_number: string;
  reviewer_name: string;
  reviewer_title: string;
  employee_id: string;
  reviewer_ip: string;
  review_timestamp: string;
  system_name: string;
  compliance_log_hash: string;
}

const ComplianceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [complianceCase, setComplianceCase] = useState<ComplianceCase | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(true);

  useEffect(() => {
    fetchComplianceCase();
  }, []);

  const fetchComplianceCase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("compliance_cases")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setComplianceCase(data);
    } catch (error) {
      console.error("Error fetching compliance case:", error);
      toast({
        title: "Error",
        description: "Failed to load compliance information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("cleared") || statusLower.includes("approved")) {
      return "bg-green-600 text-white";
    } else if (statusLower.includes("pending")) {
      return "bg-yellow-500 text-white";
    } else if (statusLower.includes("rejected") || statusLower.includes("failed")) {
      return "bg-red-600 text-white";
    }
    return "bg-primary text-primary-foreground";
  };

  const getCheckStatus = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (["completed", "verified", "validated", "passed"].includes(statusLower)) {
      return { icon: CheckCircle2, color: "text-green-600", label: status.charAt(0).toUpperCase() + status.slice(1) };
    }
    return { icon: Clock, color: "text-yellow-500", label: "Pending" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!complianceCase) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Compliance Cases</h2>
            <p className="text-muted-foreground">You don't have any active compliance cases.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kycStatus = getCheckStatus(complianceCase.kyc_verification);
  const docStatus = getCheckStatus(complianceCase.account_documentation);
  const beneficiaryStatus = getCheckStatus(complianceCase.beneficiary_confirmation);
  const amlStatus = getCheckStatus(complianceCase.aml_screening);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Compliance Dashboard</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Compliance Approved Banner */}
        <Card className={`${getStatusColor(complianceCase.status)} border-0`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg uppercase tracking-wide">
                  {complianceCase.status.includes("Cleared") ? "COMPLIANCE APPROVED" : complianceCase.status.toUpperCase()}
                </h2>
                <button 
                  onClick={() => setShowCaseDetails(!showCaseDetails)}
                  className="flex items-center gap-1 text-sm opacity-90 hover:opacity-100"
                >
                  {showCaseDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  CASE DETAILS
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Details */}
        {showCaseDetails && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">CASE ID:</span>
                <span className="font-bold">{complianceCase.case_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">CLIENT:</span>
                <span className="font-medium">{complianceCase.client_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">ACCOUNT TYPE:</span>
                <span className="font-medium">{complianceCase.account_type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">ACCOUNT REF:</span>
                <span className="font-bold">{complianceCase.account_reference_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">STATUS:</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {complianceCase.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Review */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase tracking-wide">Compliance Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <kycStatus.icon className={`h-5 w-5 ${kycStatus.color}`} />
              <span className="flex-1">KYC Verification:</span>
              <span className={`font-medium ${kycStatus.color}`}>{kycStatus.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <docStatus.icon className={`h-5 w-5 ${docStatus.color}`} />
              <span className="flex-1">Account Documentation:</span>
              <span className={`font-medium ${docStatus.color}`}>{docStatus.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <beneficiaryStatus.icon className={`h-5 w-5 ${beneficiaryStatus.color}`} />
              <span className="flex-1">Beneficiary Confirmation:</span>
              <span className={`font-medium ${beneficiaryStatus.color}`}>{beneficiaryStatus.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <amlStatus.icon className={`h-5 w-5 ${amlStatus.color}`} />
              <span className="flex-1">AML Screening:</span>
              <span className={`font-medium ${amlStatus.color}`}>{amlStatus.label}</span>
            </div>
          </CardContent>
        </Card>

        {/* Reviewed By Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase tracking-wide">Reviewed By:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{complianceCase.reviewer_name}</span>
              <span className="text-muted-foreground">- {complianceCase.reviewer_title}</span>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Employee ID: {complianceCase.employee_id}</span>
            </div>
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span>IP: {complianceCase.reviewer_ip}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Timestamp: {complianceCase.review_timestamp ? new Date(complianceCase.review_timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span>System: {complianceCase.system_name}</span>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Log Hash */}
        <div className="text-center text-xs text-muted-foreground py-2">
          <div className="flex items-center justify-center gap-1">
            <Hash className="h-3 w-3" />
            <span>Compliance Log Hash: {complianceCase.compliance_log_hash}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
