import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, CreditCard, TrendingUp, Users, Shield, Zap } from "lucide-react";
import vaultBankLogo from "@/assets/vaultbank-logo.png";
import businessHero from "@/assets/business-hero.jpg";
import { AuthDialog } from "@/components/AuthDialog";
import { useState } from "react";

const Business = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/bank" className="flex items-center">
              <img src={vaultBankLogo} alt="VaultBank" className="h-16" />
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/bank">Back to Home</Link>
              </Button>
              <Button onClick={() => setAuthDialogOpen(true)}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={businessHero} alt="Business Banking" className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              VaultBank for Business
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              From banking to payment acceptance to credit cards and local support, we offer flexible solutions to help your business thrive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setAuthDialogOpen(true)}>
                Open Business Account
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/bank/locations">Find a Branch</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Business Banking Services */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Business Banking Solutions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-all">
              <Building2 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Business Checking</h3>
              <p className="text-muted-foreground mb-4">
                No monthly service fees for the first 6 months. Access powerful tools to manage your cash flow.
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>No minimum balance required</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>200 free transactions per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Mobile and online banking included</span>
                </li>
              </ul>
              <Button onClick={() => setAuthDialogOpen(true)}>
                Open Account
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all border-primary">
              <CreditCard className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Business Credit Cards</h3>
              <p className="text-muted-foreground mb-4">
                Earn rewards on business expenses with no annual fee for the first year.
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Earn 2% cash back on purchases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>$500 bonus after $5,000 spent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Free employee cards</span>
                </li>
              </ul>
              <Button asChild>
                <Link to="/bank/credit-cards">Apply Now</Link>
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Business Loans</h3>
              <p className="text-muted-foreground mb-4">
                Competitive rates on business loans and lines of credit to fuel your growth.
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Up to $500,000 available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Fixed and variable rate options</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Fast approval process</span>
                </li>
              </ul>
              <Button asChild>
                <Link to="/bank/loans">Learn More</Link>
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Payroll Services</h3>
              <p className="text-muted-foreground mb-4">
                Simplify payroll processing with our integrated payroll solutions.
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Automated tax filing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Direct deposit for employees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Time tracking integration</span>
                </li>
              </ul>
              <Button variant="outline">Coming Soon</Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Merchant Services</h3>
              <p className="text-muted-foreground mb-4">
                Accept payments securely with our point-of-sale and online payment solutions.
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Accept all major cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Next-day funding available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Fraud protection included</span>
                </li>
              </ul>
              <Button variant="outline">Contact Us</Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Business Banking Online</h3>
              <p className="text-muted-foreground mb-4">
                Manage your business finances anytime, anywhere with our award-winning platform.
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Mobile check deposit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>ACH and wire transfers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Multi-user access controls</span>
                </li>
              </ul>
              <Button onClick={() => setAuthDialogOpen(true)}>
                Sign In
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to grow your business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Let's discuss how VaultBank can support your business goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => setAuthDialogOpen(true)}>
              Open Business Account
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/bank/locations">Schedule a Meeting</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <img src={vaultBankLogo} alt="VaultBank" className="h-12" />
            <div className="flex gap-6">
              <Link to="/bank" className="text-sm hover:text-primary">Home</Link>
              <Link to="/bank/business" className="text-sm hover:text-primary">Business</Link>
              <Link to="/bank/locations" className="text-sm hover:text-primary">Locations</Link>
              <button onClick={() => setAuthDialogOpen(true)} className="text-sm hover:text-primary">Sign In</button>
            </div>
          </div>
        </div>
      </footer>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default Business;
