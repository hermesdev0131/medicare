import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Target, Users, TrendingUp } from 'lucide-react';
const About = () => {
  return <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About Jay Sweat & The Training Department
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Transforming Medicare insurance training through innovation, expertise, and dedication to professional excellence.
          </p>
        </div>
      </section>

      {/* Jay Sweat Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Meet Jay Sweat
              </h2>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Jay Sweat founded The Training Department with a clear mission: to revolutionize how Medicare insurance professionals learn, grow, and succeed in an ever-evolving industry. As an active Medicare agent since 2017, Jay has trained over 4,000 agents throughout his career.
                </p>
                <p>
                  With 8+ years of Medicare industry experience, Jay has served as Lead Medicare Sales Trainer at Assurance IQ and Director of Training at Exact Medicare, where he built the Medicare Training Department from the ground up. His systematic approach combines operational precision with educational innovation, achieving a 4.9/5 training satisfaction rating.
                </p>
                <p>
                  Jay's expertise extends beyond training - he maintains 92%+ personal compliance scores with zero CTMs or allegations, demonstrating the practical application of his educational methodologies. His proven track record includes improving compliance scores across organizations and developing comprehensive onboarding, upskilling, and sales coaching programs.
                </p>
              </div>
            </div>
            
            <div className="lg:order-first">
              <Card className="shadow-card bg-gradient-card">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-6 overflow-hidden rounded-full">
                      <img 
                        src="/lovable-uploads/d1960e3b-e8e3-40fc-8127-a6f1bf2380d8.png" 
                        alt="Jay Sweat, Founder & CEO" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">Jay Sweat</h3>
                    <p className="text-primary font-semibold mb-4">Founder & CEO</p>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-primary">4,000+</span>
                        <span>Agents Trained</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-primary">4.9/5</span>
                        <span>Training Satisfaction</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-primary">8+</span>
                        <span>Years Experience</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground italic mt-4">
                      "Every Medicare professional deserves access to world-class training that empowers them to serve their clients with confidence and expertise."
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Statement */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Our Vision
          </h2>
          <Card className="shadow-professional border-primary/20">
            <CardContent className="p-8 md:p-12">
              <blockquote className="text-xl md:text-2xl text-foreground leading-relaxed italic">
                "The Training Department's Vision is to transform the Medicare insurance landscape by making high-quality, on-demand, engaging, and reliable training accessible to every professional, fostering expertise, integrity, continuous growth, compliance, and compassionate service that drives better outcomes for beneficiaries."
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            What Drives Us
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center shadow-card hover:shadow-hover transition-all duration-300">
              <CardContent className="p-6">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Excellence</h3>
                <p className="text-muted-foreground">
                  We deliver training that exceeds industry standards and empowers professionals to achieve their highest potential.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-card hover:shadow-hover transition-all duration-300">
              <CardContent className="p-6">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Innovation</h3>
                <p className="text-muted-foreground">
                  We leverage cutting-edge technology and AI to create engaging, effective learning experiences.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-card hover:shadow-hover transition-all duration-300">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Community</h3>
                <p className="text-muted-foreground">
                  We build connections between professionals, fostering collaboration and shared growth.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center shadow-card hover:shadow-hover transition-all duration-300">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Growth</h3>
                <p className="text-muted-foreground">
                  We're committed to continuous improvement and helping our members evolve with the industry.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Leadership Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
            Leadership Recognition
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card className="shadow-professional">
              <CardContent className="p-8">
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">CEO Recommendation</h3>
                  <p className="font-semibold mb-4 text-slate-900">Matt Buchan, CEO - Exact Medicare</p>
                  <blockquote className="text-muted-foreground italic leading-relaxed">
                    "Jay brought a level of excellence, passion, and professionalism that is truly second to none. His leadership was instrumental in designing and implementing a comprehensive training program that became the gold standard for onboarding new agents."
                  </blockquote>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-professional">
              <CardContent className="p-8">
                <div className="border-l-4 border-secondary pl-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Board Member Recommendation</h3>
                  <p className="font-semibold mb-4 text-slate-900">Randy Lang, Board Member - Exact Medicare</p>
                  <blockquote className="text-muted-foreground italic leading-relaxed">
                    "Jay has been an invaluable asset bringing deep expertise in Medicare and exceptional commitment to training. He built our Medicare department from the ground up and recruited over 100 highly qualified agents."
                  </blockquote>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="border-l-4 border-accent pl-4">
                  <p className="text-muted-foreground italic mb-4">
                    "Jay is constantly focused on growth and self-improvement. Due to his scope of responsibilities, Jay's success is greatly owed to his organizational skills, time management and prioritization."
                  </p>
                  <p className="text-sm font-semibold text-foreground">— Janelle Llaser</p>
                  <p className="text-sm text-muted-foreground">Sr. Manager Agent Performance | Assurance IQ</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="border-l-4 border-primary pl-4">
                  <p className="text-muted-foreground italic mb-4">
                    "Regardless of the scope of project, our organization can always depend on Jay to deliver high quality product always by and often before due date."
                  </p>
                  <p className="text-sm font-semibold text-foreground">— Amir Mostafaie</p>
                  <p className="text-sm text-muted-foreground">VP Agency Training | Assurance IQ</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Training?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of Medicare professionals who trust The Training Department for their educational needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90">
              Start Your Free Trial
            </Button>
            <Button variant="outline" size="xl" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Contact Jay Sweat
            </Button>
          </div>
        </div>
      </section>

      <Footer currentPage="About" />
    </div>;
};
export default About;