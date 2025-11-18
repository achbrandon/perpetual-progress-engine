import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Send, 
  Receipt, 
  Download, 
  CreditCard, 
  Bitcoin,
  FileText,
  RefreshCw,
  Link as LinkIcon,
  History,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TransferModal } from "./TransferModal";
import { AutoTransferModal } from "./AutoTransferModal";

interface QuickActionsProps {
  onAction: () => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const navigate = useNavigate();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAutoTransferModal, setShowAutoTransferModal] = useState(false);

  const actions = [
    {
      icon: <Send className="h-5 w-5" />,
      label: "Transfer Money",
      onClick: () => setShowTransferModal(true),
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      iconColor: "text-white"
    },
    {
      icon: <Receipt className="h-5 w-5" />,
      label: "Pay Bills",
      onClick: () => navigate("/dashboard/bill-pay"),
      gradient: "from-green-500 via-emerald-600 to-teal-600",
      iconColor: "text-white"
    },
    {
      icon: <Download className="h-5 w-5" />,
      label: "Mobile Deposit",
      onClick: () => navigate("/dashboard/mobile-deposit"),
      gradient: "from-purple-500 via-violet-600 to-purple-700",
      iconColor: "text-white"
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Apply for Card",
      onClick: () => navigate("/dashboard/card-application"),
      gradient: "from-orange-500 via-red-500 to-pink-600",
      iconColor: "text-white"
    },
    {
      icon: <Bitcoin className="h-5 w-5" />,
      label: "Crypto",
      onClick: () => navigate("/dashboard/crypto"),
      gradient: "from-amber-500 via-yellow-500 to-orange-500",
      iconColor: "text-white"
    },
    {
      icon: <LinkIcon className="h-5 w-5" />,
      label: "Link Account (ACH)",
      onClick: () => navigate("/dashboard/ach-accounts"),
      gradient: "from-cyan-500 via-sky-600 to-blue-600",
      iconColor: "text-white"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Statements",
      onClick: () => navigate("/dashboard/statements"),
      gradient: "from-slate-600 via-gray-700 to-slate-800",
      iconColor: "text-white"
    },
    {
      icon: <History className="h-5 w-5" />,
      label: "Transaction History",
      onClick: () => navigate("/dashboard/transaction-history"),
      gradient: "from-rose-500 via-pink-600 to-fuchsia-600",
      iconColor: "text-white"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Revenue Reports",
      onClick: () => navigate("/dashboard/revenue-reports"),
      gradient: "from-lime-500 via-green-600 to-emerald-600",
      iconColor: "text-white"
    },
    {
      icon: <RefreshCw className="h-5 w-5" />,
      label: "Auto-Transfer",
      onClick: () => setShowAutoTransferModal(true),
      gradient: "from-indigo-500 via-purple-600 to-violet-700",
      iconColor: "text-white"
    }
  ];

  return (
    <>
      <Card className="mobile-card-padding mb-4 sm:mb-6 animate-fade-in bg-gradient-to-br from-card/80 to-card backdrop-blur-sm border-border/50">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Quick Actions
        </h2>
        <div className="mobile-action-grid">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-auto flex-col gap-2 p-3 sm:p-4 group hover:scale-105 transition-all duration-300 touch-target overflow-hidden relative border border-border/40 hover:border-transparent hover:shadow-2xl"
              onClick={action.onClick}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className={`relative h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br ${action.gradient} flex items-center justify-center ${action.iconColor} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                {action.icon}
              </div>
              <span className="relative text-[10px] sm:text-xs text-center leading-tight font-medium text-foreground group-hover:text-white transition-colors duration-300">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </Card>

      {showTransferModal && (
        <TransferModal
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
            onAction();
          }}
        />
      )}

      {showAutoTransferModal && (
        <AutoTransferModal
          onClose={() => setShowAutoTransferModal(false)}
          onSuccess={() => {
            setShowAutoTransferModal(false);
            onAction();
          }}
        />
      )}
    </>
  );
}
