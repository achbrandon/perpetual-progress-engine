import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gift, Star, CreditCard, Percent, Calendar } from "lucide-react";

export default function Offers() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/bank/login");
      return;
    }
    setUser(user);
    fetchOffers(user.id);
  };

  const fetchOffers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setOffers(data);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const claimOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from("offers")
        .update({ is_claimed: true })
        .eq("id", offerId);

      if (error) throw error;

      toast.success("Offer claimed successfully!");
      if (user) fetchOffers(user.id);
    } catch (error) {
      console.error("Error claiming offer:", error);
      toast.error("Failed to claim offer");
    }
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case "cashback":
        return <Percent className="h-6 w-6" />;
      case "credit_card":
        return <CreditCard className="h-6 w-6" />;
      case "rewards":
        return <Star className="h-6 w-6" />;
      default:
        return <Gift className="h-6 w-6" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Offers & Rewards</h1>
        <p className="text-muted-foreground">Exclusive offers personalized for you</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {offers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No offers available at this time</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for personalized deals</p>
            </CardContent>
          </Card>
        ) : (
          offers.map((offer) => (
            <Card key={offer.id} className="relative overflow-hidden">
              {!offer.is_claimed && offer.expiry_date && (
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    Expires {new Date(offer.expiry_date).toLocaleDateString()}
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white mb-4">
                  {getOfferIcon(offer.offer_type)}
                </div>
                <CardTitle className="text-xl">{offer.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{offer.description}</p>
                
                {offer.value && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{offer.value}</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => claimOffer(offer.id)}
                  disabled={offer.is_claimed}
                  variant={offer.is_claimed ? "secondary" : "default"}
                >
                  {offer.is_claimed ? "Already Claimed" : "Claim Offer"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rewards Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 border rounded-lg">
              <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-muted-foreground">Points Earned</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <Gift className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-3xl font-bold mb-2">$0</p>
              <p className="text-muted-foreground">Rewards Value</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <Percent className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-3xl font-bold mb-2">$0</p>
              <p className="text-muted-foreground">Cash Back</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
