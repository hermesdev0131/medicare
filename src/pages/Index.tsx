import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import PricingCards from '@/components/PricingCards';
import Footer from '@/components/Footer';
import TestimonialSlider from '@/components/TestimonialSlider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, BookOpen, Users, TrendingUp, CheckCircle, Star, Play, ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const Index = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const videoTestimonials = [
    {
      id: 1,
      company: "Medicare Solutions Inc.",
      logo: "https://via.placeholder.com/120x40/1e40af/ffffff?text=MSI",
      backgroundImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "It's easy to use and grows across teams fast.",
      speaker: "Sarah Johnson",
      jobTitle: "Solution Manager IT",
      category: "IT"
    },
    {
      id: 2,
      company: "Premier Medicare",
      logo: "https://via.placeholder.com/120x40/059669/ffffff?text=PM",
      backgroundImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "What used to take 4 hours now takes 30 minutes.",
      speaker: "Michael Chen",
      jobTitle: "Global Sales Enablement Lead",
      category: "SALES ENABLEMENT"
    },
    {
      id: 3,
      company: "Medicare Excellence",
      logo: "https://via.placeholder.com/120x40/dc2626/ffffff?text=ME",
      backgroundImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "The platform makes change management use and implementation seamless.",
      speaker: "Jennifer Martinez",
      jobTitle: "Change Management Director",
      category: "CHANGE MANAGEMENT"
    },
    {
      id: 4,
      company: "Medicare Partners",
      logo: "https://via.placeholder.com/120x40/7c3aed/ffffff?text=MP",
      backgroundImage: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "We make training fast and use them every day. The ROI has been incredible.",
      speaker: "David Thompson",
      jobTitle: "Head of Learning & Development",
      category: "OPERATIONS TEAM"
    },
    {
      id: 5,
      company: "Medicare Advantage Corp",
      logo: "https://via.placeholder.com/120x40/ea580c/ffffff?text=MAC",
      backgroundImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "Updating 10,000 courses? Totally doable now. The scalability is unmatched.",
      speaker: "Lisa Rodriguez",
      jobTitle: "Senior Training Manager",
      category: "TRAINING"
    },
    {
      id: 6,
      company: "Medicare Solutions Group",
      logo: "https://via.placeholder.com/120x40/0891b2/ffffff?text=MSG",
      backgroundImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "100 hours of compliance training done in 10 minutes! Efficiency gains are remarkable.",
      speaker: "Robert Kim",
      jobTitle: "Compliance Director",
      category: "COMPLIANCE"
    },
    {
      id: 7,
      company: "Medicare Innovations",
      logo: "https://via.placeholder.com/120x40/7c2d12/ffffff?text=MI",
      backgroundImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "The AI-powered features have transformed our training delivery. Our agents are more engaged and retention rates have soared.",
      speaker: "Amanda Foster",
      jobTitle: "Training Innovation Lead",
      category: "AI TRAINING"
    },
    {
      id: 8,
      company: "Medicare Central",
      logo: "https://via.placeholder.com/120x40/be123c/ffffff?text=MC",
      backgroundImage: "https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "Implementation was seamless and our team was up and running in days, not weeks. The support is outstanding.",
      speaker: "James Wilson",
      jobTitle: "Chief Technology Officer",
      category: "IMPLEMENTATION"
    },
    {
      id: 9,
      company: "Medicare Pro",
      logo: "https://via.placeholder.com/120x40/0d9488/ffffff?text=MP",
      backgroundImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "The analytics dashboard gives us insights we never had before. Data-driven training decisions have improved our outcomes by 60%.",
      speaker: "Rachel Green",
      jobTitle: "Analytics Director",
      category: "ANALYTICS"
    },
    {
      id: 10,
      company: "Medicare Elite",
      logo: "https://via.placeholder.com/120x40/9333ea/ffffff?text=ME",
      backgroundImage: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "Customer satisfaction scores have never been higher. The training platform has elevated our entire organization.",
      speaker: "Mark Stevens",
      jobTitle: "Customer Success Manager",
      category: "CUSTOMER SUCCESS"
    },
    {
      id: 11,
      company: "Medicare Dynamics",
      logo: "https://via.placeholder.com/120x40/c2410c/ffffff?text=MD",
      backgroundImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "The mobile-first approach means our field agents can access training anywhere. Game-changing for our business model.",
      speaker: "Patricia Lee",
      jobTitle: "Field Operations Director",
      category: "MOBILE TRAINING"
    },
    {
      id: 12,
      company: "Medicare Vision",
      logo: "https://via.placeholder.com/120x40/0f766e/ffffff?text=MV",
      backgroundImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      quote: "Integration with our existing systems was flawless. The platform works seamlessly with our CRM and sales tools.",
      speaker: "Kevin Park",
      jobTitle: "Integration Specialist",
      category: "SYSTEM INTEGRATION"
    }
  ];

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Learning',
      description: 'Get instant answers and personalized guidance with our advanced AI chatbot available 24/7.'
    },
    {
      icon: BookOpen,
      title: 'Comprehensive Content',
      description: 'Access extensive Medicare-related content, carrier information, and sales training materials.'
    },
    {
      icon: Users,
      title: 'Live Expert Training',
      description: 'Join live instructor-led webinars and interactive learning sessions with industry experts.'
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      description: 'Monitor your learning journey with our advanced LMS tracking participation and scores.'
    }
  ];

  const testimonials = [
    {
      name: 'Agent Testimonial',
      role: '3+ Years Experience',
      content: 'This is so good that it will blow their minds, compared to other companies trainings. You filled in the gaps!',
      rating: 5
    },
    {
      name: 'Agent Testimonial',
      role: '1-3 Years Experience',
      content: 'Jay is the best for onboarding. He is engaging, thorough, and always making sure everyone has a good understanding of his training. No question goes unanswered.',
      rating: 5
    },
    {
      name: 'Agent Testimonial',
      role: '1-3 Years Experience',
      content: 'Having a trainer, like Jay, who is knowledgeable, patient, professional, yet friendly is rare. The more trainers you can shape to have these qualities, the more successful agents you will have.',
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "What makes The Training Department different from other Medicare training programs?",
      answer: "We combine 8+ years of Medicare expertise with cutting-edge AI technology to deliver personalized, engaging training experiences. Our platform offers live expert sessions, comprehensive content libraries, and advanced progress tracking that adapts to your learning style."
    },
    {
      question: "How does the AI-powered learning system work?",
      answer: "Our AI chatbot provides instant answers to Medicare-related questions 24/7, offers personalized learning paths based on your progress, and adapts content difficulty to match your expertise level. It's like having a personal Medicare expert available whenever you need help."
    },
    {
      question: "What types of training content do you offer?",
      answer: "We provide comprehensive Medicare training including carrier information, sales techniques, compliance requirements, product knowledge, and regulatory updates. Our content is regularly updated to reflect the latest Medicare changes and industry best practices."
    },
    {
      question: "Can I track my progress and get certifications?",
      answer: "Yes! Our advanced LMS tracks your participation, scores, and completion rates. You can earn certifications for completed modules and track your overall progress through detailed analytics and performance reports."
    },
    {
      question: "Do you offer live training sessions?",
      answer: "Absolutely! We host regular live instructor-led webinars and interactive learning sessions with industry experts. These sessions provide real-time Q&A opportunities and hands-on training experiences you can't get from self-paced content alone."
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <Hero />
      
      {/* Features Section - Modern Style */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Why Choose The Training Department?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              With 8+ years of Medicare expertise and 4,000+ agents trained, we provide proven training solutions that deliver measurable results with a 4.9/5 satisfaction rating.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="group border-0 shadow-card hover:shadow-hover transition-all duration-500 text-center bg-card hover:-translate-y-2">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Testimonials Slider Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Empower your Medicare business with proven strategies.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our training platform helps agents stay ahead of industry changes, connect with clients more effectively, and grow their book of business with confidence.
            </p>
          </div>
          
          <TestimonialSlider 
            testimonials={videoTestimonials}
            autoPlay={true}
            autoPlayInterval={6000}
          />
        </div>
      </section>

      {/* Newsletter CTA Section */}
      <section className="py-16 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Button
            onClick={() => {
              const newsletterSection = document.getElementById('newsletter-section');
              if (newsletterSection) {
                newsletterSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Stay Informed with Our Newsletter
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Top Tutors Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Meet Our Top Tutors
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn from industry experts with years of Medicare experience and proven track records in training successful agents.
            </p>
          </div>

          <div className="space-y-20">
            {/* Tutor 1 - Image Left, Description Right */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                    alt="Jay Martinez - Senior Medicare Training Specialist"
                    className="w-full h-96 object-cover rounded-2xl shadow-lg"
                    style={{ objectPosition: "50% 20%" }} 
                  />
                  <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg">
                    8+ Years Experience
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-foreground mb-2">Jay Martinez</h3>
                  <p className="text-xl text-primary font-semibold">Senior Medicare Training Specialist</p>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Jay brings over 8 years of Medicare expertise to our training programs. Known for his engaging, thorough approach, 
                  he ensures every agent has a solid understanding of Medicare fundamentals. His patient and professional demeanor 
                  makes complex topics accessible to agents at all experience levels.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">Medicare Advantage</span>
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">Supplement Plans</span>
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">Compliance Training</span>
                </div>
              </div>
            </div>

            {/* Tutor 2 - Description Left, Image Right */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                    alt="Sarah Johnson - Medicare Sales Expert"
                    className="w-full h-96 object-cover rounded-2xl shadow-lg"
                    style={{ objectPosition: "70% 10%" }} 
                  />
                  <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg">
                    Top Rated Trainer
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-foreground mb-2">Sarah Johnson</h3>
                  <p className="text-xl text-primary font-semibold">Medicare Sales Expert & Trainer</p>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Sarah specializes in sales techniques and customer relationship management for Medicare agents. With a proven 
                  track record of training top-performing agents, she focuses on practical strategies that drive results. Her 
                  interactive training style helps agents build confidence and close more sales effectively.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">Sales Techniques</span>
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">Customer Relations</span>
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">Lead Generation</span>
                </div>
              </div>
            </div>

            {/* Tutor 3 - Image Left, Description Right */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                    alt="Michael Chen - Technology Integration Specialist"
                    className="w-full h-96 object-cover object-center rounded-2xl shadow-lg"
                    style={{ objectPosition: "50% 10%" }} 
                  />
                  <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg">
                    AI Training Pioneer
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-foreground mb-2">Michael Chen</h3>
                  <p className="text-xl text-primary font-semibold">Technology Integration Specialist</p>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Michael leads our AI-powered training initiatives and helps agents leverage technology for better outcomes. 
                  He combines deep Medicare knowledge with cutting-edge training methodologies to create engaging, effective 
                  learning experiences. His expertise in digital tools helps agents stay ahead in the evolving Medicare landscape.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">AI Training Tools</span>
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">Digital Marketing</span>
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">CRM Systems</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingCards />

      {/* Testimonials Section - Modern Style */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              What Our Members Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Real feedback from Medicare agents who have experienced our training programs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group border-0 shadow-card hover:shadow-hover transition-all duration-500 bg-card hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary-glow text-primary-glow" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground text-lg leading-relaxed mb-6 italic">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="border-t pt-4">
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-primary font-medium">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Modern Style */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our Medicare training platform.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="group border-0 shadow-card hover:shadow-hover transition-all duration-300 bg-card">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                      {faq.question}
                    </CardTitle>
                    <ChevronDown 
                      className={`h-5 w-5 text-muted-foreground transition-all duration-300 ${
                        openFaq === index ? 'rotate-180 text-primary' : 'group-hover:text-primary'
                      }`} 
                    />
                  </div>
                </CardHeader>
                {openFaq === index && (
                  <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Modern Style */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Your Medicare Training Journey Today
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Join The Training Department and elevate your Medicare insurance expertise with our comprehensive training solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="xl" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-5 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Start Free Training
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white hover:bg-white/20 px-10 py-5 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              View All Plans
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      <Footer currentPage="Home" />
    </div>
  );
};
export default Index;