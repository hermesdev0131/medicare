import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import PricingCards from '@/components/PricingCards';
import Footer from '@/components/Footer';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, BookOpen, Users, TrendingUp, CheckCircle, Star } from 'lucide-react';
const Index = () => {
  const features = [{
    icon: Bot,
    title: 'AI-Powered Learning',
    description: 'Get instant answers and personalized guidance with our advanced AI chatbot available 24/7.'
  }, {
    icon: BookOpen,
    title: 'Comprehensive Content',
    description: 'Access extensive Medicare-related content, carrier information, and sales training materials.'
  }, {
    icon: Users,
    title: 'Live Expert Training',
    description: 'Join live instructor-led webinars and interactive learning sessions with industry experts.'
  }, {
    icon: TrendingUp,
    title: 'Track Your Progress',
    description: 'Monitor your learning journey with our advanced LMS tracking participation and scores.'
  }];
  const testimonials = [{
    name: 'Agent Testimonial',
    role: '3+ Years Experience',
    content: 'This is so good that it will blow their minds, compared to other companies trainings. You filled in the gaps!',
    rating: 5
  }, {
    name: 'Agent Testimonial',
    role: '1-3 Years Experience',
    content: 'Jay is the best for onboarding. He is engaging, thorough, and always making sure everyone has a good understanding of his training. No question goes unanswered.',
    rating: 5
  }, {
    name: 'Agent Testimonial',
    role: '1-3 Years Experience',
    content: 'Having a trainer, like Jay, who is knowledgeable, patient, professional, yet friendly is rare. The more trainers you can shape to have these qualities, the more successful agents you will have.',
    rating: 5
  }];
  return <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <Hero />
      
      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose The Training Department?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              With 8+ years of Medicare expertise and 4,000+ agents trained, we provide proven training solutions that deliver measurable results with a 4.9/5 satisfaction rating.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return <Card key={index} className="shadow-card hover:shadow-hover transition-all duration-300 text-center">
                  <CardContent className="p-6">
                    <IconComponent className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterSignup />
        </div>
      </section>

      {/* Pricing Section */}
      <PricingCards />

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Members Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Real feedback from Medicare agents who have experienced our training programs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => <Card key={index} className="shadow-card">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <p className="text-sm text-primary">{testimonial.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start Your Medicare Training Journey Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join The Training Department and elevate your Medicare insurance expertise with our comprehensive training solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
            <Button variant="outline" size="xl" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              View All Plans
            </Button>
          </div>
        </div>
      </section>

      <Footer currentPage="Home" />
    </div>;
};
export default Index;