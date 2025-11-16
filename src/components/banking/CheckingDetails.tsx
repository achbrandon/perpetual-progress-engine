import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface CheckingDetailsProps {
  onOpenAccount?: () => void;
}

export const CheckingDetails = ({ onOpenAccount }: CheckingDetailsProps) => {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Checking Accounts</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the checking account that fits your lifestyle. From everyday banking to premium benefits, we have options for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Standard Checking */}
          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Standard Checking Account</h3>
              <p className="text-muted-foreground">Everyday banking made simple</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-4xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground">Monthly fee with qualifying activities*</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">No minimum balance required to open</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Free debit card with chip technology</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Access to 16,000+ ATMs nationwide</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Mobile banking with mobile check deposit</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Online bill pay at no extra cost</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={onOpenAccount}>
              Open Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          {/* Plus Checking */}
          <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-primary border-2">
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Plus Checking Account</h3>
              <p className="text-muted-foreground">Enhanced features for active users</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-4xl font-bold">$4.95</p>
              <p className="text-sm text-muted-foreground">Monthly fee, waived with $1,500 balance</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Everything in Standard Checking</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">No overdraft fees on first 3 transactions</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Free personalized checks</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Identity theft protection</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Cash back rewards on debit card purchases</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={onOpenAccount}>
              Open Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          {/* Premier Checking */}
          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Premier Checking Account</h3>
              <p className="text-muted-foreground">Premium benefits for high-balance customers</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-4xl font-bold">$25</p>
              <p className="text-sm text-muted-foreground">Monthly fee, waived with $15,000 balance</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Everything in Plus Checking</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">No foreign transaction fees</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Dedicated customer service line</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Premium rewards program</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Free safe deposit box (small size)</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={onOpenAccount}>
              Open Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        </div>

        <div className="bg-card p-8 rounded-lg">
          <h3 className="text-2xl font-bold mb-6">Additional Features</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Digital Banking</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 24/7 online and mobile banking</li>
                <li>• Instant balance alerts and notifications</li>
                <li>• Mobile check deposit from anywhere</li>
                <li>• Person-to-person payments with Zelle®</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Security Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Zero liability fraud protection</li>
                <li>• Two-factor authentication</li>
                <li>• Biometric login (fingerprint/face ID)</li>
                <li>• Real-time transaction alerts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-lg font-semibold">
                What is the minimum deposit to open a checking account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                There's no minimum deposit required to open a Standard Checking account. You can start with any amount. However, maintaining certain balances may help you avoid monthly fees and qualify for additional benefits.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-lg font-semibold">
                How can I avoid monthly maintenance fees?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can waive monthly fees by: maintaining a minimum daily balance ($1,500 for Plus, $15,000 for Premier), setting up direct deposit of at least $500, or making 5+ debit card purchases per month. Specific requirements vary by account type.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Are there ATM fees?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                VaultBank has over 16,000 fee-free ATMs nationwide. Using out-of-network ATMs may incur a fee of $2.50 per transaction, plus any fees charged by the ATM owner. Premier checking customers get unlimited ATM fee rebates.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-lg font-semibold">
                What overdraft protection options are available?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer overdraft protection by linking your checking to a savings account or credit line. Plus checking customers get 3 fee-free overdraft transactions per year. You can also opt out of overdraft coverage entirely.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Can I open a joint checking account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, all checking accounts can be opened as joint accounts with another person. Both account holders have full access and equal rights to the account. <span className="font-semibold">Important:</span> To activate a joint account, the person joining (partner) must deposit 1% of the current account balance from their own external bank account. This mandatory activation deposit ensures proper account verification and compliance. After activation, direct transfers between joint holders are permanently prohibited, and both parties are responsible for maintaining the account balance and avoiding fees.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left text-lg font-semibold">
                How do I access my account online?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Download our mobile app or visit our website to access your account 24/7. You can check balances, transfer funds, pay bills, deposit checks, and more. Enroll in online banking when you open your account or visit any branch.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};
