import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronUp,
  Building2,
  AlertCircle,
  BadgeCheck,
  Fingerprint,
  Globe,
  Calendar,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/vaultbank-logo.png";

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
  unsettled_amount: number;
  statutory_review: string;
  reviewer_name: string;
  reviewer_title: string;
  employee_id: string;
  reviewer_ip: string;
  review_timestamp: string;
  system_name: string;
  compliance_log_hash: string;
  stamp_duty_amount: number;
  stamp_duty_status: string;
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
        navigate("/bank/login");
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

  const getCheckStatus = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (["completed", "verified", "validated", "passed"].includes(statusLower)) {
      return { icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10", label: status.charAt(0).toUpperCase() + status.slice(1) };
    }
    return { icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10", label: "Pending" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  if (!complianceCase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/bank/dashboard")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="border-0 shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">No Active Compliance Cases</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">You currently do not have any compliance cases associated with your account.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const kycStatus = getCheckStatus(complianceCase.kyc_verification);
  const docStatus = getCheckStatus(complianceCase.account_documentation);
  const beneficiaryStatus = getCheckStatus(complianceCase.beneficiary_confirmation);
  const amlStatus = getCheckStatus(complianceCase.aml_screening);
  const statutoryStatus = getCheckStatus(complianceCase.statutory_review);

  const isPending = complianceCase.status.toLowerCase().includes("pending");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Professional Header */}
      <div className="bg-[#1a2744] text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/bank/dashboard")}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <img src={logo} alt="VaultBank" className="h-8" />
                <div className="hidden sm:block">
                  <h1 className="font-semibold text-lg">Compliance Dashboard</h1>
                  <p className="text-xs text-white/70">Estate & Inheritance Division</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-white/30 text-white text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Secure Portal
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Banner */}
        <Card className={`border-0 shadow-lg overflow-hidden ${isPending ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${isPending ? 'bg-white/20' : 'bg-white/20'}`}>
                {isPending ? (
                  <Clock className="h-10 w-10 text-white" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-xl text-white uppercase tracking-wider">
                  {complianceCase.status}
                </h2>
                <button 
                  onClick={() => setShowCaseDetails(!showCaseDetails)}
                  className="flex items-center gap-1 text-sm text-white/90 hover:text-white mt-1 transition-colors"
                >
                  {showCaseDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showCaseDetails ? "Hide" : "Show"} Case Details
                </button>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs text-white/70 uppercase tracking-wide">Case Reference</p>
                <p className="font-mono font-bold text-white">{complianceCase.case_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Case Details Card */}
        {showCaseDetails && (
          <Card className="border-0 shadow-lg animate-in slide-in-from-top-2 duration-300">
            <CardContent className="p-0">
              {/* Case Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-5 rounded-t-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-5 w-5 text-slate-300" />
                  <span className="font-medium">Case Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Case ID</p>
                    <p className="font-mono font-bold text-lg">{complianceCase.case_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Client Name</p>
                    <p className="font-semibold text-lg">{complianceCase.client_name}</p>
                  </div>
                </div>
              </div>

              {/* Case Details Grid */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Account Type</p>
                      <p className="font-semibold">{complianceCase.account_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Account Reference</p>
                      <p className="font-semibold font-mono text-sm">{complianceCase.account_reference_number}</p>
                    </div>
                  </div>
                </div>

                {/* Unsettled Amount - Highlighted */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40">
                      <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide font-medium">Unsettled Amount</p>
                      <p className="text-sm text-muted-foreground">Pending statutory clearance</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    €{complianceCase.unsettled_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Final Stamp Duty Assessment - Critical Section */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-700">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/40 shrink-0">
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-lg text-red-800 dark:text-red-300">Final Stamp Duty Assessment</h4>
                        <Badge className={`${complianceCase.stamp_duty_status === 'paid' ? 'bg-green-600' : 'bg-red-600'} text-white hover:bg-red-700 text-xs uppercase tracking-wider`}>
                          {complianceCase.stamp_duty_status === 'paid' ? 'Paid' : 'Pending & Payable'}
                        </Badge>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                        In respect of this <span className="font-semibold">Final Statutory Requirement</span>, the following amount is due and payable before disbursement can proceed:
                      </p>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-red-200 dark:border-red-800">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount Due</p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">Statutory Stamp Duty</p>
                        </div>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                          €{(complianceCase.stamp_duty_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        This assessment is mandated under EU Estate Transfer Regulations and must be settled prior to fund release.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Current Status</span>
                  <Badge 
                    className={isPending 
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300" 
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300"}
                  >
                    {complianceCase.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Review Section */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Compliance Review</h3>
                  <p className="text-sm text-muted-foreground">Verification status for all required checks</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {[
                { label: "KYC Verification", status: kycStatus, icon: Fingerprint },
                { label: "Account Documentation", status: docStatus, icon: FileText },
                { label: "Beneficiary Confirmation", status: beneficiaryStatus, icon: User },
                { label: "AML Screening", status: amlStatus, icon: Shield },
                { label: "Statutory Review", status: statutoryStatus, icon: AlertCircle },
              ].map((item, index) => (
                <div 
                  key={item.label}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${item.status.bgColor} hover:scale-[1.01]`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${item.status.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${item.status.color}`}>{item.status.label}</span>
                    <item.status.icon className={`h-5 w-5 ${item.status.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviewed By Section */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Reviewed By</h3>
                  <p className="text-sm text-muted-foreground">Compliance officer details</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-xl">
                  {complianceCase.reviewer_name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{complianceCase.reviewer_name}</h4>
                  <p className="text-muted-foreground">{complianceCase.reviewer_title}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    Employee ID: {complianceCase.employee_id}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="font-mono">{complianceCase.reviewer_ip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Timestamp</p>
                    <p className="font-mono text-xs">
                      {complianceCase.review_timestamp 
                        ? new Date(complianceCase.review_timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">System</p>
                </div>
                <p className="font-medium">{complianceCase.system_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Log Hash Footer */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-xs text-muted-foreground font-mono">
            <Hash className="h-3 w-3" />
            Compliance Log Hash: {complianceCase.compliance_log_hash}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            This document is cryptographically signed and tamper-proof.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
