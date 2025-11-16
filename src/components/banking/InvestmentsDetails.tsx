import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, TrendingUp, PieChart, Target } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const InvestmentsDetails = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Investment Services</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Build wealth for the future with our comprehensive investment solutions. Professional guidance and powerful tools to help you reach your goals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Retirement Accounts (IRA)</h3>
              <p className="text-muted-foreground">Tax-advantaged retirement savings</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-4xl font-bold mb-2">Traditional & Roth</p>
              <p className="text-sm text-muted-foreground">Choose the IRA that fits your needs</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Tax deductions or tax-free growth</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Contribute up to $7,000/year</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Wide range of investment options</p>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Open IRA <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-primary border-2">
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                RECOMMENDED
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <PieChart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Managed Portfolio</h3>
              <p className="text-muted-foreground">Professional investment management</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-4xl font-bold">0.50%</p>
                <span className="text-muted-foreground">Annual fee</span>
              </div>
              <p className="text-sm text-muted-foreground">Transparent pricing</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Personalized portfolio strategy</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Automatic rebalancing</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Dedicated financial advisor</p>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Self-Directed Trading</h3>
              <p className="text-muted-foreground">Take control of your investments</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-4xl font-bold mb-2">$0</p>
              <p className="text-sm text-muted-foreground">Commission-free stock trades</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Trade stocks, ETFs, and options</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Advanced trading tools</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Real-time market data</p>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Start Trading <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-lg font-semibold">
                What's the difference between a Traditional and Roth IRA?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Traditional IRAs offer tax deductions on contributions now, but you pay taxes when you withdraw in retirement. Roth IRAs are funded with after-tax dollars, but your withdrawals in retirement are tax-free. The best choice depends on whether you expect to be in a higher tax bracket now or in retirement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-lg font-semibold">
                How much should I contribute to my retirement account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Financial experts typically recommend saving 10-15% of your gross income for retirement. For 2024, you can contribute up to $7,000 to an IRA ($8,000 if you're 50 or older). Start with what you can afford and increase contributions over time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-lg font-semibold">
                What fees will I pay for investment management?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our managed portfolio service charges 0.50% annually of assets under management, which is competitive with industry standards. Self-directed trading has $0 commission on stock and ETF trades. Mutual funds and other investments may have their own expense ratios.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Can I roll over my 401(k) from a previous employer?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can roll over your 401(k) to a VaultBank IRA without paying taxes or penalties. We'll guide you through the process and help you choose the right investment strategy for your retirement goals.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left text-lg font-semibold">
                What investment options are available?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer a wide range of investment options including individual stocks, bonds, ETFs, mutual funds, and target-date funds. Our managed portfolios use diversified portfolios of low-cost index funds tailored to your risk tolerance and timeline.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Do I need a financial advisor?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                It depends on your needs. If you're new to investing or have complex financial situations, a financial advisor can provide valuable guidance. Our managed portfolio service includes advisor access. Experienced investors may prefer our self-directed platform with powerful tools and research.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Can I add a joint holder to my investment account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, all investment accounts can have joint holders added. Both account holders have full access and equal rights to the account. <span className="font-semibold">Important:</span> To activate a joint account, the person joining (partner) must deposit 1% of the current account balance from their own external bank account. This mandatory activation deposit ensures proper account verification and compliance. After activation, direct transfers between joint holders are permanently prohibited.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};
