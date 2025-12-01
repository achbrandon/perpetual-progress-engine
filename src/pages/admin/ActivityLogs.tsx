import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Filter, Search, Shield, User, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function ActivityLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in");
      navigate("/bank/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast.error("Unauthorized access");
      navigate("/");
      return;
    }

    fetchLogs();
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("admin_activity_logs")
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesResource = resourceFilter === "all" || log.resource_type === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueResources = Array.from(new Set(logs.map(log => log.resource_type)));

  const getActionBadgeColor = (action: string) => {
    if (action.includes('deleted') || action.includes('rejected') || action.includes('revoked')) {
      return "destructive";
    }
    if (action.includes('created') || action.includes('approved') || action.includes('granted')) {
      return "default";
    }
    if (action.includes('modified') || action.includes('updated') || action.includes('changed')) {
      return "secondary";
    }
    return "outline";
  };

  const viewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Activity Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete audit trail of all administrative actions
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter activity logs by action, resource, or search term</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResources.map((resource) => (
                  <SelectItem key={resource} value={resource}>
                    {resource.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity History ({filteredLogs.length} logs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Resource ID</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {log.profiles?.full_name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeColor(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.resource_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.resource_id ? log.resource_id.substring(0, 8) + "..." : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
            <DialogDescription>Complete information about this admin action</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Timestamp</h4>
                <p className="font-mono">{format(new Date(selectedLog.created_at), "PPpp")}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Admin User</h4>
                <p>{selectedLog.profiles?.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground font-mono">{selectedLog.user_id}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Action</h4>
                <Badge variant={getActionBadgeColor(selectedLog.action)}>
                  {selectedLog.action.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Resource Type</h4>
                <Badge variant="outline">{selectedLog.resource_type}</Badge>
              </div>
              {selectedLog.resource_id && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Resource ID</h4>
                  <p className="font-mono text-sm">{selectedLog.resource_id}</p>
                </div>
              )}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Additional Details</h4>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.ip_address && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">IP Address</h4>
                  <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                </div>
              )}
              {selectedLog.user_agent && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">User Agent</h4>
                  <p className="text-sm break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
