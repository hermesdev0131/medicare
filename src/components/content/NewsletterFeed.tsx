import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Mail, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NewsletterFeedProps {
  userType: 'free' | 'paid';
  maxItems?: number;
}

export const NewsletterFeed = ({ userType, maxItems = 10 }: NewsletterFeedProps) => {
  const { user, isSubscribed, subscriptionTier } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, isSubscribed, subscriptionTier]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('content_posts')
        .select('*')
        .eq('status', 'published')
        .in('delivery_method', ['dashboard', 'both'])
        .order('published_at', { ascending: false });

      // Filter based on user type and subscription
      if (userType === 'free') {
        query = query.eq('visibility', 'public');
      } else {
        // For paid users, show public content and content they have access to
        if (isSubscribed && subscriptionTier) {
          query = query.or(`visibility.eq.public,visibility.eq.subscribers,and(visibility.eq.tiered,required_min_tier.eq.${subscriptionTier})`);
        } else {
          query = query.eq('visibility', 'public');
        }
      }

      if (maxItems) {
        query = query.limit(maxItems);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching newsletter posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'newsletter':
        return <Mail className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getVisibilityBadge = (visibility: string, tier?: string) => {
    switch (visibility) {
      case 'public':
        return <Badge variant="secondary">Free</Badge>;
      case 'subscribers':
        return <Badge variant="outline">Subscribers</Badge>;
      case 'tiered':
        return <Badge className="bg-primary text-primary-foreground">{tier?.toUpperCase()}</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Content Available</h3>
          <p className="text-muted-foreground">
            {userType === 'free' 
              ? 'Check back soon for new newsletters and updates.' 
              : 'No newsletters available for your subscription level.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (selectedPost) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedPost(null)}>
              ← Back to Newsletter Feed
            </Button>
            {getVisibilityBadge(selectedPost.visibility, selectedPost.required_min_tier)}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{selectedPost.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(selectedPost.published_at || selectedPost.created_at)}
              </div>
              <div className="flex items-center gap-1">
                {getContentTypeIcon(selectedPost.content_type)}
                {selectedPost.content_type.charAt(0).toUpperCase() + selectedPost.content_type.slice(1)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedPost.feature_image_url && (
            <img 
              src={selectedPost.feature_image_url} 
              alt={selectedPost.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedPost.content.replace(/\n/g, '<br>') }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Latest Updates</h3>
        <Badge variant="outline">{posts.length} articles</Badge>
      </div>
      
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getContentTypeIcon(post.content_type)}
                <span className="text-sm font-medium capitalize">{post.content_type}</span>
              </div>
              {getVisibilityBadge(post.visibility, post.required_min_tier)}
            </div>
            
            <h4 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h4>
            
            {post.excerpt && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{post.excerpt}</p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.published_at || post.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.ceil(post.content.length / 1000)} min read
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedPost(post)}
                className="text-primary hover:text-primary-foreground hover:bg-primary"
              >
                Read More <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};