import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, Lock, Unlock, Eye, EyeOff, RotateCw } from "lucide-react";

export default function Cards() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());

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
    fetchCards(user.id);
  };

  const fetchCards = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("*, accounts(account_name)")
        .eq("user_id", userId);

      if (error) throw error;
      if (data) setCards(data);
    } catch (error) {
      console.error("Error fetching cards:", error);
      toast.error("Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  const toggleCardLock = async (cardId: string, currentLockState: boolean) => {
    try {
      const { error } = await supabase
        .from("cards")
        .update({ is_locked: !currentLockState })
        .eq("id", cardId);

      if (error) throw error;

      toast.success(currentLockState ? "Card unlocked" : "Card locked");
      if (user) fetchCards(user.id);
    } catch (error) {
      console.error("Error toggling card lock:", error);
      toast.error("Failed to update card status");
    }
  };

  const toggleCardVisibility = (cardId: string) => {
    setVisibleCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const maskCardNumber = (cardNumber: string, visible: boolean) => {
    if (visible) return cardNumber;
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Card Management</h1>
        <p className="text-muted-foreground">Manage your debit and credit cards</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {cards.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No cards found</p>
            </CardContent>
          </Card>
        ) : (
          cards.map((card) => (
            <Card key={card.id} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{card.accounts?.account_name}</CardTitle>
                  <Badge variant={card.card_status === "active" ? "default" : "destructive"}>
                    {card.card_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-mono tracking-wider">
                      {maskCardNumber(card.card_number, visibleCards.has(card.id))}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCardVisibility(card.id)}
                    >
                      {visibleCards.has(card.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expires: {card.expiry_date}</span>
                    <span className="text-muted-foreground">CVV: {visibleCards.has(card.id) ? card.cvv : "***"}</span>
                  </div>
                  <Badge variant="outline">{card.card_type}</Badge>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {card.is_locked ? (
                        <Lock className="h-4 w-4 text-red-500" />
                      ) : (
                        <Unlock className="h-4 w-4 text-green-500" />
                      )}
                      <Label htmlFor={`lock-${card.id}`}>
                        {card.is_locked ? "Card Locked" : "Card Unlocked"}
                      </Label>
                    </div>
                    <Switch
                      id={`lock-${card.id}`}
                      checked={!card.is_locked}
                      onCheckedChange={() => toggleCardLock(card.id, card.is_locked)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <RotateCw className="h-4 w-4 mr-2" />
                      Replace Card
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Change PIN
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
