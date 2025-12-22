import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, FileText, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ComplianceCase {
  id: string;
  user_id: string;
  case_id: string;
  client_name: string;
  account_type: string;
  status: string;
  unsettled_amount: number;
  stamp_duty_amount: number;
  stamp_duty_status: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

export default function ComplianceManagement() {
  const [complianceCases, setComplianceCases] = useState<ComplianceCase[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<ComplianceCase | null>(null);
  const [stampDutyAmount, setStampDutyAmount] = useState("");
  const [stampDutyStatus, setStampDutyStatus] = useState("pending");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Create new case form
  const [newCaseUserId, setNewCaseUserId] = useState("");
  const [newCaseId, setNewCaseId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newAccountType, setNewAccountType] = useState("Estate / Inheritance");
  const [newUnsettledAmount, setNewUnsettledAmount] = useState("");
  const [newStampDutyAmount, setNewStampDutyAmount] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [casesResponse, profilesResponse] = await Promise.all([
        supabase.from("compliance_cases").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email")
      ]);

      if (casesResponse.error) throw casesResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;

      setComplianceCases(casesResponse.data || []);
      setProfiles(profilesResponse.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (complianceCase: ComplianceCase) => {
    setSelectedCase(complianceCase);
    setStampDutyAmount(complianceCase.stamp_duty_amount?.toString() || "0");
    setStampDutyStatus(complianceCase.stamp_duty_status || "pending");
    setDialogOpen(true);
  };

  const handleUpdateStampDuty = async () => {
    if (!selectedCase) return;

    try {
      const { error } = await supabase
        .from("compliance_cases")
        .update({
          stamp_duty_amount: parseFloat(stampDutyAmount) || 0,
          stamp_duty_status: stampDutyStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedCase.id);

      if (error) throw error;

      toast.success("Stamp duty updated successfully");
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error updating stamp duty:", error);
      toast.error(error.message || "Failed to update stamp duty");
    }
  };

  const handleCreateCase = async () => {
    if (!newCaseUserId || !newCaseId || !newClientName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("compliance_cases")
        .insert({
          user_id: newCaseUserId,
          case_id: newCaseId,
          client_name: newClientName,
          account_type: newAccountType,
          unsettled_amount: parseFloat(newUnsettledAmount) || 0,
          stamp_duty_amount: parseFloat(newStampDutyAmount) || 0,
          stamp_duty_status: "pending",
          status: "Pending Review",
          account_reference_number: `REF-${Date.now()}`,
          reviewer_name: "Pending Assignment",
          reviewer_title: "Compliance Officer",
          employee_id: "TBD",
          reviewer_ip: "0.0.0.0",
          system_name: "VaultCore™ Compliance Platform",
          compliance_log_hash: `HASH-${Math.random().toString(36).substring(7).toUpperCase()}`
        });

      if (error) throw error;

      toast.success("Compliance case created successfully");
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchData();
    } catch (error: any) {
      console.error("Error creating case:", error);
      toast.error(error.message || "Failed to create compliance case");
    }
  };

  const resetCreateForm = () => {
    setNewCaseUserId("");
    setNewCaseId("");
    setNewClientName("");
    setNewAccountType("Estate / Inheritance");
    setNewUnsettledAmount("");
    setNewStampDutyAmount("");
  };

  const getUserProfile = (userId: string) => {
    return profiles.find(p => p.id === userId);
  };

  const filteredCases = complianceCases.filter(c => {
    const profile = getUserProfile(c.user_id);
    return (
      c.case_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Compliance Management</h1>
          <p className="text-slate-300">Manage compliance cases and stamp duty assessments</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <FileText className="h-4 w-4 mr-2" />
              Create Case
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Create Compliance Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Select User *</Label>
                <Select value={newCaseUserId} onValueChange={setNewCaseUserId}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 z-50">
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id} className="text-white hover:bg-slate-800">
                        {profile.full_name || profile.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Case ID *</Label>
                <Input
                  placeholder="e.g., COMP-2024-001"
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Client Name *</Label>
                <Input
                  placeholder="Full name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Account Type</Label>
                <Select value={newAccountType} onValueChange={setNewAccountType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 z-50">
                    <SelectItem value="Estate / Inheritance" className="text-white hover:bg-slate-800">Estate / Inheritance</SelectItem>
                    <SelectItem value="Trust Fund" className="text-white hover:bg-slate-800">Trust Fund</SelectItem>
                    <SelectItem value="Investment" className="text-white hover:bg-slate-800">Investment</SelectItem>
                    <SelectItem value="Savings" className="text-white hover:bg-slate-800">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Unsettled Amount (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newUnsettledAmount}
                  onChange={(e) => setNewUnsettledAmount(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Stamp Duty Amount (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newStampDutyAmount}
                  onChange={(e) => setNewStampDutyAmount(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button onClick={handleCreateCase} className="w-full bg-primary hover:bg-primary/90">
                Create Case
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Search className="h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by case ID, client name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900/50 border-slate-600 text-white"
          />
        </div>

        {filteredCases.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No compliance cases found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((complianceCase) => {
              const profile = getUserProfile(complianceCase.user_id);
              return (
                <div
                  key={complianceCase.id}
                  className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700 rounded-lg hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {complianceCase.client_name?.charAt(0)?.toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">{complianceCase.client_name}</p>
                      <p className="text-sm text-slate-400">{profile?.email || "No email"}</p>
                      <p className="text-xs text-slate-500 font-mono">{complianceCase.case_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Unsettled</p>
                      <p className="font-semibold text-amber-400">
                        €{(complianceCase.unsettled_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Stamp Duty</p>
                      <p className="font-semibold text-red-400">
                        €{(complianceCase.stamp_duty_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge className={complianceCase.stamp_duty_status === 'paid' ? 'bg-green-600' : 'bg-orange-600'}>
                      {complianceCase.stamp_duty_status === 'paid' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Paid</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Pending</>
                      )}
                    </Badge>
                    <Dialog open={dialogOpen && selectedCase?.id === complianceCase.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (!open) setSelectedCase(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => openEditDialog(complianceCase)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Edit Stamp Duty
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">
                            Update Stamp Duty - {complianceCase.client_name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-3 bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-400">Case ID</p>
                            <p className="font-mono text-white">{complianceCase.case_id}</p>
                          </div>
                          <div>
                            <Label className="text-slate-300">Stamp Duty Amount (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={stampDutyAmount}
                              onChange={(e) => setStampDutyAmount(e.target.value)}
                              className="bg-slate-800 border-slate-700 text-white text-lg"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300">Status</Label>
                            <Select value={stampDutyStatus} onValueChange={setStampDutyStatus}>
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-700 z-50">
                                <SelectItem value="pending" className="text-white hover:bg-slate-800">
                                  <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-orange-400" /> Pending
                                  </span>
                                </SelectItem>
                                <SelectItem value="paid" className="text-white hover:bg-slate-800">
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-400" /> Paid
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleUpdateStampDuty} className="w-full bg-primary hover:bg-primary/90">
                            Update Stamp Duty
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
