import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CreditCard, TrendingUp, Wallet, Building2, Bitcoin, MapPin, Menu, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import bankingHero from "@/assets/banking-hero.jpg";
import vaultBankLogo from "@/assets/vaultbank-logo.png";
import promoCheckingBonus from "@/assets/promo-checking-bonus.jpg";
import promoCreditCard from "@/assets/promo-credit-card.jpg";
import promoAdvisor from "@/assets/promo-advisor.jpg";
import bankExterior from "@/assets/vaultbank-entrance-new.png";
import bankLobby from "@/assets/bank-lobby.png";
import bankInterior from "@/assets/bank-interior.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { CheckingDetails } from "@/components/banking/CheckingDetails";
import { SavingsDetails } from "@/components/banking/SavingsDetails";
import { CreditCardsDetails } from "@/components/banking/CreditCardsDetails";
import { LoansDetails } from "@/components/banking/LoansDetails";
import { InvestmentsDetails } from "@/components/banking/InvestmentsDetails";
import { AuthDialog } from "@/components/AuthDialog";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

const Index = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'commercial'>('personal');
  const detailsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openAuthDialog) {
      setAuthDialogOpen(true);
    }
  }, [location]);

  const handleNavClick = (section: string) => {
    setActiveSection(section);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Utility Bar - Hidden on mobile */}
      <div className="bg-background border-b border-border hidden lg:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-sm">
            {/* Category Tabs - Left Side */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('personal')}
                className={`relative py-2 transition-smooth touch-manipulation ${
                  activeTab === 'personal' 
                    ? 'text-foreground font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Personal
              </button>
              <Link
                to="/business"
                className={`relative py-2 transition-smooth touch-manipulation ${
                  activeTab === 'business' 
                    ? 'text-foreground font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Business
              </Link>
              <button
                onClick={() => setActiveTab('commercial')}
                className={`relative py-2 transition-smooth touch-manipulation ${
                  activeTab === 'commercial' 
                    ? 'text-foreground font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Commercial
              </button>
            </div>

            {/* Utility Links - Right Side */}
            <div className="flex items-center gap-6">
              <Link to="/schedule-meeting" className="text-muted-foreground hover:text-foreground transition-smooth">
                Schedule a meeting
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-smooth">
                  Customer service
                  <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50">
                  <DropdownMenuItem>Contact Us</DropdownMenuItem>
                  <DropdownMenuItem>Help Center</DropdownMenuItem>
                  <DropdownMenuItem>FAQ</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-smooth">
                  Español
                  <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50">
                  <DropdownMenuItem>English</DropdownMenuItem>
                  <DropdownMenuItem>Español</DropdownMenuItem>
                  <DropdownMenuItem>Français</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50 w-full shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-full">
          <div className="flex items-center justify-between h-16 sm:h-18 w-full">
            <div className="flex items-center gap-3 sm:gap-6 flex-1">
              <Link to="/" className="flex items-center flex-shrink-0">
                <img src={vaultBankLogo} alt="VaultBank" className="h-10 sm:h-14 md:h-16" />
              </Link>
              <NavigationMenu className="hidden lg:flex flex-1">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium">Checking</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4">
                        <button onClick={() => handleNavClick('checking')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Choose a checking account
                        </button>
                        <button onClick={() => handleNavClick('checking')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Debit card for kids
                        </button>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium">Savings & CDs</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4">
                        <button onClick={() => handleNavClick('savings')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Choose a savings account
                        </button>
                        <button onClick={() => handleNavClick('cds')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          CDs
                        </button>
                        <button onClick={() => handleNavClick('money-market')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Money Market Account
                        </button>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium">Credit cards</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4">
                        <button onClick={() => handleNavClick('credit-cards')} className="block w-full text-left px-4 py-2 text-primary hover:bg-accent rounded-md font-medium">
                          Explore credit cards
                        </button>
                        <button onClick={() => handleNavClick('credit-cards')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          See if you're pre-approved
                        </button>
                        <div className="my-2 border-t border-border" />
                        <button onClick={() => handleNavClick('credit-cards')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Personal credit cards
                        </button>
                        <button onClick={() => handleNavClick('credit-cards')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Business credit cards
                        </button>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium">Home loans</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4">
                        <button onClick={() => handleNavClick('loans')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Buy a home
                        </button>
                        <button onClick={() => handleNavClick('loans')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Refinance your mortgage
                        </button>
                        <button onClick={() => handleNavClick('loans')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Apply for a mortgage
                        </button>
                        <div className="my-2 border-t border-border" />
                        <Link to="/mortgage-calculator" className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md text-primary font-medium">
                          Mortgage Calculator
                        </Link>
                        <button onClick={() => handleNavClick('loans')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          See current rates
                        </button>
                        <button onClick={() => handleNavClick('loans')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Manage account
                        </button>
                        <button onClick={() => handleNavClick('loans')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Homebuying 101
                        </button>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium">Auto</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4">
                        <button onClick={() => handleNavClick('loans')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Explore car financing
                        </button>
                        <button onClick={() => handleNavClick('loans')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Refinance your car
                        </button>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium">Investing by J.P. Morgan</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4">
                        <button onClick={() => handleNavClick('investments')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Explore investing
                        </button>
                        <button onClick={() => handleNavClick('investments')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Work with our advisors
                        </button>
                        <button onClick={() => handleNavClick('investments')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Invest on your own
                        </button>
                        <div className="my-2 border-t border-border" />
                        <button onClick={() => handleNavClick('investments')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Retirement and IRAs
                        </button>
                        <button onClick={() => handleNavClick('investments')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Education planning
                        </button>
                        <button onClick={() => handleNavClick('investments')} className="block w-full text-left px-4 py-2 hover:bg-accent rounded-md">
                          Investing insights
                        </button>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link to="/crypto" className={navigationMenuTriggerStyle()}>
                        Crypto
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                onClick={() => setAuthDialogOpen(true)} 
                size="sm"
                className="h-10 sm:h-11 px-5 sm:px-7 text-sm sm:text-base font-medium touch-manipulation shadow-sm hover:shadow-md transition-all"
              >
                Sign In
              </Button>
              
              {/* Mobile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger className="lg:hidden p-2.5 hover:bg-accent rounded-md touch-manipulation transition-colors" aria-label="Menu">
                  <Menu className="h-6 w-6" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50 w-56">
                  <DropdownMenuItem onClick={() => handleNavClick('checking')} className="py-3">
                    Checking
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('savings')} className="py-3">
                    Savings & CDs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('credit-cards')} className="py-3">
                    Credit cards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('loans')} className="py-3">
                    Home loans
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('loans')} className="py-3">
                    Auto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('investments')} className="py-3">
                    Investing
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-3">
                    <Link to="/crypto">Crypto</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="py-3">
                    <Link to="/schedule-meeting">Schedule Meeting</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero z-0">
          <img src={bankingHero} alt="Modern Banking" className="w-full h-full object-cover mix-blend-overlay opacity-30" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-0"></div>
        <div className="container mx-auto px-5 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 sm:mb-7 text-white animate-fade-in leading-tight tracking-tight">
              Banking Made <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-100 to-white">Simple</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-2xl text-white/95 mb-10 sm:mb-12 animate-fade-in font-light max-w-3xl mx-auto leading-relaxed">
              Experience modern banking with competitive rates, powerful tools, and exceptional service
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center animate-fade-in max-w-lg mx-auto sm:max-w-none">
              <Button 
                size="lg" 
                onClick={() => setAuthDialogOpen(true)} 
                className="text-base sm:text-lg h-14 sm:h-16 lg:h-18 px-10 sm:px-12 lg:px-14 font-semibold touch-manipulation shadow-elegant hover:shadow-glow transition-all rounded-xl"
              >
                Open Account
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="text-base sm:text-lg h-14 sm:h-16 lg:h-18 px-10 sm:px-12 lg:px-14 font-semibold bg-white/10 backdrop-blur-md border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 touch-manipulation transition-all rounded-xl"
              >
                <Link to="/checking">Explore Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-background via-secondary/20 to-background">
        <div className="container mx-auto px-5 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5">Featured Offers</h2>
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto">Exclusive benefits for VaultBank customers</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 bg-gradient-card animate-fade-in rounded-2xl">
              <div className="relative h-52 sm:h-56 overflow-hidden">
                <img src={promoCheckingBonus} alt="$300 Checking Bonus" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute top-5 right-5 bg-success text-success-foreground px-5 py-2.5 rounded-full text-sm font-bold shadow-lg">
                  $300 Bonus
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-3">New checking customers</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed text-sm sm:text-base">
                  Open a VaultBank Total Checking account with qualifying activities.
                </p>
                <Button onClick={() => setAuthDialogOpen(true)} className="w-full h-12 sm:h-13 font-semibold touch-manipulation">
                  Open an account
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 bg-gradient-card animate-fade-in rounded-2xl">
              <div className="relative h-52 sm:h-56 overflow-hidden">
                <img src={promoCreditCard} alt="Credit Card Rewards" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute top-5 right-5 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold shadow-lg">
                  $200 Bonus
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Earn rewards</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed text-sm sm:text-base">
                  Plus, earn unlimited 1.5% cash back on all purchases — no annual fee.
                </p>
                <Button asChild className="w-full h-12 sm:h-13 font-semibold touch-manipulation">
                  <Link to="/credit-cards">Learn more</Link>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 bg-gradient-card animate-fade-in rounded-2xl">
              <div className="relative h-52 sm:h-56 overflow-hidden">
                <img src={promoAdvisor} alt="Financial Advisor" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute top-5 right-5 bg-accent text-accent-foreground px-5 py-2.5 rounded-full text-sm font-bold shadow-lg">
                  Expert Help
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Partner with an Advisor</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed text-sm sm:text-base">
                  Get dedicated help reaching your individual investment goals.
                </p>
                <Button asChild className="w-full h-12 sm:h-13 font-semibold touch-manipulation">
                  <Link to="/investments">Continue</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Access Tiles */}
      <section className="py-14 sm:py-16">
        <div className="container mx-auto px-5 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-12">Choose what's right for you</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            <Link to="/credit-cards" className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-xl hover:bg-accent/50 transition-all group touch-manipulation">
              <CreditCard className="h-11 w-11 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-center leading-tight">Credit cards</span>
            </Link>
            <button onClick={() => handleNavClick('checking')} className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-xl hover:bg-accent/50 transition-all group touch-manipulation">
              <Wallet className="h-11 w-11 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-center leading-tight">Checking</span>
            </button>
            <button onClick={() => handleNavClick('savings')} className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-xl hover:bg-accent/50 transition-all group touch-manipulation">
              <TrendingUp className="h-11 w-11 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-center leading-tight">Savings</span>
            </button>
            <button onClick={() => handleNavClick('loans')} className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-xl hover:bg-accent/50 transition-all group touch-manipulation">
              <Building2 className="h-11 w-11 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-center leading-tight">Home loans</span>
            </button>
            <Link to="/investments" className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-xl hover:bg-accent/50 transition-all group touch-manipulation">
              <TrendingUp className="h-11 w-11 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-center leading-tight">Investments</span>
            </Link>
            <Link to="/crypto" className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-xl hover:bg-accent/50 transition-all group touch-manipulation">
              <Bitcoin className="h-11 w-11 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-center leading-tight">Crypto</span>
            </Link>
            <button onClick={() => setAuthDialogOpen(true)} className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-xl hover:bg-accent/50 transition-all group touch-manipulation">
              <Wallet className="h-11 w-11 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-center leading-tight">Free credit score</span>
            </button>
            <Link to="/locations" className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-xl hover:bg-accent/50 transition-all group touch-manipulation">
              <MapPin className="h-11 w-11 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold text-center leading-tight">Find locations</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Details Section - Shows when navigation item is clicked */}
      {activeSection && (
        <section ref={detailsRef} className="py-16 bg-background">
          <div className="container mx-auto px-4">
            {activeSection === 'checking' && <CheckingDetails onOpenAccount={() => setAuthDialogOpen(true)} />}
            {activeSection === 'savings' && <SavingsDetails onOpenAccount={() => setAuthDialogOpen(true)} />}
            {activeSection === 'credit-cards' && <CreditCardsDetails />}
            {activeSection === 'loans' && <LoansDetails />}
            {activeSection === 'investments' && <InvestmentsDetails />}
            {activeSection === 'cds' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">Certificates of Deposit (CDs)</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Lock in competitive rates with our flexible CD options
                  </p>
                </div>
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">CD Overview</h3>
                  <p className="text-muted-foreground mb-4">
                    Our CDs offer guaranteed returns with terms ranging from 3 months to 5 years. Choose the term that fits your financial goals.
                  </p>
                  <Button asChild>
                    <Link to="/cds">View Full CD Details →</Link>
                  </Button>
                </Card>
              </div>
            )}
            {activeSection === 'money-market' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">Money Market Account</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Earn competitive rates while maintaining easy access to your funds
                  </p>
                </div>
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4">Money Market Overview</h3>
                  <p className="text-muted-foreground mb-4">
                    Combine the benefits of checking and savings with our Money Market Account. Enjoy higher interest rates and limited check-writing privileges.
                  </p>
                  <Button asChild>
                    <Link to="/money-market">View Full Money Market Details →</Link>
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Services Grid */}
      <section className="py-16 sm:py-20 lg:py-24 bg-secondary/30">
        <div className="container mx-auto px-5 sm:px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 sm:mb-16">Our Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            <Card className="p-7 sm:p-8 hover:shadow-xl transition-all duration-300 group rounded-2xl border-0 bg-gradient-card">
              <Wallet className="h-12 w-12 sm:h-14 sm:w-14 text-primary mb-5 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Checking Accounts</h3>
              <p className="text-muted-foreground mb-5 text-sm sm:text-base leading-relaxed">
                Flexible accounts for everyday banking needs
              </p>
              <Button variant="link" asChild className="p-0 text-base font-semibold">
                <Link to="/checking">Learn More →</Link>
              </Button>
            </Card>

            <Card className="p-7 sm:p-8 hover:shadow-xl transition-all duration-300 group rounded-2xl border-0 bg-gradient-card">
              <TrendingUp className="h-12 w-12 sm:h-14 sm:w-14 text-primary mb-5 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Savings Accounts</h3>
              <p className="text-muted-foreground mb-5 text-sm sm:text-base leading-relaxed">
                Grow your money with competitive interest rates
              </p>
              <Button variant="link" asChild className="p-0 text-base font-semibold">
                <Link to="/savings">Learn More →</Link>
              </Button>
            </Card>

            <Card className="p-7 sm:p-8 hover:shadow-xl transition-all duration-300 group rounded-2xl border-0 bg-gradient-card">
              <CreditCard className="h-12 w-12 sm:h-14 sm:w-14 text-primary mb-5 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Credit Cards</h3>
              <p className="text-muted-foreground mb-5 text-sm sm:text-base leading-relaxed">
                Earn rewards and build your credit score
              </p>
              <Button variant="link" asChild className="p-0 text-base font-semibold">
                <Link to="/credit-cards">Learn More →</Link>
              </Button>
            </Card>

            <Card className="p-7 sm:p-8 hover:shadow-xl transition-all duration-300 group rounded-2xl border-0 bg-gradient-card">
              <Building2 className="h-12 w-12 sm:h-14 sm:w-14 text-primary mb-5 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Loans</h3>
              <p className="text-muted-foreground mb-5 text-sm sm:text-base leading-relaxed">
                Competitive rates for personal and home loans
              </p>
              <Button variant="link" asChild className="p-0 text-base font-semibold">
                <Link to="/loans">Learn More →</Link>
              </Button>
            </Card>

            <Card className="p-7 sm:p-8 hover:shadow-xl transition-all duration-300 group rounded-2xl border-0 bg-gradient-card">
              <TrendingUp className="h-12 w-12 sm:h-14 sm:w-14 text-primary mb-5 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Investments</h3>
              <p className="text-muted-foreground mb-5 text-sm sm:text-base leading-relaxed">
                Build wealth with expert investment guidance
              </p>
              <Button variant="link" asChild className="p-0 text-base font-semibold">
                <Link to="/investments">Learn More →</Link>
              </Button>
            </Card>

            <Card className="p-7 sm:p-8 hover:shadow-xl transition-all duration-300 group rounded-2xl border-0 bg-gradient-card">
              <Bitcoin className="h-12 w-12 sm:h-14 sm:w-14 text-primary mb-5 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Cryptocurrency</h3>
              <p className="text-muted-foreground mb-5 text-sm sm:text-base leading-relaxed">
                Buy, sell, and manage digital currencies
              </p>
              <Button variant="link" asChild className="p-0 text-base font-semibold">
                <Link to="/crypto">Learn More →</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Branch Location Showcase */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Visit Our Brodhead Branch</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Experience personalized banking at our modern facility located in the heart of Brodhead, Wisconsin
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">806 E Exchange St, Brodhead, WI 53520-0108</span>
              </div>
            </div>
            
            {/* Image Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group relative overflow-hidden rounded-lg shadow-lg">
                <img 
                  src={bankExterior} 
                  alt="VaultBank Brodhead Branch Exterior" 
                  className="w-full h-48 object-contain bg-muted transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-semibold">Modern Entrance</p>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg shadow-lg">
                <img 
                  src={bankLobby} 
                  alt="VaultBank Brodhead Branch Lobby" 
                  className="w-full h-48 object-contain bg-muted transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-semibold">Welcoming Lobby</p>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg shadow-lg">
                <img 
                  src={bankInterior} 
                  alt="VaultBank Brodhead Branch Interior" 
                  className="w-full h-48 object-contain bg-muted transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-semibold">Comfortable Banking</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button size="lg" asChild>
                <Link to="/locations">
                  <MapPin className="mr-2 h-5 w-5" />
                  Get Directions
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="p-8 bg-primary text-primary-foreground">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-6 opacity-90">
                Open your account today and experience banking that works for you
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" onClick={() => setAuthDialogOpen(true)}>
                  Open Account
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent hover:bg-primary-foreground/10" asChild>
                  <Link to="/locations">
                    <MapPin className="mr-2 h-5 w-5" />
                    Find Locations
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Additional Services & Resources */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Additional Services & Resources</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 hover:shadow-lg transition-all">
              <Building2 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Business Banking</h3>
              <p className="text-muted-foreground mb-4">
                Comprehensive banking solutions designed to help your business thrive and grow.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/business">Explore Business Services</Link>
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <MapPin className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Travel Banking</h3>
              <p className="text-muted-foreground mb-4">
                Travel rewards, global ATM access, and protection for your adventures worldwide.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/travel">Learn About Travel Services</Link>
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <MapPin className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Schedule a Meeting</h3>
              <p className="text-muted-foreground mb-4">
                Meet with our banking experts to discuss your financial goals and find the right solutions.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/locations">Find a Branch & Schedule</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Find answers to common questions about our services
          </p>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-card/50 backdrop-blur-sm rounded-xl border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                How do I open a new account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Opening a new account is easy! Simply click on "Open Account" in the navigation menu, choose the type of account you want (checking, savings, credit card, etc.), and follow the step-by-step process. You'll need a valid ID, Social Security number, and initial deposit. The entire process takes about 10 minutes and can be completed online.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card/50 backdrop-blur-sm rounded-xl border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                What are your interest rates?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our interest rates vary by account type and balance. Savings accounts start at 0.50% APY, high-yield savings at 4.50% APY, and CDs range from 4.00% to 5.25% APY depending on the term. Money market accounts offer competitive tiered rates up to 4.75% APY. Check our product pages for current rates and terms.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card/50 backdrop-blur-sm rounded-xl border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                Is my money insured?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! All deposit accounts are FDIC insured up to $250,000 per depositor, per account ownership category. This means your money is protected by the full faith and credit of the U.S. government. We take security seriously and use bank-level encryption to protect your information.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card/50 backdrop-blur-sm rounded-xl border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                How can I access my accounts?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can access your accounts 24/7 through our mobile app, online banking portal, phone banking, or at any of our branch locations and ATMs nationwide. Our mobile app features biometric login, mobile check deposit, bill pay, and person-to-person transfers for ultimate convenience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card/50 backdrop-blur-sm rounded-xl border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                What fees do you charge?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We believe in transparent pricing. Many of our accounts have no monthly maintenance fees when you meet simple requirements like maintaining a minimum balance or setting up direct deposit. We never charge fees for online bill pay, mobile deposits, or e-statements. Check our fee schedule for complete details on all account types.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card/50 backdrop-blur-sm rounded-xl border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                How do I schedule a meeting with an advisor?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can schedule a meeting by clicking the "Schedule a meeting" button in the navigation menu. You'll be able to choose between in-person meetings at any of our branches or virtual meetings via video call. Our advisors can help with investment planning, loans, mortgages, and all your financial needs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 backdrop-blur-sm border-t mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-heading font-bold text-lg mb-4">About VaultBank</h3>
              <Accordion type="single" collapsible>
                <AccordionItem value="about" className="border-none">
                  <AccordionTrigger className="text-muted-foreground hover:text-primary py-2 hover:no-underline text-left">
                    Learn More
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <div><a href="#" className="block hover:text-primary transition-colors">About Us</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Careers</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Press</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Investor Relations</a></div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg mb-4">Support</h3>
              <Accordion type="single" collapsible>
                <AccordionItem value="support" className="border-none">
                  <AccordionTrigger className="text-muted-foreground hover:text-primary py-2 hover:no-underline text-left">
                    Get Help
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <div><a href="#" className="block hover:text-primary transition-colors">Help Center</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Contact Us</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Security Center</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Report Fraud</a></div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg mb-4">Legal</h3>
              <Accordion type="single" collapsible>
                <AccordionItem value="legal" className="border-none">
                  <AccordionTrigger className="text-muted-foreground hover:text-primary py-2 hover:no-underline text-left">
                    Policies
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <div><a href="#" className="block hover:text-primary transition-colors">Privacy Policy</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Terms of Service</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Accessibility</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Disclosures</a></div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg mb-4">Connect</h3>
              <Accordion type="single" collapsible>
                <AccordionItem value="social" className="border-none">
                  <AccordionTrigger className="text-muted-foreground hover:text-primary py-2 hover:no-underline text-left">
                    Follow Us
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-muted-foreground">
                    <div><a href="#" className="block hover:text-primary transition-colors">Facebook</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Twitter</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">LinkedIn</a></div>
                    <div><a href="#" className="block hover:text-primary transition-colors">Instagram</a></div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 VaultBank. All rights reserved. Member FDIC.</p>
          </div>
        </div>
      </footer>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default Index;
