import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: number;
  company: string;
  logo: string;
  backgroundImage: string;
  videoUrl?: string;
  quote: string;
  speaker: string;
  jobTitle: string;
}

interface TestimonialSliderProps {
  testimonials: Testimonial[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const TestimonialSlider: React.FC<TestimonialSliderProps> = ({
  testimonials,
  autoPlay = true,
  autoPlayInterval = 5000
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, testimonials.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handlePlayVideo = (videoUrl: string) => {
    setSelectedVideo(videoUrl);
    setIsPlaying(true);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full">
      {/* Slider Container */}
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
              <Card className="group relative h-96 bg-cover bg-center bg-no-repeat rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden cursor-pointer"
                    style={{ backgroundImage: `url(${testimonial.backgroundImage})` }}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-2xl" />
                
                {/* Company Logo */}
                <div className="absolute top-6 left-6 z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <img 
                      src={testimonial.logo} 
                      alt={`${testimonial.company} logo`}
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                </div>

                {/* Content */}
                <CardContent className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  {/* Quote Text - Default State */}
                  <div className="group-hover:opacity-0 transition-opacity duration-300">
                    <blockquote className="text-white text-xl font-bold leading-relaxed mb-4">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="text-white/90">
                      <div className="font-semibold text-lg">{testimonial.speaker}</div>
                      <div className="text-sm opacity-80">{testimonial.jobTitle}</div>
                    </div>
                  </div>

                  {/* Play Button - Hover State */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button
                      onClick={() => testimonial.videoUrl && handlePlayVideo(testimonial.videoUrl)}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:scale-105 transition-all duration-300 rounded-full px-8 py-3 shadow-lg"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Play story
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm border border-white/20 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group hover:bg-white hover:scale-110"
      >
        <ChevronLeft className="h-6 w-6 text-gray-700 group-hover:text-primary" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm border border-white/20 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group hover:bg-white hover:scale-110"
      >
        <ChevronRight className="h-6 w-6 text-gray-700 group-hover:text-primary" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-8 space-x-3">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-primary scale-125 shadow-lg' 
                : 'bg-gray-300 hover:bg-primary/50 hover:scale-110'
            }`}
          />
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={selectedVideo}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialSlider;
