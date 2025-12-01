import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Car, Home, DollarSign, Calculator, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const LoansDetails = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Making Homeownership Surprisingly Simple
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              From finding your dream home to getting the keys – we're here to help every step of the way.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="premium" size="lg" asChild>
                <Link to="/bank/open-account">Start Online Application</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/bank/mortgage-calculator">
                  <Calculator className="mr-2 h-5 w-5" />
                  Estimate Your Payment
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Your Home Journey Starts Here */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Your Home Journey Starts Here</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Buying a Home */}
            <Card className="p-8 hover:shadow-elegant transition-all duration-300 hover-scale">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-6">
                <Home className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Buying a Home</h3>
              <p className="text-muted-foreground mb-6">
                Buying a home can be truly rewarding. It's also one of the biggest investments you'll make. From finding your new place to getting the keys – we're here to help.
              </p>
              <div className="space-y-3">
                <Button variant="default" className="w-full" asChild>
                  <Link to="/bank/open-account">Get Started</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/bank/mortgage-calculator">Estimate Your Rate</Link>
                </Button>
              </div>
            </Card>

            {/* Refinancing */}
            <Card className="p-8 hover:shadow-elegant transition-all duration-300 hover-scale border-primary border-2">
              <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-4">
                SAVE MONEY
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Refinancing Your Mortgage</h3>
              <p className="text-muted-foreground mb-6">
                Refinancing can help you lower your monthly payment, pay off your loan sooner, or tap into the equity you've built in your home.
              </p>
              <div className="space-y-3">
                <Button variant="premium" className="w-full" asChild>
                  <Link to="/bank/open-account">Refinance Now</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/bank/mortgage-calculator">Calculate New Payment</Link>
                </Button>
              </div>
            </Card>

            {/* Home Equity */}
            <Card className="p-8 hover:shadow-elegant transition-all duration-300 hover-scale">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-6">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Access Your Equity</h3>
              <p className="text-muted-foreground mb-6">
                Use the equity you've built to pay for improvements, consolidate debt, pay for college, and more.
              </p>
              <div className="space-y-3">
                <Button variant="default" className="w-full" asChild>
                  <Link to="/bank/open-account">Get Started</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/bank/mortgage-calculator">Check Home Value</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Loan Types */}
      <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Loans & Financing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Competitive rates and flexible terms for all your borrowing needs. Quick approval and personalized service.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Personal Loans</h3>
              <p className="text-muted-foreground">Flexible funding for any purpose</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-4xl font-bold">6.99%</p>
                <span className="text-muted-foreground">APR*</span>
              </div>
              <p className="text-sm text-muted-foreground">Rates as low as | Fixed rate</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Borrow $5,000 to $100,000</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Terms from 12 to 84 months</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">No origination fees</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Same-day funding available</p>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-primary border-2">
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                POPULAR
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Auto Loans</h3>
              <p className="text-muted-foreground">Finance your dream vehicle</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-4xl font-bold">4.49%</p>
                <span className="text-muted-foreground">APR*</span>
              </div>
              <p className="text-sm text-muted-foreground">Rates as low as | 60-month term</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">New and used vehicles</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">100% financing available</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">No prepayment penalties</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Gap insurance available</p>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Home Loans</h3>
              <p className="text-muted-foreground">Purchase or refinance your home</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-4xl font-bold">6.25%</p>
                <span className="text-muted-foreground">APR*</span>
              </div>
              <p className="text-sm text-muted-foreground">30-year fixed rate mortgage</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Purchase or refinance</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Down payments as low as 3%</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Fixed and adjustable rates</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Dedicated loan officer</p>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        </div>

        {/* Tools & Resources */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-primary text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">Tools & Resources</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <Calculator className="h-12 w-12 mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Mortgage Calculator</h4>
                <p className="text-white/80 text-sm mb-4">Estimate your monthly payment and see how much you can afford</p>
                <Button variant="secondary" asChild>
                  <Link to="/bank/mortgage-calculator">Calculate Now</Link>
                </Button>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Get Pre-Approved</h4>
                <p className="text-white/80 text-sm mb-4">Quick and easy pre-approval to strengthen your offer</p>
                <Button variant="secondary" asChild>
                  <Link to="/bank/open-account">Start Application</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  How much do I need for a down payment?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Down payment requirements vary by loan type. Conventional loans may require as little as 3% down, FHA loans 3.5%, and VA loans often require no down payment at all. The more you put down, the lower your monthly payment and interest costs will be.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  What is the difference between pre-qualification and pre-approval?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Pre-qualification is an estimate of how much you might be able to borrow based on basic financial information. Pre-approval is more comprehensive and involves a credit check and verification of your financial documents. A pre-approval letter shows sellers you're a serious buyer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  Should I choose a fixed or adjustable rate mortgage?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Fixed-rate mortgages offer stability with the same rate for the entire loan term. Adjustable-rate mortgages (ARMs) often start with lower rates but can change over time. Fixed rates are ideal if you plan to stay in your home long-term, while ARMs might work if you plan to move or refinance within a few years.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  What credit score do I need to qualify for a mortgage?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Generally, you'll need a credit score of at least 620 for a conventional loan, 580 for an FHA loan, and 640 for a VA loan. However, higher credit scores typically qualify for better interest rates. We recommend checking your credit score and taking steps to improve it before applying.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  How long does the mortgage approval process take?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The typical mortgage approval process takes 30-45 days from application to closing. However, this can vary based on factors like your financial situation, the property, and how quickly you provide required documentation. Getting pre-approved can help speed up the process.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  What closing costs should I expect?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Closing costs typically range from 2-5% of the loan amount and include fees for appraisal, title insurance, attorney fees, property taxes, homeowners insurance, and lender origination fees. We'll provide you with a detailed Loan Estimate that outlines all costs upfront.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left text-lg font-semibold">
                  Can I add a co-borrower or joint holder to my loan account?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, all loan accounts can have joint holders or co-borrowers added. Both parties share equal responsibility for the loan. <span className="font-semibold">Important:</span> To activate a joint loan account, the person joining (partner) must deposit 1% of the current account balance from their own external bank account. This mandatory activation deposit ensures proper account verification and compliance. After activation, direct transfers between joint holders are permanently prohibited.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
};
