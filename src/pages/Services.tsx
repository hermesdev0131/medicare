import Navigation from '@/components/Navigation';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Bot, 
  GraduationCap, 
  Award, 
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  Sparkles,
  Brain,
  Headphones
} from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: BookOpen,
      title: 'Comprehensive Training Content',
      description: 'Access extensive Medicare-related content, carrier information, and sales training materials created by industry experts.',
      features: [
        'Medicare Parts A, B, C, and D training',
        'Carrier-specific product training',
        'Compliance and regulation updates',
        'Sales technique workshops'
      ],
      highlight: 'Most Popular'
    },
    {
      icon: Users,
      title: 'Live Expert Training',
      description: 'Join live instructor-led webinars and interactive learning sessions with industry veterans.',
      features: [
        'Weekly live webinars',
        'Interactive Q&A sessions',
        'Real-time Medicare updates',
        'Expert-led discussions'
      ]
    },
    {
      icon: Bot,
      title: 'AI-Powered Learning Assistant',
      description: 'Get instant answers and personalized guidance with our advanced AI chatbot available 24/7.',
      features: [
        '24/7 instant support',
        'Personalized learning paths',
        'Medicare regulation queries',
        'Study plan recommendations'
      ]
    },
    {
      icon: GraduationCap,
      title: 'Learning Management System',
      description: 'Track your progress, earn certificates, and manage your continuing education requirements.',
      features: [
        'Progress tracking',
        'Digital certificates',
        'CE credit management',
        'Performance analytics'
      ]
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Learn at your own pace with on-demand content and scheduled live sessions.',
      features: [
        'Self-paced learning',
        'Mobile-friendly access',
        'Offline content download',
        'Flexible scheduling options'
      ]
    },
    {
      icon: Award,
      title: 'Certification Programs',
      description: 'Earn industry-recognized certifications to advance your Medicare insurance career.',
      features: [
        'AHIP certification prep',
        'State-specific training',
        'Industry certifications',
        'Professional development'
      ]
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Compliance Guaranteed',
      description: 'Stay compliant with the latest Medicare regulations and CMS requirements.'
    },
    {
      icon: Clock,
      title: 'Time Efficient',
      description: 'Complete training faster with our streamlined, focused content.'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Advance your career with expert knowledge and industry certifications.'
    },
    {
      icon: Headphones,
      title: 'Expert Support',
      description: 'Get help from Medicare experts and experienced professionals.'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Professional Medicare Training Services
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Comprehensive training solutions designed to elevate your Medicare insurance expertise with 8+ years of proven success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Learning for Free
                </Button>
                <Button variant="outline" size="xl" className="border-white/20 text-white hover:bg-white/10">
                  View Training Materials
                </Button>
              </div>
            </div>
            
            <div className="lg:pl-8">
              <NewsletterSignup variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Training Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to succeed in Medicare insurance, from foundational knowledge to advanced sales techniques.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="shadow-card hover:shadow-hover transition-all duration-300 relative">
                  {service.highlight && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full">
                        {service.highlight}
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <IconComponent className="h-10 w-10 text-primary mb-4" />
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {service.description}
                    </p>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-success mr-2 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Our Training Platform?
            </h2>
            <p className="text-xl text-muted-foreground">
              Experience the difference with our proven training methodology and expert support.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={index} className="text-center shadow-card">
                  <CardContent className="p-6">
                    <IconComponent className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Stay Connected with The Training Department
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of Medicare professionals who receive our updates and exclusive content.
            </p>
          </div>
          
          <NewsletterSignup />
        </div>
      </section>

      {/* Free Access Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Brain className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start Your Medicare Training Journey Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Access our comprehensive training platform completely free. No hidden fees, no subscriptions required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90">
              <GraduationCap className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
            <Button variant="outline" size="xl" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Learn More About Our Services
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-white/90">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Expert Support</span>
            </div>
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

export default Services;