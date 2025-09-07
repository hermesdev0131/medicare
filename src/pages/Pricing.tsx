import Navigation from '@/components/Navigation';
import PricingCards from '@/components/PricingCards';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Shield, CreditCard, Users, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Payment Successful!",
        description: "Welcome to your new plan! Your subscription is now active.",
        variant: "default"
      });
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Payment Canceled",
        description: "You can try subscribing again when you're ready.",
        variant: "destructive"
      });
    }
  }, [searchParams, toast]);

  const faqs = [
    {
      question: "Can I switch between plans?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
    },
    {
      question: "Is there a free trial available?",
      answer: "We offer a 7-day free trial for all Agent Resource Center plans to help you find the perfect fit."
    },
    {
      question: "What happens if I cancel my subscription?",
      answer: "You can cancel anytime. You'll retain access to your plan features until the end of your current billing period."
    },
    {
      question: "Do you offer volume discounts for agencies?",
      answer: "Yes! Agency Leader HQ includes tools to manage multiple agent subscriptions with volume-based discounts."
    },
    {
      question: "How does the AI Chatbot work?",
      answer: "Our AI Chatbot provides instant access to Medicare information, training materials, and answers to common questions 24/7."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards and ACH bank transfers. All payments are processed securely through Stripe."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-hero">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Transparent Pricing for Every Professional
          </h1>
          <p className="text-xl text-white/90">
            Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <PricingCards />

      {/* Trust Indicators */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center shadow-card">
              <CardContent className="p-6">
                <Shield className="h-10 w-10 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Secure & Compliant</h3>
                <p className="text-muted-foreground">
                  Bank-level security with full Medicare compliance training standards.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-card">
              <CardContent className="p-6">
                <CreditCard className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Flexible Billing</h3>
                <p className="text-muted-foreground">
                  Monthly subscriptions with no long-term contracts or hidden fees.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-card">
              <CardContent className="p-6">
                <Users className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">24/7 Support</h3>
                <p className="text-muted-foreground">
                  Access to our AI chatbot and expert support whenever you need help.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our pricing and plans.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Still Have Questions?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Our team is here to help you find the perfect training solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90">
              Contact Our Team
            </Button>
            <Button variant="outline" size="xl" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="w-full bg-slate-900 py-6 shadow-xl border-t border-slate-800 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-slate-300 font-medium">
              Trusted by thousands of insurance professionals nationwide
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-slate-400">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">Secure & Encrypted</span>
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">NIPR Verified</span>
              </span>
            </div>
            <div className="flex items-center justify-center space-x-6 text-xs">
              <a href="/privacy-policy" className="text-slate-400 hover:text-white transition-colors duration-200 font-medium">
                Privacy Policy
              </a>
              <span className="text-slate-600">|</span>
              <a href="/terms-of-service" className="text-slate-400 hover:text-white transition-colors duration-200 font-medium">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;