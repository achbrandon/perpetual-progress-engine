import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function CreditScore() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [creditScores, setCreditScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchCreditScores(user.id);
  };

  const fetchCreditScores = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("credit_scores")
        .select("*")
        .eq("user_id", userId)
        .order("report_date", { ascending: false });

      if (error) throw error;
      if (data) setCreditScores(data);
    } catch (error) {
      console.error("Error fetching credit scores:", error);
      toast.error("Failed to load credit scores");
    } finally {
      setLoading(false);
    }
  };

  const getScoreRating = (score: number) => {
    if (score >= 800) return { label: "Excellent", color: "text-green-600" };
    if (score >= 740) return { label: "Very Good", color: "text-blue-600" };
    if (score >= 670) return { label: "Good", color: "text-yellow-600" };
    if (score >= 580) return { label: "Fair", color: "text-orange-600" };
    return { label: "Poor", color: "text-red-600" };
  };

  const latestScore = creditScores[0];
  const previousScore = creditScores[1];
  const scoreChange = latestScore && previousScore ? latestScore.score - previousScore.score : 0;

  // Prepare chart data
  const chartData = creditScores
    .slice()
    .reverse()
    .map((score) => ({
      date: new Date(score.report_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      score: score.score,
      fullDate: score.report_date,
    }));

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Credit Journey</h1>
        <p className="text-muted-foreground">Monitor and improve your credit score</p>
      </div>

      {creditScores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No credit score data available</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your Credit Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold">{latestScore.score}</span>
                    <span className="text-2xl text-muted-foreground">/ 850</span>
                  </div>
                  <Badge className={`mt-2 ${getScoreRating(latestScore.score).color}`} variant="outline">
                    {getScoreRating(latestScore.score).label}
                  </Badge>
                </div>
                {scoreChange !== 0 && (
                  <div className={`flex items-center gap-2 ${scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {scoreChange > 0 ? (
                      <TrendingUp className="h-8 w-8" />
                    ) : (
                      <TrendingDown className="h-8 w-8" />
                    )}
                    <span className="text-2xl font-semibold">{Math.abs(scoreChange)}</span>
                  </div>
                )}
              </div>

              <Progress value={(latestScore.score / 850) * 100} className="h-4" />

              <div className="mt-4 text-sm text-muted-foreground">
                Last updated: {new Date(latestScore.report_date).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          {/* Credit Score History Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Credit Score History
              </CardTitle>
              <CardDescription>
                Your credit score trend over time based on all account activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      domain={[300, 850]} 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fill="url(#scoreGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Starting Score</p>
                  <p className="text-2xl font-bold">{chartData[0]?.score || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{chartData[0]?.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Score</p>
                  <p className="text-2xl font-bold text-primary">{latestScore.score}</p>
                  <p className="text-xs text-muted-foreground">{chartData[chartData.length - 1]?.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Improvement</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{latestScore.score - (chartData[0]?.score || latestScore.score)}
                  </p>
                  <p className="text-xs text-muted-foreground">points gained</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Score Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Payment History</p>
                      <p className="text-sm text-muted-foreground">Excellent - No missed payments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Credit Utilization</p>
                      <p className="text-sm text-muted-foreground">Good - 25% utilization</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Credit Age</p>
                      <p className="text-sm text-muted-foreground">Fair - 3 years average</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Credit Mix</p>
                      <p className="text-sm text-muted-foreground">Good - Multiple account types</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-1">Keep credit utilization below 30%</p>
                    <p className="text-sm text-muted-foreground">
                      Your current utilization is good. Keep it up!
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Make all payments on time</p>
                    <p className="text-sm text-muted-foreground">
                      Payment history is the most important factor
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Avoid opening too many accounts</p>
                    <p className="text-sm text-muted-foreground">
                      Each application can temporarily lower your score
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Keep old accounts open</p>
                    <p className="text-sm text-muted-foreground">
                      Length of credit history matters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Score History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creditScores.map((score, index) => (
                  <div key={score.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">VantageScore</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(score.report_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {index < creditScores.length - 1 && (
                        <span className={`text-sm ${
                          score.score > creditScores[index + 1].score 
                            ? 'text-green-600' 
                            : score.score < creditScores[index + 1].score 
                            ? 'text-red-600' 
                            : 'text-muted-foreground'
                        }`}>
                          {score.score > creditScores[index + 1].score && '+'}
                          {score.score - creditScores[index + 1].score}
                        </span>
                      )}
                      <span className="text-2xl font-bold">{score.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
