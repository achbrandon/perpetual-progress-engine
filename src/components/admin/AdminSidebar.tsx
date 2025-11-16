import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Settings,
  TrendingUp,
  Wallet,
  FileText,
  UserCog,
  Activity,
  Sliders,
  Shield,
  Wrench,
  UserPlus,
  Bell,
  CheckCircle
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Overview",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "User Management",
    url: "/admin/user-management",
    icon: UserCog,
  },
  {
    title: "Live Monitoring",
    url: "/admin/live-monitoring",
    icon: Activity,
  },
  {
    title: "Applications",
    url: "/admin/applications",
    icon: FileText,
  },
  {
    title: "Joint Account Requests",
    url: "/admin/joint-accounts",
    icon: UserPlus,
  },
  {
    title: "Documents & Verification",
    url: "/admin/documents",
    icon: FileText,
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: CreditCard,
  },
  {
    title: "Transaction Approvals",
    url: "/admin/transaction-approvals",
    icon: CheckCircle,
  },
  {
    title: "Live Support",
    url: "/admin/live-support",
    icon: MessageSquare,
  },
  {
    title: "Email System",
    url: "/admin/email",
    icon: Settings,
  },
  {
    title: "Send Notifications",
    url: "/admin/send-notification",
    icon: Bell,
  },
  {
    title: "Wallet Settings",
    url: "/admin/wallets",
    icon: Wallet,
  },
  {
    title: "Admin Settings",
    url: "/admin/settings",
    icon: Sliders,
  },
  {
    title: "User Activity",
    url:"/admin/activity",
    icon: TrendingUp,
  },
  {
    title: "Activity Logs",
    url: "/admin/activity-logs",
    icon: FileText,
  },
  {
    title: "Authentication Logs",
    url: "/admin/authentication-logs",
    icon: Shield,
  },
  {
    title: "Account Repair",
    url: "/admin/account-repair",
    icon: Wrench,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="bg-slate-900 border-slate-700">
      <SidebarContent className="bg-slate-900">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-300">Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
