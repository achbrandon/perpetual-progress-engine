import { useNavigate, useLocation } from "react-router-dom";
import { Home, Wallet, ArrowLeftRight, CreditCard, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  icon: typeof Home;
  path: string;
  badge?: number;
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "Home",
      icon: Home,
      path: "/bank/dashboard"
    },
    {
      label: "Accounts",
      icon: Wallet,
      path: "/bank/dashboard/accounts"
    },
    {
      label: "Transfer",
      icon: ArrowLeftRight,
      path: "/bank/dashboard/transfers"
    },
    {
      label: "Cards",
      icon: CreditCard,
      path: "/bank/dashboard/cards"
    }
  ];

  const moreMenuItems = [
    { label: "Crypto Wallet", path: "/bank/dashboard/crypto" },
    { label: "Bill Pay", path: "/bank/dashboard/bill-pay" },
    { label: "Statements", path: "/bank/dashboard/statements" },
    { label: "Analytics", path: "/bank/dashboard/analytics" },
    { label: "Support", path: "/bank/dashboard/support" },
    { label: "Settings", path: "/bank/dashboard/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/bank/dashboard") {
      return location.pathname === "/bank/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleMoreMenuClick = (path: string) => {
    navigate(path);
    setMoreMenuOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border animate-slide-up-nav backdrop-blur-lg bg-opacity-95 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 relative",
                  "active:scale-95"
                )}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full animate-scale-in" />
                )}
                
                {/* Icon container with background effect */}
                <div
                  className={cn(
                    "relative p-2 rounded-xl transition-all duration-200",
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      active && "scale-110"
                    )} 
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-scale-in">
                      {item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-200",
                    active 
                      ? "text-primary font-semibold" 
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Menu */}
          <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200",
                  "active:scale-95"
                )}
              >
                <div
                  className={cn(
                    "relative p-2 rounded-xl transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Menu className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  More
                </span>
              </button>
            </SheetTrigger>
            
            <SheetContent 
              side="bottom" 
              className="h-[60vh] rounded-t-3xl animate-slide-up"
            >
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left">More Options</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-2">
                {moreMenuItems.map((item, index) => (
                  <div key={item.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-14 text-base",
                        isActive(item.path) && "bg-primary/10 text-primary font-semibold"
                      )}
                      onClick={() => handleMoreMenuClick(item.path)}
                    >
                      {item.label}
                    </Button>
                    {index < moreMenuItems.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Safe area padding for content */}
      <div className="md:hidden h-16 pb-safe" />
    </>
  );
}
