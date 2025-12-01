import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Wallet, Send, Globe } from "lucide-react";
import { TransferModal } from "@/components/dashboard/TransferModal";
import { DomesticTransferModal } from "@/components/dashboard/DomesticTransferModal";
import { InternationalTransferModal } from "@/components/dashboard/InternationalTransferModal";
import { useNavigate } from "react-router-dom";

export const TransfersPayments = () => {
  const navigate = useNavigate();
  const [showInternalTransfer, setShowInternalTransfer] = useState(false);
  const [showDomesticTransfer, setShowDomesticTransfer] = useState(false);
  const [showInternationalTransfer, setShowInternationalTransfer] = useState(false);

  const handleTransferSuccess = () => {
    // Refresh or update UI as needed
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Transfers & Payments</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Move money easily between accounts, pay bills, and send money to anyone, anywhere.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 hover:shadow-xl transition-all">
            <ArrowLeftRight className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Internal Transfers</h3>
            <p className="text-sm text-muted-foreground mb-4">Move funds instantly between your VaultBank accounts</p>
            <Button className="w-full" onClick={() => setShowInternalTransfer(true)}>Transfer Now</Button>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all">
            <Send className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Domestic Transfers</h3>
            <p className="text-sm text-muted-foreground mb-4">Send money to accounts at other US banks (ACH/Wire)</p>
            <Button className="w-full" onClick={() => setShowDomesticTransfer(true)}>Send Money</Button>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all">
            <Globe className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">International Transfers</h3>
            <p className="text-sm text-muted-foreground mb-4">Fast international transfers via SWIFT</p>
            <Button className="w-full" onClick={() => setShowInternationalTransfer(true)}>Send Wire</Button>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all">
            <Wallet className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Bill Pay</h3>
            <p className="text-sm text-muted-foreground mb-4">Schedule and manage recurring payments</p>
            <Button className="w-full" onClick={() => navigate("/bank/dashboard/bill-pay")}>Pay Bills</Button>
          </Card>
        </div>
      </div>

      {showInternalTransfer && (
        <TransferModal
          onClose={() => setShowInternalTransfer(false)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {showDomesticTransfer && (
        <DomesticTransferModal
          onClose={() => setShowDomesticTransfer(false)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {showInternationalTransfer && (
        <InternationalTransferModal
          onClose={() => setShowInternationalTransfer(false)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </section>
  );
};
