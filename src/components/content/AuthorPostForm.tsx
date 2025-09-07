import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Visibility = 'public' | 'subscribers' | 'tiered';
type ContentType = 'blog' | 'newsletter';
type DeliveryMethod = 'email' | 'dashboard' | 'both';

interface AuthorPostFormProps {
  onCreated?: () => void;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const AuthorPostForm: React.FC<AuthorPostFormProps> = ({ onCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featureImageUrl, setFeatureImageUrl] = useState('');
  const [contentType, setContentType] = useState<ContentType>('blog');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [requiredMinTier, setRequiredMinTier] = useState<string | undefined>(undefined);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('dashboard');
  const [allowComments, setAllowComments] = useState(false);
  const [saving, setSaving] = useState(false);

  const autoSlug = useMemo(() => slugify(title), [title]);

  useEffect(() => {
    // If user hasn't manually changed slug, keep it in sync with title
    if (!slug) {
      setSlug(autoSlug);
    }
  }, [autoSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to create content.', variant: 'destructive' });
      return;
    }
    if (!title || !slug || !content) {
      toast({ title: 'Missing fields', description: 'Title, slug, and content are required.', variant: 'destructive' });
      return;
    }
    if (visibility === 'tiered' && !requiredMinTier) {
      toast({ title: 'Tier required', description: 'Please select a required tier for tiered visibility.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      author_id: user.id,
      title,
      slug,
      content,
      excerpt: excerpt || null,
      feature_image_url: featureImageUrl || null,
      content_type: contentType,
      status: 'draft',
      visibility,
      required_min_tier: visibility === 'tiered' ? requiredMinTier : null,
      delivery_method: deliveryMethod,
      tags: [],
      allow_comments: allowComments,
    };

    const { error } = await supabase.from('content_posts' as any).insert(payload);
    setSaving(false);

    if (error) {
      console.error('Error creating post:', error);
      toast({ title: 'Error', description: 'Could not create post. Please check your permissions.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Draft created', description: 'Your post has been saved as a draft.' });
    setTitle('');
    setSlug('');
    setContent('');
    setExcerpt('');
    setFeatureImageUrl('');
    setContentType('blog');
    setVisibility('public');
    setRequiredMinTier(undefined);
    setDeliveryMethod('dashboard');
    setAllowComments(false);

    onCreated?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Amazing newsletter title" />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder={autoSlug || 'auto-generated-from-title'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delivery Method</Label>
              <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)}>
                <SelectTrigger><SelectValue placeholder="Select delivery method" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="dashboard">Dashboard Only</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="both">Both Dashboard & Email</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as Visibility)}>
                <SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="public">Public (free)</SelectItem>
                    <SelectItem value="subscribers">Subscribers (any paid)</SelectItem>
                    <SelectItem value="tiered">Tiered (min tier)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Required Tier (when tiered)</Label>
              <Select
                value={requiredMinTier}
                onValueChange={(v) => setRequiredMinTier(v)}
                disabled={visibility !== 'tiered'}
              >
                <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="enhanced">Enhanced</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt (optional)</Label>
            <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary..." />
          </div>

          <div>
            <Label htmlFor="featureImageUrl">Feature Image URL (optional)</Label>
            <Input id="featureImageUrl" value={featureImageUrl} onChange={(e) => setFeatureImageUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post..."
              className="min-h-[180px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
              />
              Allow comments
            </label>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuthorPostForm;
