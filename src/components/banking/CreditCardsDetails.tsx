import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, CreditCard as CreditCardIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const CreditCardsDetails = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Credit Cards</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Earn rewards, build credit, and enjoy fraud protection with our range of credit cards designed for every lifestyle.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <div className="w-full h-48 bg-gradient-to-br from-primary to-accent rounded-lg mb-4 p-6 text-primary-foreground">
                <div className="flex justify-between items-start mb-8">
                  <CreditCardIcon className="h-10 w-10" />
                  <div className="text-right text-sm">
                    <p className="font-semibold">VaultBank</p>
                    <p>Cash Rewards</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl tracking-wider">•••• •••• •••• 1234</p>
                  <div className="flex justify-between text-xs">
                    <span>CARDHOLDER NAME</span>
                    <span>EXP 12/28</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Cash Rewards Card</h3>
              <p className="text-muted-foreground">Earn cash back on every purchase</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-4xl font-bold">1.5%</p>
              <p className="text-sm text-muted-foreground">Cash back on all purchases</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">No annual fee</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">0% intro APR for 15 months</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">$200 bonus after spending $1,000</p>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-primary border-2">
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                MOST POPULAR
              </div>
              <div className="w-full h-48 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg mb-4 p-6 text-white">
                <div className="flex justify-between items-start mb-8">
                  <CreditCardIcon className="h-10 w-10" />
                  <div className="text-right text-sm">
                    <p className="font-semibold">VaultBank</p>
                    <p>Travel Rewards</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl tracking-wider">•••• •••• •••• 5678</p>
                  <div className="flex justify-between text-xs">
                    <span>CARDHOLDER NAME</span>
                    <span>EXP 12/28</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Travel Rewards Card</h3>
              <p className="text-muted-foreground">Earn points on travel and dining</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-4xl font-bold">3X</p>
              <p className="text-sm text-muted-foreground">Points on travel & dining</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">$95 annual fee</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">50,000 bonus points after $4,000 spend</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">No foreign transaction fees</p>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <div className="w-full h-48 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg mb-4 p-6 text-white">
                <div className="flex justify-between items-start mb-8">
                  <CreditCardIcon className="h-10 w-10" />
                  <div className="text-right text-sm">
                    <p className="font-semibold">VaultBank</p>
                    <p>Premium</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl tracking-wider">•••• •••• •••• 9012</p>
                  <div className="flex justify-between text-xs">
                    <span>CARDHOLDER NAME</span>
                    <span>EXP 12/28</span>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Premium Card</h3>
              <p className="text-muted-foreground">Exclusive benefits and concierge</p>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-4xl font-bold">5X</p>
              <p className="text-sm text-muted-foreground">Points on select categories</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">$550 annual fee</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">$300 annual travel credit</p>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Airport lounge access</p>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h3>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-lg font-semibold">
                How do I choose the right credit card?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Consider your spending habits and goals. If you want cash back on everyday purchases, choose our Cash Rewards card. For frequent travelers, the Travel Rewards card offers bonus points and no foreign transaction fees. If you want premium perks, the Premium card provides exclusive benefits and higher rewards.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-lg font-semibold">
                What credit score do I need to qualify?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Generally, you'll need a credit score of 670 or higher for our standard cards, and 740+ for premium cards. However, we consider multiple factors including income, employment, and credit history when reviewing applications.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-lg font-semibold">
                How long does it take to get approved?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Most applications are reviewed instantly, and you'll receive a decision within 60 seconds. In some cases, additional review may be needed, which can take 7-10 business days. Once approved, you'll receive your card within 7-10 business days.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-lg font-semibold">
                When will I receive my sign-up bonus?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sign-up bonuses are typically credited to your account within 6-8 weeks after you meet the spending requirement. The spending requirement must be met within the first 3 months of account opening.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Are there foreign transaction fees?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our Cash Rewards card charges a 3% foreign transaction fee. However, both our Travel Rewards and Premium cards have no foreign transaction fees, making them ideal for international travel.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left text-lg font-semibold">
                How do I redeem my rewards?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can redeem rewards anytime through our mobile app or online banking. Cash back can be deposited directly into your VaultBank account, used as a statement credit, or redeemed for gift cards. Travel points can be redeemed for flights, hotels, car rentals, or transferred to travel partners.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left text-lg font-semibold">
                Can I add an authorized user or joint holder to my credit card account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, you can add authorized users to your credit card account. For full joint account status, both account holders have equal access and responsibility. <span className="font-semibold">Important:</span> To activate a joint credit card account, the person joining (partner) must deposit 1% of the current account balance from their own external bank account. This mandatory activation deposit ensures proper account verification and compliance. After activation, direct transfers between joint holders are permanently prohibited.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};
