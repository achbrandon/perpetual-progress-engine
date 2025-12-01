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
  CheckCircle,
  BarChart3
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
    url: "/bank/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/bank/admin/users",
    icon: Users,
  },
  {
    title: "User Management",
    url: "/bank/admin/user-management",
    icon: UserCog,
  },
  {
    title: "Live Monitoring",
    url: "/bank/admin/live-monitoring",
    icon: Activity,
  },
  {
    title: "Applications",
    url: "/bank/admin/applications",
    icon: FileText,
  },
  {
    title: "Joint Account Requests",
    url: "/bank/admin/joint-accounts",
    icon: UserPlus,
  },
  {
    title: "Documents & Verification",
    url: "/bank/admin/documents",
    icon: FileText,
  },
  {
    title: "Transactions",
    url: "/bank/admin/transactions",
    icon: CreditCard,
  },
  {
    title: "Transaction Approvals",
    url: "/bank/admin/transaction-approvals",
    icon: CheckCircle,
  },
  {
    title: "Live Support",
    url: "/bank/admin/live-support",
    icon: MessageSquare,
  },
  {
    title: "Email System",
    url: "/bank/admin/email",
    icon: Settings,
  },
  {
    title: "Send Notifications",
    url: "/bank/admin/send-notification",
    icon: Bell,
  },
  {
    title: "Notification History",
    url: "/bank/admin/notification-history",
    icon: Bell,
  },
  {
    title: "Wallet Settings",
    url: "/bank/admin/wallets",
    icon: Wallet,
  },
  {
    title: "Admin Settings",
    url: "/bank/admin/settings",
    icon: Sliders,
  },
  {
    title: "User Activity",
    url:"/bank/admin/activity",
    icon: TrendingUp,
  },
  {
    title: "Topic Analytics",
    url: "/bank/admin/topic-analytics",
    icon: BarChart3,
  },
  {
    title: "Activity Logs",
    url: "/bank/admin/activity-logs",
    icon: FileText,
  },
  {
    title: "Authentication Logs",
    url: "/bank/admin/authentication-logs",
    icon: Shield,
  },
  {
    title: "Account Repair",
    url: "/bank/admin/account-repair",
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
                      end={item.url === "/bank/admin"}
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
