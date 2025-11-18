import {
  Home,
  CreditCard,
  ArrowLeftRight,
  FileText,
  Smartphone,
  Settings,
  TrendingUp,
  Bell,
  Award,
  DollarSign,
  FileBarChart,
  Briefcase,
  Gift,
  LifeBuoy,
  Wallet,
  Bitcoin,
  Link,
  Download,
  BarChart3,
  Shield,
  Users,
  Link2,
  History,
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

interface DashboardSidebarProps {
  onOpenSupport?: () => void;
}

const menuItems = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Accounts", url: "/dashboard/accounts", icon: Wallet },
  { title: "Account Details", url: "/dashboard/account-details", icon: FileText },
  { title: "Joint Account Status", url: "/dashboard/joint-account-status", icon: Users },
  { title: "Linked Payment Accounts", url: "/dashboard/linked-accounts", icon: Link2 },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Transaction History", url: "/dashboard/transaction-history", icon: History },
  { title: "Transfers", url: "/dashboard/transfers", icon: ArrowLeftRight },
  { title: "Bill Pay", url: "/dashboard/bill-pay", icon: FileText },
  { title: "Mobile Deposit", url: "/dashboard/mobile-deposit", icon: Smartphone },
  { title: "ACH Accounts", url: "/dashboard/ach-accounts", icon: Link },
  { title: "Crypto Wallet", url: "/dashboard/crypto", icon: Bitcoin },
  { title: "Apply for Card", url: "/dashboard/card-application", icon: CreditCard },
  { title: "Cards", url: "/dashboard/cards", icon: CreditCard },
  { title: "Credit Score", url: "/dashboard/credit-score", icon: TrendingUp },
  { title: "Loans", url: "/dashboard/loans", icon: DollarSign },
  { title: "Statements", url: "/dashboard/statements", icon: FileBarChart },
  { title: "Generate Statement", url: "/dashboard/generate-statement", icon: Download },
  { title: "Offers & Rewards", url: "/dashboard/offers", icon: Gift },
  { title: "Alerts", url: "/dashboard/alerts", icon: Bell },
  { title: "Login History", url: "/dashboard/login-history", icon: Shield },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ onOpenSupport }: DashboardSidebarProps) {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Banking</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenSupport}>
                  <LifeBuoy className="h-4 w-4" />
                  {open && <span>Support</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
