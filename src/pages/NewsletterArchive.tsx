import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Mail, Calendar, User } from 'lucide-react';

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

const NewsletterArchive: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'blog' | 'newsletter'>('all');
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadPublishedPosts();
  }, []);

  const loadPublishedPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_posts' as any)
        .select(`
          id, title, slug, content, excerpt, feature_image_url, 
          content_type, visibility, required_min_tier, published_at, author_id
        `)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts((data as unknown as ContentPost[]) || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({ title: 'Error', description: 'Failed to load content.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail) return;

    setSubscribing(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: subscriberEmail, subscription_type: 'newsletter' });

      if (error) throw error;
      
      toast({ title: 'Subscribed!', description: 'Thank you for subscribing to our newsletter.' });
      setSubscriberEmail('');
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ title: 'Already subscribed', description: 'This email is already subscribed.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to subscribe. Please try again.', variant: 'destructive' });
      }
    } finally {
      setSubscribing(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || post.content_type === selectedType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Content Archive</h1>
          <p className="text-xl opacity-90 mb-8">Discover our latest articles and newsletters</p>
          
          {/* Newsletter Subscription */}
          <Card className="max-w-md mx-auto bg-background/10 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary-foreground flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Subscribe to Newsletter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
                  className="bg-background/20 border-white/30 text-primary-foreground placeholder:text-primary-foreground/70"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={subscribing}
                  variant="secondary"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search articles and newsletters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={selectedType === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedType('all')}
            >
              All
            </Button>
            <Button 
              variant={selectedType === 'blog' ? 'default' : 'outline'}
              onClick={() => setSelectedType('blog')}
            >
              Articles
            </Button>
            <Button 
              variant={selectedType === 'newsletter' ? 'default' : 'outline'}
              onClick={() => setSelectedType('newsletter')}
            >
              Newsletters
            </Button>
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No content found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                {post.feature_image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.feature_image_url} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={post.content_type === 'newsletter' ? 'default' : 'secondary'}>
                      {post.content_type}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.published_at)}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`/content/${post.slug}`, '_blank')}
                  >
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterArchive;