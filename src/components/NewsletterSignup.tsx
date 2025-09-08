import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NewsletterSignupProps {
  variant?: 'default' | 'hero' | 'sidebar';
  className?: string;
}

const NewsletterSignup = ({ variant = 'default', className = '' }: NewsletterSignupProps) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
        className: "bg-red-50 border-red-200 text-red-800",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          subscription_type: 'newsletter',
          subscribed: true
        });

      if (error) {
        // Check if email already exists
        if (error.code === '23505') {
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter",
            variant: "default",
            className: "bg-blue-50 border-blue-200 text-blue-800",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({
          title: "Success!",
          description: "You've been subscribed to our newsletter",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
      
      setEmail('');
      setFirstName('');
      setLastName('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
        className: "bg-red-50 border-red-200 text-red-800",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // if (isSubscribed) {
  //   return (
  //     <Card className={`${className} bg-gradient-to-r from-success/10 to-success/5 border-success/20`}>
  //       <CardContent className="p-6 text-center">
  //         <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
  //         <h3 className="text-lg font-semibold text-success mb-2">
  //           Thank You for Subscribing!
  //         </h3>
  //         <p className="text-muted-foreground">
  //           You'll receive updates about new training materials, Medicare changes, and exclusive content.
  //         </p>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  if (variant === 'hero') {
    return (
      <div className={`${className} bg-white border border-gray-200 rounded-lg shadow-lg p-8`}>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Try out our free AI Training Tool
          </h3>
          <p className="text-gray-600">
            Get started with professional Medicare training in minutes
          </p>
        </div>
        
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
            <Input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-gray-300 text-gray-900 placeholder:text-gray-500 flex-1"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gray-900 hover:bg-black text-white shrink-0"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  Create free AI training <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Political, inappropriate and discriminatory content will not be approved.
          </p>
        </form>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get updates on Medicare changes and new training content.
          </p>
          
          <form onSubmit={handleSubscribe} className="space-y-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-sm"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              size="sm"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                'Subscribe'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${className} text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg`}>
      <div className="flex justify-center mb-3">
        <Mail className="h-8 w-8 text-primary-glow" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        Stay Informed with Our Newsletter
      </h3>
      <p className="text-white/80 font-medium mb-6">
        Get the latest Medicare updates, training materials, and exclusive content delivered directly to your inbox.
      </p>
      
      <form onSubmit={handleSubscribe} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="text"
            placeholder="First Name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:border-primary-glow focus:ring-primary-glow rounded-xl"
          />
          <Input
            type="text"
            placeholder="Last Name (optional)"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:border-primary-glow focus:ring-primary-glow rounded-xl"
          />
        </div>
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:border-primary-glow focus:ring-primary-glow rounded-xl"
          />
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 shrink-0"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                Subscribe <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
      
      <p className="text-xs text-white/60 text-center mt-4">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
};

export default NewsletterSignup;