import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Check, Clock, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import vaultBankLogo from "@/assets/vaultbank-logo.png";
import cdHero from "@/assets/cd-hero.jpg";
import { AuthDialog } from "@/components/AuthDialog";
import { useState } from "react";

const CDs = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/bank" className="flex items-center">
              <img src={vaultBankLogo} alt="VaultBank" className="h-16" />
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/bank/savings">Back to Savings</Link>
              </Button>
              <Button asChild>
                <Link to="/bank/locations">Find Locations</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Certificates of Deposit (CDs)
              </h1>
              <p className="text-lg mb-8 opacity-90">
                Lock in guaranteed returns with our competitive CD rates. Choose from flexible terms 
                that match your savings goals and earn more with fixed interest rates.
              </p>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white mb-6" onClick={() => setAuthDialogOpen(true)}>
                Open a CD Account
              </Button>
              <p className="text-sm mb-4">FDIC insured up to $250,000 per depositor</p>
              <div>
                <p className="text-sm">
                  Early withdrawal penalties apply<sup>1</sup>
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src={cdHero} 
                alt="Certificate of Deposit investment planning" 
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CD Options */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Term</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select the CD term that best fits your financial timeline. Longer terms typically offer higher rates.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <Card className="p-6 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-4">
                <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-1">6-Month CD</h3>
                <p className="text-sm text-muted-foreground">Short-term savings</p>
              </div>
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-3xl font-bold">3.50%</p>
                <span className="text-sm text-muted-foreground">APY*</span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex gap-2 items-start">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs">$1,000 minimum</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs">Fixed rate guaranteed</p>
                </div>
              </div>
              <Button className="w-full" size="sm" onClick={() => setAuthDialogOpen(true)}>Open Now</Button>
            </Card>

            <Card className="p-6 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-4">
                <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-1">1-Year CD</h3>
                <p className="text-sm text-muted-foreground">Popular choice</p>
              </div>
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-3xl font-bold">4.25%</p>
                <span className="text-sm text-muted-foreground">APY*</span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex gap-2 items-start">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs">$1,000 minimum</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs">Automatic renewal</p>
                </div>
              </div>
              <Button className="w-full" size="sm" onClick={() => setAuthDialogOpen(true)}>Open Now</Button>
            </Card>

            <Card className="p-6 hover:shadow-2xl transition-all duration-300 border-primary border-2">
              <div className="text-center mb-4">
                <div className="inline-block px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                  BEST RATE
                </div>
                <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-1">3-Year CD</h3>
                <p className="text-sm text-muted-foreground">Maximum returns</p>
              </div>
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-3xl font-bold">5.00%</p>
                <span className="text-sm text-muted-foreground">APY*</span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex gap-2 items-start">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs">$2,500 minimum</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs">Highest guaranteed rate</p>
                </div>
              </div>
              <Button className="w-full" size="sm" onClick={() => setAuthDialogOpen(true)}>Open Now</Button>
            </Card>

            <Card className="p-6 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-4">
                <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-1">5-Year CD</h3>
                <p className="text-sm text-muted-foreground">Long-term growth</p>
              </div>
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-3xl font-bold">4.75%</p>
                <span className="text-sm text-muted-foreground">APY*</span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex gap-2 items-start">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs">$2,500 minimum</p>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs">Rate protection</p>
                </div>
              </div>
              <Button className="w-full" size="sm" onClick={() => setAuthDialogOpen(true)}>Open Now</Button>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8">
              <TrendingUp className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Why Choose VaultBank CDs?</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Guaranteed Returns</h4>
                  <p className="text-sm text-muted-foreground">
                    Lock in your rate for the entire term. Your APY won't change, regardless of market fluctuations.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Flexible Terms</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose from 6 months to 5 years to match your financial goals and timeline.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Automatic Renewal</h4>
                  <p className="text-sm text-muted-foreground">
                    Your CD automatically renews at maturity unless you specify otherwise during the grace period.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">CD Features & Protection</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">FDIC Insured</h4>
                  <p className="text-sm text-muted-foreground">
                    Your deposits are insured up to $250,000 per depositor by the FDIC.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Compound Interest</h4>
                  <p className="text-sm text-muted-foreground">
                    Interest compounds daily and is credited to your account at maturity or monthly, depending on term.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Grace Period</h4>
                  <p className="text-sm text-muted-foreground">
                    10-day grace period at maturity to make changes or withdraw funds without penalty.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Important Information */}
          <Card className="p-8 bg-secondary">
            <h3 className="text-xl font-bold mb-4">Important CD Information</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <sup>*</sup>Annual Percentage Yield (APY) accurate as of {new Date().toLocaleDateString()}. 
                Rates subject to change. Minimum opening deposit requirements apply.
              </p>
              <p>
                <sup>1</sup>Early withdrawal penalty: For CDs with terms of 12 months or less, the penalty is 3 months interest. 
                For CDs with terms greater than 12 months, the penalty is 6 months interest.
              </p>
              <p>
                All accounts are subject to approval. Fees may reduce earnings. See account terms and conditions for complete details.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Explore More */}
      <section className="py-16 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold mb-8 text-center">Explore Other Savings Options</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Button variant="outline" size="lg" className="h-auto py-6" asChild>
              <Link to="/bank/savings" className="flex items-center justify-between">
                <span>Savings Accounts</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-6" asChild>
              <Link to="/bank/money-market" className="flex items-center justify-between">
                <span>Money Market</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-6" asChild>
              <Link to="/bank/checking" className="flex items-center justify-between">
                <span>Checking Accounts</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default CDs;
