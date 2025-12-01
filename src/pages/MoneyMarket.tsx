import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, Check, CreditCard, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import vaultBankLogo from "@/assets/vaultbank-logo.png";
import moneyMarketHero from "@/assets/money-market-hero.jpg";
import { AuthDialog } from "@/components/AuthDialog";
import { useState } from "react";

const MoneyMarket = () => {
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
                Money Market Accounts
              </h1>
              <p className="text-lg mb-8 opacity-90">
                Combine the high interest rates of a savings account with the convenience of a checking account. 
                Enjoy check writing privileges, debit card access, and competitive tiered rates.
              </p>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white mb-6" onClick={() => setAuthDialogOpen(true)}>
                Open Money Market Account
              </Button>
              <p className="text-sm mb-4">FDIC insured up to $250,000 per depositor</p>
              <div>
                <p className="text-sm">
                  $10 monthly fee or $0 with qualifying balance<sup>1</sup>
                </p>
                <a href="#" className="text-sm underline hover:no-underline">
                  See fee details
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src={moneyMarketHero} 
                alt="Money market account planning and growth" 
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tiered Rates Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Competitive Tiered Rates</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Earn more as your balance grows. Our tiered interest structure rewards higher balances with better rates.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-6">
                <DollarSign className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Starter Tier</h3>
                <p className="text-sm text-muted-foreground">$2,500 - $9,999</p>
              </div>
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-4xl font-bold">2.50%</p>
                <span className="text-sm text-muted-foreground">APY*</span>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">$2,500 minimum balance</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Limited check writing</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Debit card included</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-primary border-2">
              <div className="text-center mb-6">
                <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-3">
                  POPULAR
                </div>
                <DollarSign className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Growth Tier</h3>
                <p className="text-sm text-muted-foreground">$10,000 - $49,999</p>
              </div>
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-4xl font-bold">3.85%</p>
                <span className="text-sm text-muted-foreground">APY*</span>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Higher interest rate</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Unlimited check writing</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">No monthly fee</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-6">
                <DollarSign className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Premium Tier</h3>
                <p className="text-sm text-muted-foreground">$50,000+</p>
              </div>
              <div className="text-center mb-6 pb-6 border-b border-border">
                <p className="text-4xl font-bold">4.35%</p>
                <span className="text-sm text-muted-foreground">APY*</span>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Maximum rate</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Premium banking perks</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Dedicated support</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8">
              <CreditCard className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Full Account Access</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Check Writing Privileges</h4>
                  <p className="text-sm text-muted-foreground">
                    Write checks directly from your money market account. Perfect for paying bills and large expenses.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Debit Card Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Use your VaultBank debit card for everyday purchases while earning competitive interest rates.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Online & Mobile Banking</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage your account anytime with 24/7 access through our award-winning mobile app.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <TrendingUp className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-3">Maximize Your Earnings</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Tiered Interest Rates</h4>
                  <p className="text-sm text-muted-foreground">
                    Earn higher rates as your balance grows. The more you save, the more you earn.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Daily Compounding</h4>
                  <p className="text-sm text-muted-foreground">
                    Interest compounds daily and is credited to your account monthly for faster growth.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">No Transaction Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlike traditional savings accounts, enjoy unlimited transactions and transfers.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Comparison Section */}
          <Card className="p-8 bg-secondary mb-12">
            <Wallet className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-6">Why Choose a Money Market Account?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">vs. Savings Accounts</h4>
                <p className="text-sm text-muted-foreground">
                  Higher interest rates and check writing privileges while maintaining the safety of a savings account.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">vs. Checking Accounts</h4>
                <p className="text-sm text-muted-foreground">
                  Earn significantly more interest while keeping the convenience of a checking account with debit card access.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Best For</h4>
                <p className="text-sm text-muted-foreground">
                  Emergency funds, short-term savings goals, or parking cash while earning competitive returns.
                </p>
              </div>
            </div>
          </Card>

          {/* Important Information */}
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-4">Important Account Information</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <sup>*</sup>Annual Percentage Yield (APY) accurate as of {new Date().toLocaleDateString()}. 
                Rates are tiered and subject to change. Interest compounds daily and is credited monthly.
              </p>
              <p>
                <sup>1</sup>$10 monthly maintenance fee waived with a minimum daily balance of $2,500 or combined 
                relationship balance of $25,000 across VaultBank deposit and investment accounts.
              </p>
              <p>
                Minimum opening deposit of $2,500 required. Fees may reduce earnings. Transaction limitations may apply. 
                See account terms and conditions for complete details.
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
              <Link to="/bank/cds" className="flex items-center justify-between">
                <span>Certificates of Deposit</span>
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

export default MoneyMarket;
