import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Users, Mail, TrendingUp, Eye, MousePointer } from "lucide-react";

interface PostAnalytics {
  id: string;
  title: string;
  status: string;
  published_at: string;
  visibility: string;
  views: number;
  clicks: number;
}

export function NewsletterAnalytics() {
  const [posts, setPosts] = useState<PostAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalViews: 0,
    totalClicks: 0,
    avgOpenRate: 0,
    avgClickRate: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // For now, we'll simulate analytics data since we haven't implemented tracking yet
      const { data, error } = await supabase
        .from('content_posts' as any)
        .select('id, title, status, published_at, visibility')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      // Simulate analytics data
      const postsWithAnalytics = (data || []).map((post: any) => ({
        ...post,
        views: Math.floor(Math.random() * 1000) + 100,
        clicks: Math.floor(Math.random() * 100) + 10
      }));

      setPosts(postsWithAnalytics);

      // Calculate total stats
      const totalViews = postsWithAnalytics.reduce((sum, post) => sum + post.views, 0);
      const totalClicks = postsWithAnalytics.reduce((sum, post) => sum + post.clicks, 0);
      const avgOpenRate = postsWithAnalytics.length > 0 ? (totalViews / postsWithAnalytics.length / 10) : 0;
      const avgClickRate = totalViews > 0 ? (totalClicks / totalViews * 100) : 0;

      setTotalStats({
        totalViews,
        totalClicks,
        avgOpenRate: Math.round(avgOpenRate * 100) / 100,
        avgClickRate: Math.round(avgClickRate * 100) / 100
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all newsletters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Link clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgOpenRate}%</div>
            <p className="text-xs text-muted-foreground">
              Email opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgClickRate}%</div>
            <p className="text-xs text-muted-foreground">
              Click-through rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Performance</CardTitle>
          <CardDescription>
            Detailed analytics for your published newsletters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Newsletter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Click Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No published newsletters found.
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => {
                    const clickRate = post.views > 0 ? ((post.clicks / post.views) * 100).toFixed(2) : '0.00';
                    
                    return (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.published_at 
                            ? new Date(post.published_at).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{post.views.toLocaleString()}</TableCell>
                        <TableCell>{post.clicks.toLocaleString()}</TableCell>
                        <TableCell>{clickRate}%</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Note about analytics */}
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">
            <strong>Note:</strong> Analytics data shown above is simulated for demonstration purposes. 
            In a production environment, you would integrate with email service providers (like Resend) 
            to track actual open rates, click rates, and other engagement metrics.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}