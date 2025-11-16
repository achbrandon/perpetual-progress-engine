import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SavingsDetailsProps {
  onOpenAccount?: () => void;
}

export const SavingsDetails = ({ onOpenAccount }: SavingsDetailsProps) => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Savings Accounts</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Grow your money with competitive rates and flexible access. Start saving for your future today.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Basic Savings Account</h3>
              <p className="text-muted-foreground">Simple savings with great flexibility</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-4xl font-bold">0.45%</p>
                <span className="text-muted-foreground">APY*</span>
              </div>
              <p className="text-sm text-muted-foreground">On all balances</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">$25 minimum to open</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">No monthly maintenance fee</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">FDIC insured up to $250,000</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Link to checking for overdraft protection</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={onOpenAccount}>
              Open Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-primary border-2">
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                BEST RATE
              </div>
              <h3 className="text-2xl font-bold mb-2">High-Yield Savings</h3>
              <p className="text-muted-foreground">Maximize your savings growth</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-4xl font-bold">4.50%</p>
                <span className="text-muted-foreground">APY*</span>
              </div>
              <p className="text-sm text-muted-foreground">On balances $10,000+</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">$1,000 minimum to open</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Tiered interest rates</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">No monthly fees with $5,000 balance</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Automatic savings tools</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={onOpenAccount}>
              Open Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          <Link to="/money-market" className="block">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-primary">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Money Market Account</h3>
                <p className="text-muted-foreground">High rates with check writing</p>
              </div>

              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-4xl font-bold">3.85%</p>
                  <span className="text-muted-foreground">APY*</span>
                </div>
                <p className="text-sm text-muted-foreground">With $25,000 minimum balance</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Check writing privileges</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Debit card access</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Competitive tiered rates</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">FDIC insured</p>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Learn More <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Card>
          </Link>
        </div>

        {/* Additional Savings Products */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold mb-6 text-center">More Ways to Save</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link to="/cds" className="block">
              <Card className="p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-primary">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Certificates of Deposit (CDs)</h3>
                  <p className="text-muted-foreground">Lock in guaranteed returns</p>
                </div>

                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-4xl font-bold">Up to 5.00%</p>
                    <span className="text-muted-foreground">APY*</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Terms from 6 months to 5 years</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Fixed interest rates</p>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Flexible terms available</p>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm">FDIC insured</p>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Guaranteed returns</p>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Explore CD Options <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Card>
            </Link>

            <Card className="p-8 bg-secondary border-2 border-muted">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Compare All Options</h3>
                <p className="text-muted-foreground">Find the perfect savings solution</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Basic Savings for everyday needs</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">High-Yield for maximum growth</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Money Market for flexibility</p>
                </div>
                <div className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">CDs for guaranteed returns</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Not sure which account is right for you? Our team can help you choose the best option for your financial goals.
              </p>
            </Card>
          </div>
        </div>

        <div className="bg-secondary p-8 rounded-lg mb-12">
          <div className="flex items-start gap-4">
            <TrendingUp className="h-12 w-12 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-bold mb-3">Why Save with VaultBank?</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Competitive Rates</h4>
                  <p className="text-sm text-muted-foreground">
                    Our rates are among the highest in the industry, helping your money grow faster.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">FDIC Insured</h4>
                  <p className="text-sm text-muted-foreground">
                    Your deposits are protected up to $250,000 per depositor by the FDIC.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Easy Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Transfer funds anytime through our mobile app or online banking platform.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Automatic Savings</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up automatic transfers to make saving effortless and consistent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-lg font-semibold">
                What's the difference between savings and money market accounts?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Savings accounts offer competitive interest rates with easy access to your funds. Money market accounts typically offer higher rates but require higher minimum balances and may come with check-writing privileges and debit card access.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-lg font-semibold">
                How is my money protected?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All VaultBank deposit accounts are FDIC insured up to $250,000 per depositor, per insured bank, for each account ownership category. This means your deposits are backed by the full faith and credit of the U.S. government.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Can I withdraw money from my savings account at any time?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, you can access your money whenever you need it. However, federal regulations previously limited certain types of withdrawals to 6 per month. While this requirement has been lifted, we encourage you to keep your savings separate from daily spending for better financial health.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-lg font-semibold">
                How often is interest paid on savings accounts?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Interest is compounded daily and credited to your account monthly. This means your interest earns interest, helping your savings grow faster. The Annual Percentage Yield (APY) includes the effect of compounding.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Should I choose a CD or a savings account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                CDs typically offer higher interest rates but require you to lock in your money for a specific term (6 months to 5 years). Choose a CD if you don't need immediate access to your funds and want a guaranteed rate. Choose a savings account for flexibility and regular access to your money.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Can I set up automatic transfers to my savings account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! You can set up automatic transfers from your checking account to your savings account on a schedule that works for you—weekly, bi-weekly, or monthly. This "pay yourself first" approach makes saving effortless.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Can I add a joint holder to my savings account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, all savings accounts can have joint holders added. Both account holders have full access and equal rights to the account. <span className="font-semibold">Important:</span> To activate a joint account, the person joining (partner) must deposit 1% of the current account balance from their own external bank account. This mandatory activation deposit ensures proper account verification and compliance. After activation, direct transfers between joint holders are permanently prohibited.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};
