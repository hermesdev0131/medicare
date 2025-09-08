import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Award, BookOpen, Star, Play, ArrowRight, Mail } from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';

const Hero = () => {
  const features = ['Expert-crafted Medicare training programs', 'Live instructor-led webinars', 'Comprehensive LMS platform'];
  
  return (
    <section className="relative overflow-hidden py-12 lg:py-20">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')"
        }}
      />
      {/* Dark Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/20 to-primary-glow/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Social Proof Badge */}
          {/* <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full px-6 py-3 mb-8 shadow-lg">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary-glow text-primary-glow" />
              ))}
            </div>
            <span className="text-foreground text-sm font-semibold">4.9/5 from 2,000+ Medicare agents</span>
          </div> */}

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mt-4 mb-12 leading-tight">
            Elevate Your <span className="bg-gradient-to-r from-primary-glow to-white bg-clip-text text-transparent">Medicare Expertise</span>
          </h1>

          {/* Two-Column Layout - Left: Original Content, Right: Newsletter (50/50 split) */}
          <div id="newsletter-section" className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Left Side - All Original Elements (50% width) */}
            <div className="flex flex-col justify-between space-y-8">
              {/* Top Content */}
              <div className="space-y-14">
                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-white/90 leading-relaxed text-center lg:text-left">
                  Transform your Medicare knowledge with AI-powered training, live expert sessions, and comprehensive resources. 
                  <span className="font-semibold text-white"> Join 4,000+ successful agents.</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
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
                    <Play className="h-5 w-5 mr-2" />
                    Watch Demo
                  </Button>
                </div>

                {/* Feature List */}
                {/* <div className="flex flex-wrap justify-center lg:justify-start gap-8 md:gap-10">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center text-white/90 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-sm">
                      <CheckCircle className="h-5 w-5 text-primary-glow mr-3 flex-shrink-0" />
                      <span className="text-sm md:text-base font-medium">{feature}</span>
                    </div>
                  ))}
                </div> */}

                
              </div>

              {/* Bottom Content - Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
                  <div className="flex justify-center mb-3">
                    <Users className="h-8 w-8 text-primary-glow" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">4,000+</div>
                  <div className="text-white/80 font-medium">Medicare Professionals Trained</div>
                </div>
                <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
                  <div className="flex justify-center mb-3">
                    <Award className="h-8 w-8 text-primary-glow" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">98%</div>
                  <div className="text-white/80 font-medium">Compliance Success Rate</div>
                </div>
                <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
                  <div className="flex justify-center mb-3">
                    <BookOpen className="h-8 w-8 text-primary-glow" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">50+</div>
                  <div className="text-white/80 font-medium">Training Resources Available</div>
                </div>
              </div>
            </div>

            {/* Right Side - Newsletter (50% width) */}
            <div className="flex justify-center lg:justify-start">
              <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg w-full flex flex-col h-full">
                {/* Newsletter Content */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Newsletter Title */}
                  {/* <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                    Stay Informed with Our Newsletter
                  </h3>
                  <p className="text-base text-gray-600 mb-8 text-center leading-relaxed">
                    Get the latest Medicare updates, training materials, and exclusive content delivered directly to your inbox.
                  </p> */}
                  
                  {/* Newsletter Form */}
                  <NewsletterSignup className="text-center h-96 flex flex-col justify-center" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;