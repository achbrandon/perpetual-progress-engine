import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, CheckCircle, Clock, TrendingUp } from "lucide-react";

export default function CardApplication() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    cardType: "",
    annualIncome: "",
    employmentStatus: "",
    requestedCreditLimit: ""
  });

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
    fetchApplications(user.id);
  };

  const fetchApplications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("card_applications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("card_applications").insert({
        user_id: user.id,
        card_type: formData.cardType,
        annual_income: parseFloat(formData.annualIncome),
        employment_status: formData.employmentStatus,
        requested_credit_limit: parseFloat(formData.requestedCreditLimit),
        application_status: "pending"
      });

      if (error) throw error;

      // Create admin notification
      await supabase.from("admin_notifications").insert({
        notification_type: "card_application",
        message: `New card application: ${formData.cardType} card`,
        user_id: user.id
      });

      toast.success("Card application submitted successfully!");
      setShowForm(false);
      setFormData({
        cardType: "",
        annualIncome: "",
        employmentStatus: "",
        requestedCreditLimit: ""
      });
      fetchApplications(user.id);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application");
    }
  };

  const cardTypes = [
    { value: "rewards", label: "Rewards Card", benefits: "2% Cash Back on All Purchases" },
    { value: "travel", label: "Travel Card", benefits: "3x Points on Travel & Dining" },
    { value: "cash_back", label: "Cash Back Card", benefits: "1.5% Cash Back + Bonus Categories" },
    { value: "premium", label: "Premium Card", benefits: "Exclusive Perks & Concierge Service" }
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Apply for a Credit Card
          </h1>
          <p className="text-muted-foreground mt-1">Choose the perfect card for your lifestyle</p>
        </div>
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Apply Now
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              Credit Card Application
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardType">Select Card Type</Label>
                  <Select value={formData.cardType} onValueChange={(value) => setFormData({ ...formData, cardType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a card" />
                    </SelectTrigger>
                    <SelectContent>
                      {cardTypes.map((card) => (
                        <SelectItem key={card.value} value={card.value}>
                          <div>
                            <p className="font-semibold">{card.label}</p>
                            <p className="text-xs text-muted-foreground">{card.benefits}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="annualIncome">Annual Income</Label>
                    <Input
                      id="annualIncome"
                      type="number"
                      placeholder="50000"
                      value={formData.annualIncome}
                      onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employmentStatus">Employment Status</Label>
                    <Select value={formData.employmentStatus} onValueChange={(value) => setFormData({ ...formData, employmentStatus: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed Full-Time</SelectItem>
                        <SelectItem value="self_employed">Self-Employed</SelectItem>
                        <SelectItem value="part_time">Part-Time</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="requestedCreditLimit">Requested Credit Limit</Label>
                    <Input
                      id="requestedCreditLimit"
                      type="number"
                      placeholder="5000"
                      value={formData.requestedCreditLimit}
                      onChange={(e) => setFormData({ ...formData, requestedCreditLimit: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Your actual credit limit will be determined based on your creditworthiness</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500">
                  Submit Application
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.map((app) => {
                const cardInfo = cardTypes.find(c => c.value === app.card_type);
                return (
                  <div key={app.id} className="flex items-center justify-between p-6 border rounded-xl hover:border-purple-500/50 transition-all bg-gradient-to-r from-transparent to-purple-500/5">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <CreditCard className="h-7 w-7 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{cardInfo?.label || app.card_type}</p>
                        <p className="text-sm text-muted-foreground">{cardInfo?.benefits}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={app.application_status === "approved" ? "default" : "secondary"}
                        className="mb-2"
                      >
                        {app.application_status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {app.application_status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {app.application_status}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Limit: ${parseFloat(app.requested_credit_limit).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">What to Expect</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Applications are typically reviewed within 1-2 business days</li>
                <li>• Your credit score will be checked as part of the application</li>
                <li>• Approval is subject to verification of income and employment</li>
                <li>• Once approved, your card will arrive within 7-10 business days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}