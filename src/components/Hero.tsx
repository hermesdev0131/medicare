import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Award, BookOpen } from 'lucide-react';
const Hero = () => {
  const features = ['Expert-crafted Medicare training programs', 'Live instructor-led webinars', 'Comprehensive LMS platform'];
  return <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Elevate Your
            <span className="block bg-gradient-to-r from-primary-glow to-white bg-clip-text text-slate-50">Medicare Knowledge</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">With The Training Department's comprehensive suite of educational programs and AI-powered resources.</p>

          {/* Feature List */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
            {features.map((feature, index) => <div key={index} className="flex items-center text-white/90">
                <CheckCircle className="h-5 w-5 text-primary-glow mr-2 flex-shrink-0" />
                <span className="text-sm md:text-base">{feature}</span>
              </div>)}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            
            
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Users className="h-8 w-8 text-primary-glow" />
              </div>
              <div className="text-3xl font-bold text-white">4000+</div>
              <div className="text-white/80">Medicare Professionals Trained</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Award className="h-8 w-8 text-primary-glow" />
              </div>
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-white/80">Compliance Success Rate</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <BookOpen className="h-8 w-8 text-primary-glow" />
              </div>
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-white/80">Training Resources Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;