import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, User, Lock, Mail } from 'lucide-react';

type ContentPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  feature_image_url: string | null;
  content_type: 'blog' | 'newsletter';
  visibility: 'public' | 'subscribers' | 'tiered';
  required_min_tier: string | null;
  published_at: string;
  author_id: string;
};

type Profile = {
  first_name: string | null;
  last_name: string | null;
};

const ContentReader: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<ContentPost | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscriberData, setSubscriberData] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug, user]);

  const loadPost = async () => {
    try {
      setLoading(true);
      
      // Load the post
      const { data: postData, error: postError } = await supabase
        .from('content_posts' as any)
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (postError) throw postError;
      setPost(postData as unknown as ContentPost);

      // Load author information
      const { data: authorData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', (postData as unknown as ContentPost).author_id)
        .single();
      
      setAuthor(authorData);

      // Check access permissions
      await checkAccess(postData as unknown as ContentPost);
    } catch (error: any) {
      console.error('Error loading post:', error);
      if (error.code === 'PGRST116') {
        toast({ title: 'Content not found', description: 'The requested content does not exist.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to load content.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async (postData: ContentPost) => {
    // Public content is always accessible
    if (postData.visibility === 'public') {
      setHasAccess(true);
      return;
    }

    // Check if user is authenticated for subscriber/tiered content
    if (!user) {
      setHasAccess(false);
      return;
    }

    // Check subscription status for subscriber/tiered content
    if (postData.visibility === 'subscribers' || postData.visibility === 'tiered') {
      const { data: subscription } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .eq('subscribed', true)
        .single();

      setSubscriberData(subscription);

      if (!subscription) {
        setHasAccess(false);
        return;
      }

      // For tiered content, check if user has required tier
      if (postData.visibility === 'tiered' && postData.required_min_tier) {
        const tierHierarchy = ['basic', 'premium', 'enterprise'];
        const userTierIndex = subscription.subscription_tier ? tierHierarchy.indexOf(subscription.subscription_tier) : -1;
        const requiredTierIndex = tierHierarchy.indexOf(postData.required_min_tier);
        
        setHasAccess(userTierIndex >= requiredTierIndex);
      } else {
        setHasAccess(true);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAuthorName = () => {
    if (!author) return 'Unknown Author';
    return `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Unknown Author';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/newsletter-archive" replace />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardHeader>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <CardTitle>Premium Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This {post.content_type} is available to {post.visibility === 'subscribers' ? 'subscribers' : `${post.required_min_tier}+ subscribers`} only.
                </p>
                {!user ? (
                  <div className="space-y-2">
                    <p>Please sign in to access subscriber content.</p>
                    <Button onClick={() => window.location.href = '/auth'}>
                      Sign In
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>Subscribe to access this content and more.</p>
                    <Button onClick={() => window.location.href = '/pricing'}>
                      View Subscription Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={post.content_type === 'newsletter' ? 'default' : 'secondary'}>
                {post.content_type}
              </Badge>
              {post.visibility !== 'public' && (
                <Badge variant="outline">
                  {post.visibility === 'tiered' ? `${post.required_min_tier}+ only` : 'Subscribers only'}
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            
            <div className="flex items-center gap-4 text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{getAuthorName()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.published_at)}</span>
              </div>
            </div>

            {post.excerpt && (
              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                {post.excerpt}
              </p>
            )}

            {post.feature_image_url && (
              <div className="aspect-video overflow-hidden rounded-lg mb-8">
                <img 
                  src={post.feature_image_url} 
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Content */}
          <Card>
            <CardContent className="prose prose-lg max-w-none p-8">
              <div 
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
                className="whitespace-pre-wrap"
              />
            </CardContent>
          </Card>

          {/* Newsletter CTA */}
          {post.content_type === 'newsletter' && (
            <Card className="mt-8 bg-primary/5 border-primary/20">
              <CardContent className="text-center p-8">
                <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Enjoyed this newsletter?</h3>
                <p className="text-muted-foreground mb-4">
                  Subscribe to receive more content like this directly in your inbox.
                </p>
                <Button onClick={() => window.location.href = '/newsletter-archive'}>
                  Subscribe Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentReader;