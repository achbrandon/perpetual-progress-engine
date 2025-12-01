import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plane, Globe, Shield, CreditCard, MapPin, Wallet } from "lucide-react";
import vaultBankLogo from "@/assets/vaultbank-logo.png";
import travelHero from "@/assets/travel-hero.jpg";
import { AuthDialog } from "@/components/AuthDialog";
import { useState } from "react";

const Travel = () => {
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
          <img src={travelHero} alt="Travel Banking" className="w-full h-full object-cover opacity-40" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Plane className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Travel with Confidence
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Experience seamless banking while traveling the world with VaultBank's travel services and rewards
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/bank/credit-cards">Explore Travel Cards</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/bank/locations">Find International ATMs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Travel Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Travel Banking Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-all">
              <CreditCard className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Travel Rewards Cards</h3>
              <p className="text-muted-foreground mb-4">
                Earn bonus points on travel purchases and enjoy exclusive travel benefits
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Earn 3X points on travel and dining</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>50,000 bonus points after first purchase</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>No foreign transaction fees</span>
                </li>
              </ul>
              <Button asChild>
                <Link to="/bank/credit-cards">Apply Now</Link>
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all border-primary">
              <Globe className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Global ATM Access</h3>
              <p className="text-muted-foreground mb-4">
                Access your money worldwide with over 40,000 fee-free ATMs
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Fee-free withdrawals globally</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Competitive exchange rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>24/7 emergency card services</span>
                </li>
              </ul>
              <Button asChild>
                <Link to="/bank/locations">Find ATMs</Link>
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Travel Protection</h3>
              <p className="text-muted-foreground mb-4">
                Comprehensive coverage for your travels with premium cards
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Trip cancellation insurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Lost baggage reimbursement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Emergency medical coverage</span>
                </li>
              </ul>
              <Button variant="outline">Learn More</Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <MapPin className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Travel Notifications</h3>
              <p className="text-muted-foreground mb-4">
                Set travel alerts to use your cards seamlessly abroad
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Notify us of travel plans easily</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Avoid declined transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Real-time fraud monitoring</span>
                </li>
              </ul>
              <Button onClick={() => setAuthDialogOpen(true)}>
                Manage Alerts
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <Wallet className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Foreign Currency</h3>
              <p className="text-muted-foreground mb-4">
                Order foreign currency for pickup at select branches
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>80+ currencies available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Lock in exchange rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Convenient branch pickup</span>
                </li>
              </ul>
              <Button asChild>
                <Link to="/bank/locations">Order Currency</Link>
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <CreditCard className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Airport Lounge Access</h3>
              <p className="text-muted-foreground mb-4">
                Enjoy complimentary lounge access with premium travel cards
              </p>
              <ul className="space-y-2 mb-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>1,300+ lounges worldwide</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Complimentary food & drinks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Guest passes included</span>
                </li>
              </ul>
              <Button asChild>
                <Link to="/bank/credit-cards">Explore Premium Cards</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Travel Tips */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Travel Smart Tips</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-3">Before You Go</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Set up travel notifications in online banking</li>
                <li>• Make copies of important documents</li>
                <li>• Check your credit card benefits and coverage</li>
                <li>• Download our mobile banking app</li>
                <li>• Know emergency contact numbers</li>
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-3">While Traveling</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use ATMs inside banks when possible</li>
                <li>• Keep emergency cash in a safe place</li>
                <li>• Monitor your accounts regularly</li>
                <li>• Use chip-and-PIN when available</li>
                <li>• Save our 24/7 support number</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Your Journey with VaultBank</h2>
          <p className="text-xl mb-8 opacity-90">
            Get the right travel rewards card and banking tools for your adventures
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/bank/credit-cards">Apply for Travel Card</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={() => setAuthDialogOpen(true)}>
              Open Account
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
              <Link to="/bank/travel" className="text-sm hover:text-primary">Travel</Link>
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

export default Travel;
