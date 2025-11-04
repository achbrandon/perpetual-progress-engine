import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, FileText, Download, Eye, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function DocumentsView() {
  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [documentUrls, setDocumentUrls] = useState<any>({});

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data: apps, error } = await supabase
        .from("account_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (apps && apps.length > 0) {
        const userIds = apps.map(a => a.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, qr_verified")
            .in("id", userIds);

          // Merge profiles with applications
          const appsWithProfiles = apps.map(app => ({
            ...app,
            profiles: profiles?.find(p => p.id === app.user_id)
          }));

          setApplications(appsWithProfiles);
        } else {
          setApplications(apps);
        }
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (path: string): Promise<string | null> => {
    if (!path) return null;
    
    try {
      // Extract just the path part if it's a full URL
      let filePath = path;
      if (path.includes('account-documents')) {
        const matches = path.match(/account-documents\/(.+?)(\?|$)/);
        if (matches) filePath = matches[1];
      }

      const { data, error } = await supabase.storage
        .from('account-documents')
        .createSignedUrl(filePath, 3600); // 1 hour

      if (error) {
        console.error('Error getting signed URL:', error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const loadDocumentUrls = async (app: any) => {
    const urls: any = {};
    
    if (app.id_front_url) {
      urls.idFront = await getSignedUrl(app.id_front_url);
    }
    if (app.id_back_url) {
      urls.idBack = await getSignedUrl(app.id_back_url);
    }
    if (app.selfie_url) {
      urls.selfie = await getSignedUrl(app.selfie_url);
    }
    if (app.drivers_license_url) {
      urls.driversLicense = await getSignedUrl(app.drivers_license_url);
    }
    if (app.address_proof_url) {
      urls.addressProof = await getSignedUrl(app.address_proof_url);
    }

    setDocumentUrls(urls);
  };

  const openDocuments = async (app: any) => {
    setSelectedApp(app);
    await loadDocumentUrls(app);
  };

  const handleApprove = async (appId: string) => {
    try {
      const { error } = await supabase
        .from("account_applications")
        .update({ status: 'approved' })
        .eq("id", appId);

      if (error) throw error;
      
      toast.success("Application approved");
      loadApplications();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve application");
    }
  };

  const handleReject = async (appId: string) => {
    try {
      const { error } = await supabase
        .from("account_applications")
        .update({ status: 'rejected' })
        .eq("id", appId);

      if (error) throw error;
      
      toast.success("Application rejected");
      loadApplications();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject application");
    }
  };

  const filteredApplications = applications.filter(app =>
    app.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    app.email?.toLowerCase().includes(search.toLowerCase()) ||
    app.status?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Document Verification
        </h1>
        <p className="text-slate-300">Review account applications and verify uploaded documents</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Search className="h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by name, email, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900/50 border-slate-600 text-white"
          />
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700 rounded-lg hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {app.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{app.full_name}</p>
                    <p className="text-sm text-slate-400">{app.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {app.account_type}
                      </Badge>
                      <Badge className={
                        app.status === 'approved' ? 'bg-green-600' :
                        app.status === 'rejected' ? 'bg-red-600' :
                        'bg-yellow-600'
                      }>
                        {app.status}
                      </Badge>
                      {app.qr_code_verified && (
                        <Badge className="bg-blue-600">QR Verified</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(app.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {app.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleApprove(app.id)}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(app.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => openDocuments(app)}
                        variant="outline"
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Documents
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 max-w-5xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          Application Documents - {selectedApp?.full_name}
                        </DialogTitle>
                      </DialogHeader>

                      {selectedApp && (
                        <div className="space-y-6">
                          {/* Personal Info Summary */}
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-white mb-3">Personal Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-400">Full Name:</span>
                                <p className="text-white font-medium">{selectedApp.full_name}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Date of Birth:</span>
                                <p className="text-white">{selectedApp.date_of_birth || 'Not provided'}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Email:</span>
                                <p className="text-white">{selectedApp.email}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Phone:</span>
                                <p className="text-white">{selectedApp.phone || 'Not provided'}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Address:</span>
                                <p className="text-white">{selectedApp.address || 'Not provided'}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">SSN (For Background Check):</span>
                                <p className="text-white font-mono text-lg">
                                  {selectedApp.ssn || 'Not provided'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Uploaded Documents */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Verification Documents</h3>
                            
                            {!documentUrls.idFront && !documentUrls.idBack && !documentUrls.selfie && !documentUrls.driversLicense && !documentUrls.addressProof ? (
                              <div className="text-center py-12 text-slate-400">
                                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>No documents uploaded yet</p>
                                <p className="text-sm mt-2">User needs to complete the verification process</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-4">
                                {documentUrls.idFront && (
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      ID Front
                                    </Label>
                                    <div className="border-2 border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                                      <img 
                                        src={documentUrls.idFront} 
                                        alt="ID Front" 
                                        className="w-full h-64 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => window.open(documentUrls.idFront, '_blank')}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-primary"
                                        onClick={() => window.open(documentUrls.idFront, '_blank')}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Open Full Size
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {documentUrls.idBack && (
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      ID Back
                                    </Label>
                                    <div className="border-2 border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                                      <img 
                                        src={documentUrls.idBack} 
                                        alt="ID Back" 
                                        className="w-full h-64 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => window.open(documentUrls.idBack, '_blank')}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-primary"
                                        onClick={() => window.open(documentUrls.idBack, '_blank')}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Open Full Size
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {documentUrls.selfie && (
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Selfie Verification
                                    </Label>
                                    <div className="border-2 border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                                      <img 
                                        src={documentUrls.selfie} 
                                        alt="Selfie" 
                                        className="w-full h-64 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => window.open(documentUrls.selfie, '_blank')}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-primary"
                                        onClick={() => window.open(documentUrls.selfie, '_blank')}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Open Full Size
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {documentUrls.driversLicense && (
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Driver's License
                                    </Label>
                                    <div className="border-2 border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                                      <img 
                                        src={documentUrls.driversLicense} 
                                        alt="Driver's License" 
                                        className="w-full h-64 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => window.open(documentUrls.driversLicense, '_blank')}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-primary"
                                        onClick={() => window.open(documentUrls.driversLicense, '_blank')}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Open Full Size
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {documentUrls.addressProof && (
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Address Proof
                                    </Label>
                                    <div className="border-2 border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                                      <img 
                                        src={documentUrls.addressProof} 
                                        alt="Address Proof" 
                                        className="w-full h-64 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => window.open(documentUrls.addressProof, '_blank')}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-primary"
                                        onClick={() => window.open(documentUrls.addressProof, '_blank')}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Open Full Size
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}

            {filteredApplications.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No applications found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
