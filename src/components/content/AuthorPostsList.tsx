
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, ExternalLink } from 'lucide-react';

type Post = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled';
  content_type: 'blog' | 'newsletter';
  visibility: 'public' | 'subscribers' | 'tiered';
  required_min_tier: string | null;
  published_at: string | null;
  updated_at: string;
};

interface AuthorPostsListProps {
  refreshKey?: number;
}

const AuthorPostsList: React.FC<AuthorPostsListProps> = ({ refreshKey }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const loadPosts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('content_posts' as any)
      .select('id, title, slug, status, content_type, visibility, required_min_tier, published_at, updated_at')
      .eq('author_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading posts:', error);
      toast({ title: 'Error', description: 'Could not load your posts.', variant: 'destructive' });
      return;
    }
    setPosts((data as unknown as Post[]) || []);
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshKey]);

  const setLoading = (id: string, isLoading: boolean) => {
    setLoadingIds((prev) => (isLoading ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const handlePublish = async (id: string) => {
    setLoading(id, true);
    const { error } = await supabase
      .from('content_posts' as any)
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id);
    setLoading(id, false);
    if (error) {
      console.error('Publish error:', error);
      toast({ title: 'Error', description: 'Could not publish post.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Published', description: 'Your post is now live.' });
    loadPosts();
  };

  const handleUnpublish = async (id: string) => {
    setLoading(id, true);
    const { error } = await supabase
      .from('content_posts' as any)
      .update({ status: 'draft', published_at: null })
      .eq('id', id);
    setLoading(id, false);
    if (error) {
      console.error('Unpublish error:', error);
      toast({ title: 'Error', description: 'Could not unpublish post.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Unpublished', description: 'Your post has been moved to drafts.' });
    loadPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setLoading(id, true);
    const { error } = await supabase.from('content_posts' as any).delete().eq('id', id);
    setLoading(id, false);
    if (error) {
      console.error('Delete error:', error);
      toast({ title: 'Error', description: 'Could not delete post.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'Post removed.' });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSendNewsletter = async (post: Post) => {
    if (post.content_type !== 'newsletter' || post.status !== 'published') return;
    
    setLoading(post.id, true);
    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: {
          postId: post.id,
          title: post.title,
          content: 'Loading content...', // We'll need to fetch full content
          slug: post.slug,
          contentType: post.content_type,
          visibility: post.visibility,
          requiredMinTier: post.required_min_tier
        }
      });

      if (error) throw error;
      
      toast({ 
        title: 'Newsletter Sent!', 
        description: `Sent to ${data.sent} subscribers.` 
      });
    } catch (error: any) {
      console.error('Send newsletter error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to send newsletter. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(post.id, false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {posts.length === 0 && <p className="text-sm text-muted-foreground">No posts yet. Create your first draft above.</p>}
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border rounded-md p-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{post.title}</span>
                  <Badge variant="secondary" className="capitalize">{post.content_type}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {post.visibility}
                    {post.visibility === 'tiered' && post.required_min_tier ? ` · ${post.required_min_tier}` : ''}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  /content/{post.slug} · {post.status === 'published' ? `Published` : 'Draft'} · Updated {new Date(post.updated_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/content/${post.slug}`, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
                {post.status === 'draft' ? (
                  <Button size="sm" onClick={() => handlePublish(post.id)} disabled={loadingIds.includes(post.id)}>
                    {loadingIds.includes(post.id) ? '...' : 'Publish'}
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleUnpublish(post.id)} disabled={loadingIds.includes(post.id)}>
                      {loadingIds.includes(post.id) ? '...' : 'Unpublish'}
                    </Button>
                    {post.content_type === 'newsletter' && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleSendNewsletter(post)} 
                        disabled={loadingIds.includes(post.id)}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        {loadingIds.includes(post.id) ? 'Sending...' : 'Send'}
                      </Button>
                    )}
                  </>
                )}
                <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)} disabled={loadingIds.includes(post.id)}>
                  {loadingIds.includes(post.id) ? '...' : 'Delete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthorPostsList;
