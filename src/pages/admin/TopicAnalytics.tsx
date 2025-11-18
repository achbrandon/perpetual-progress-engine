import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, TrendingUp, MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";

interface TopicStat {
  topic: string;
  count: number;
  percentage: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const TopicAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
  const [totalQueries, setTotalQueries] = useState(0);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchAnalytics();
    }
  }, [timeRange]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      toast.error('Access denied');
      navigate('/dashboard');
      return;
    }

    setLoading(false);
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date(0);
      
      switch (timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data, error } = await supabase
        .from('support_topic_analytics')
        .select('detected_topic')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Count topics
      const topicCounts = data.reduce((acc: Record<string, number>, item) => {
        acc[item.detected_topic] = (acc[item.detected_topic] || 0) + 1;
        return acc;
      }, {});

      const total = data.length;
      setTotalQueries(total);

      const stats: TopicStat[] = Object.entries(topicCounts)
        .map(([topic, count]) => ({
          topic: topic.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count: count as number,
          percentage: Math.round(((count as number) / total) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      setTopicStats(stats);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Support Topic Analytics</h1>
            <p className="text-muted-foreground">
              Track which topics users ask about most frequently
            </p>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        <Button
          variant={timeRange === 'day' ? 'default' : 'outline'}
          onClick={() => setTimeRange('day')}
        >
          Last 24 Hours
        </Button>
        <Button
          variant={timeRange === 'week' ? 'default' : 'outline'}
          onClick={() => setTimeRange('week')}
        >
          Last 7 Days
        </Button>
        <Button
          variant={timeRange === 'month' ? 'default' : 'outline'}
          onClick={() => setTimeRange('month')}
        >
          Last 30 Days
        </Button>
        <Button
          variant={timeRange === 'all' ? 'default' : 'outline'}
          onClick={() => setTimeRange('all')}
        >
          All Time
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              Support queries analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Topic</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topicStats[0]?.topic || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {topicStats[0]?.percentage || 0}% of all queries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Topic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {topicStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topicStats}
                    dataKey="count"
                    nameKey="topic"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.topic}: ${entry.percentage}%`}
                  >
                    {topicStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No data available for selected time range
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Query Counts by Topic</CardTitle>
          </CardHeader>
          <CardContent>
            {topicStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topicStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No data available for selected time range
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Topic Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {topicStats.length > 0 ? (
            <div className="space-y-4">
              {topicStats.map((stat, index) => (
                <div key={stat.topic} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium">{stat.topic}</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.count} {stat.count === 1 ? 'query' : 'queries'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{stat.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No queries recorded yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicAnalytics;
