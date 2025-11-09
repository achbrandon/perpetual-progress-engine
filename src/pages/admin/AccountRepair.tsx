import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Wrench } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface UserAccountStatus {
  user_id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
  qr_verified: boolean;
  can_transact: boolean;
  has_application: boolean;
  application_status: string | null;
  application_qr_verified: boolean | null;
  has_account: boolean;
  issues: string[];
  selected?: boolean;
}

interface RepairOptions {
  setEmailVerified: boolean;
  setQrVerified: boolean;
  setCanTransact: boolean;
  createApplication: boolean;
  updateApplicationStatus: boolean;
  createAccount: boolean;
}

export default function AccountRepair() {
  const [users, setUsers] = useState<UserAccountStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserAccountStatus | null>(null);
  const [bulkRepairDialogOpen, setBulkRepairDialogOpen] = useState(false);
  const [repairOptions, setRepairOptions] = useState<RepairOptions>({
    setEmailVerified: false,
    setQrVerified: false,
    setCanTransact: false,
    createApplication: false,
    updateApplicationStatus: false,
    createAccount: false,
  });
  const [repairing, setRepairing] = useState(false);

  const selectedUsers = users.filter(u => u.selected && u.issues.length > 0);
  const hasSelection = selectedUsers.length > 0;

  useEffect(() => {
    fetchUserStatuses();
  }, []);

  const fetchUserStatuses = async () => {
    try {
      setLoading(true);

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all account applications
      const { data: applications, error: appsError } = await supabase
        .from("account_applications")
        .select("*");

      if (appsError) throw appsError;

      // Fetch all accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("accounts")
        .select("user_id")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      // Combine data and identify issues
      const userStatuses: UserAccountStatus[] = profiles.map((profile) => {
        const application = applications?.find((app) => app.user_id === profile.id);
        const hasAccount = accounts?.some((acc) => acc.user_id === profile.id);
        const issues: string[] = [];

        // Check for inconsistencies
        if (!profile.email_verified && profile.qr_verified) {
          issues.push("QR verified but email not verified");
        }

        if (profile.can_transact && !profile.qr_verified) {
          issues.push("Can transact but QR not verified");
        }

        if (!application) {
          issues.push("No account application record");
        } else {
          if (application.status === 'approved' && !profile.can_transact) {
            issues.push("Application approved but can't transact");
          }
          if (application.status === 'pending' && profile.can_transact) {
            issues.push("Application pending but can transact");
          }
          if (application.qr_code_verified !== profile.qr_verified) {
            issues.push("QR verification mismatch between tables");
          }
        }

        if (profile.can_transact && !hasAccount) {
          issues.push("Can transact but no active account");
        }

        return {
          user_id: profile.id,
          email: profile.email || "N/A",
          full_name: profile.full_name || "N/A",
          email_verified: profile.email_verified,
          qr_verified: profile.qr_verified,
          can_transact: profile.can_transact,
          has_application: !!application,
          application_status: application?.status || null,
          application_qr_verified: application?.qr_code_verified || null,
          has_account: hasAccount,
          issues,
          selected: false,
        };
      });

      setUsers(userStatuses);
    } catch (error: any) {
      console.error("Error fetching user statuses:", error);
      toast.error("Failed to fetch user statuses");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.user_id === userId ? { ...user, selected: !user.selected } : user
    ));
  };

  const toggleAllSelection = () => {
    const usersWithIssues = users.filter(u => u.issues.length > 0);
    const allSelected = usersWithIssues.every(u => u.selected);
    
    setUsers(prev => prev.map(user => 
      user.issues.length > 0 ? { ...user, selected: !allSelected } : user
    ));
  };

  const openRepairDialog = (user: UserAccountStatus) => {
    setSelectedUser(user);
    
    // Pre-select repair options based on issues
    setRepairOptions({
      setEmailVerified: !user.email_verified && user.qr_verified,
      setQrVerified: false,
      setCanTransact: !user.can_transact && user.application_status === 'approved',
      createApplication: !user.has_application,
      updateApplicationStatus: user.has_application && user.application_status !== 'approved' && user.can_transact,
      createAccount: user.can_transact && !user.has_account,
    });
  };

  const openBulkRepairDialog = () => {
    // Analyze common issues across selected users
    const commonIssues = new Set<string>();
    selectedUsers.forEach(user => {
      user.issues.forEach(issue => commonIssues.add(issue));
    });

    // Pre-select options based on most common issues
    const needsEmailVerified = selectedUsers.some(u => !u.email_verified && u.qr_verified);
    const needsCanTransact = selectedUsers.some(u => !u.can_transact && u.application_status === 'approved');
    const needsApplication = selectedUsers.some(u => !u.has_application);
    const needsApplicationUpdate = selectedUsers.some(u => u.has_application && u.application_status !== 'approved' && u.can_transact);
    const needsAccount = selectedUsers.some(u => u.can_transact && !u.has_account);

    setRepairOptions({
      setEmailVerified: needsEmailVerified,
      setQrVerified: false,
      setCanTransact: needsCanTransact,
      createApplication: needsApplication,
      updateApplicationStatus: needsApplicationUpdate,
      createAccount: needsAccount,
    });

    setBulkRepairDialogOpen(true);
  };

  const repairSingleAccount = async (user: UserAccountStatus) => {
    // Update profile
    if (repairOptions.setEmailVerified || repairOptions.setQrVerified || repairOptions.setCanTransact) {
      const updates: any = {};
      if (repairOptions.setEmailVerified && !user.email_verified && user.qr_verified) {
        updates.email_verified = true;
      }
      if (repairOptions.setQrVerified && !user.qr_verified) {
        updates.qr_verified = true;
      }
      if (repairOptions.setCanTransact && !user.can_transact) {
        updates.can_transact = true;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.user_id);

        if (error) throw error;
      }
    }

    // Create application if needed
    if (repairOptions.createApplication && !user.has_application) {
      const { error } = await supabase
        .from("account_applications")
        .insert({
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          account_type: "checking",
          status: "approved",
          qr_code_verified: user.qr_verified,
        });

      if (error) throw error;
    }

    // Update application status
    if (repairOptions.updateApplicationStatus && user.has_application && user.application_status !== 'approved') {
      const { error } = await supabase
        .from("account_applications")
        .update({
          status: "approved",
          qr_code_verified: user.qr_verified,
        })
        .eq("user_id", user.user_id);

      if (error) throw error;
    }

    // Create account
    if (repairOptions.createAccount && !user.has_account) {
      const accountNumber = `ACC${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
      
      const { error } = await supabase
        .from("accounts")
        .insert({
          user_id: user.user_id,
          account_type: "checking",
          account_number: accountNumber,
          balance: 0,
          status: "active",
        });

      if (error) throw error;
    }
  };

  const handleRepair = async () => {
    if (!selectedUser) return;

    try {
      setRepairing(true);
      await repairSingleAccount(selectedUser);
      toast.success("Account repaired successfully!");
      setSelectedUser(null);
      fetchUserStatuses();
    } catch (error: any) {
      console.error("Error repairing account:", error);
      toast.error(error.message || "Failed to repair account");
    } finally {
      setRepairing(false);
    }
  };

  const handleBulkRepair = async () => {
    try {
      setRepairing(true);
      
      let successCount = 0;
      let failCount = 0;

      for (const user of selectedUsers) {
        try {
          await repairSingleAccount(user);
          successCount++;
        } catch (error: any) {
          console.error(`Error repairing account for ${user.email}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully repaired ${successCount} account${successCount !== 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to repair ${failCount} account${failCount !== 1 ? 's' : ''}`);
      }

      setBulkRepairDialogOpen(false);
      fetchUserStatuses();
    } catch (error: any) {
      console.error("Error during bulk repair:", error);
      toast.error("An error occurred during bulk repair");
    } finally {
      setRepairing(false);
    }
  };

  const getIssueColor = (issueCount: number) => {
    if (issueCount === 0) return "default";
    if (issueCount <= 2) return "secondary";
    return "destructive";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Repair Tool</h1>
        <p className="text-muted-foreground mt-2">
          Identify and fix inconsistent user account states across the system
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Account Status</CardTitle>
          <div className="flex gap-2">
            {hasSelection && (
              <Button 
                onClick={openBulkRepairDialog}
                variant="default"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Bulk Repair ({selectedUsers.length})
              </Button>
            )}
            <Button onClick={fetchUserStatuses} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading user data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={users.filter(u => u.issues.length > 0).every(u => u.selected)}
                      onCheckedChange={toggleAllSelection}
                      disabled={users.filter(u => u.issues.length > 0).length === 0}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Email Ver.</TableHead>
                  <TableHead>QR Ver.</TableHead>
                  <TableHead>Can Transact</TableHead>
                  <TableHead>App Status</TableHead>
                  <TableHead>Has Account</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <Checkbox
                        checked={user.selected || false}
                        onCheckedChange={() => toggleUserSelection(user.user_id)}
                        disabled={user.issues.length === 0}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.email_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.qr_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.can_transact ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.has_application ? (
                        <Badge variant={user.application_status === 'approved' ? 'default' : 'secondary'}>
                          {user.application_status}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.has_account ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getIssueColor(user.issues.length)}>
                        {user.issues.length} issue{user.issues.length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.issues.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRepairDialog(user)}
                        >
                          <Wrench className="h-4 w-4 mr-2" />
                          Repair
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Repair Account: {selectedUser?.full_name}</DialogTitle>
            <DialogDescription>
              Select the repairs you want to apply to fix this account's inconsistencies.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Detected Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedUser.issues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="font-semibold">Repair Options</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="setEmailVerified"
                      checked={repairOptions.setEmailVerified}
                      onCheckedChange={(checked) =>
                        setRepairOptions((prev) => ({ ...prev, setEmailVerified: checked === true }))
                      }
                    />
                    <Label htmlFor="setEmailVerified">Set email_verified to true</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="setQrVerified"
                      checked={repairOptions.setQrVerified}
                      onCheckedChange={(checked) =>
                        setRepairOptions((prev) => ({ ...prev, setQrVerified: checked === true }))
                      }
                    />
                    <Label htmlFor="setQrVerified">Set qr_verified to true</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="setCanTransact"
                      checked={repairOptions.setCanTransact}
                      onCheckedChange={(checked) =>
                        setRepairOptions((prev) => ({ ...prev, setCanTransact: checked === true }))
                      }
                    />
                    <Label htmlFor="setCanTransact">Set can_transact to true</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createApplication"
                      checked={repairOptions.createApplication}
                      onCheckedChange={(checked) =>
                        setRepairOptions((prev) => ({ ...prev, createApplication: checked === true }))
                      }
                    />
                    <Label htmlFor="createApplication">Create account_applications record (approved)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="updateApplicationStatus"
                      checked={repairOptions.updateApplicationStatus}
                      onCheckedChange={(checked) =>
                        setRepairOptions((prev) => ({ ...prev, updateApplicationStatus: checked === true }))
                      }
                      disabled={!selectedUser.has_application}
                    />
                    <Label htmlFor="updateApplicationStatus">Update application status to approved</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createAccount"
                      checked={repairOptions.createAccount}
                      onCheckedChange={(checked) =>
                        setRepairOptions((prev) => ({ ...prev, createAccount: checked === true }))
                      }
                    />
                    <Label htmlFor="createAccount">Create checking account</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleRepair} disabled={repairing}>
              {repairing ? "Repairing..." : "Apply Repairs"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Repair Dialog */}
      <Dialog open={bulkRepairDialogOpen} onOpenChange={setBulkRepairDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Repair Accounts ({selectedUsers.length} selected)</DialogTitle>
            <DialogDescription>
              Configure repair options to apply to all selected accounts. Only applicable repairs will be applied to each account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Selected Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedUsers.map((user) => (
                    <div key={user.user_id} className="text-sm flex justify-between items-center">
                      <span>{user.full_name} ({user.email})</span>
                      <Badge variant={getIssueColor(user.issues.length)}>
                        {user.issues.length} issue{user.issues.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold">Repair Options</h3>
              <p className="text-sm text-muted-foreground">
                These repairs will be applied where applicable. If an account doesn't need a specific repair, it will be skipped.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulk-setEmailVerified"
                    checked={repairOptions.setEmailVerified}
                    onCheckedChange={(checked) =>
                      setRepairOptions((prev) => ({ ...prev, setEmailVerified: checked === true }))
                    }
                  />
                  <Label htmlFor="bulk-setEmailVerified">
                    Set email_verified to true (where QR is verified)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulk-setQrVerified"
                    checked={repairOptions.setQrVerified}
                    onCheckedChange={(checked) =>
                      setRepairOptions((prev) => ({ ...prev, setQrVerified: checked === true }))
                    }
                  />
                  <Label htmlFor="bulk-setQrVerified">Set qr_verified to true</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulk-setCanTransact"
                    checked={repairOptions.setCanTransact}
                    onCheckedChange={(checked) =>
                      setRepairOptions((prev) => ({ ...prev, setCanTransact: checked === true }))
                    }
                  />
                  <Label htmlFor="bulk-setCanTransact">
                    Set can_transact to true (where applicable)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulk-createApplication"
                    checked={repairOptions.createApplication}
                    onCheckedChange={(checked) =>
                      setRepairOptions((prev) => ({ ...prev, createApplication: checked === true }))
                    }
                  />
                  <Label htmlFor="bulk-createApplication">
                    Create account_applications record (approved) for accounts without one
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulk-updateApplicationStatus"
                    checked={repairOptions.updateApplicationStatus}
                    onCheckedChange={(checked) =>
                      setRepairOptions((prev) => ({ ...prev, updateApplicationStatus: checked === true }))
                    }
                  />
                  <Label htmlFor="bulk-updateApplicationStatus">
                    Update application status to approved (where needed)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulk-createAccount"
                    checked={repairOptions.createAccount}
                    onCheckedChange={(checked) =>
                      setRepairOptions((prev) => ({ ...prev, createAccount: checked === true }))
                    }
                  />
                  <Label htmlFor="bulk-createAccount">
                    Create checking account (where can_transact is true)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRepairDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkRepair} disabled={repairing}>
              {repairing ? "Repairing..." : `Repair ${selectedUsers.length} Account${selectedUsers.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
