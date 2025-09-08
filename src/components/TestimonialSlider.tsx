import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import 'swiper/css/effect-coverflow';
import 'swiper/css/effect-fade';

interface Testimonial {
  id: number;
  company: string;
  logo: string;
  backgroundImage: string;
  videoUrl?: string;
  quote: string;
  speaker: string;
  jobTitle: string;
  category?: string;
}

interface TestimonialSliderProps {
  testimonials: Testimonial[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  effect?: 'slide' | 'fade' | 'coverflow';
}

const TestimonialSlider: React.FC<TestimonialSliderProps> = ({
  testimonials,
  autoPlay = true,
  autoPlayInterval = 5000,
  effect = 'slide'
}) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const handlePlayVideo = (videoUrl: string) => {
    setSelectedVideo(videoUrl);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="relative w-full">
      {/* Swiper Slider */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectCoverflow, EffectFade]}
        spaceBetween={effect === 'coverflow' ? 50 : 24}
        slidesPerView={effect === 'fade' ? 1 : effect === 'coverflow' ? 'auto' : 1}
        centeredSlides={effect === 'coverflow' || effect === 'slide'}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
          el: '.swiper-pagination-custom',
        }}
        autoplay={autoPlay ? {
          delay: autoPlayInterval,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        } : false}
        loop={testimonials.length > 1}
        effect={effect}
        coverflowEffect={effect === 'coverflow' ? {
          rotate: 15,
          stretch: 0,
          depth: 200,
          modifier: 2,
          slideShadows: true,
        } : undefined}
        fadeEffect={effect === 'fade' ? {
          crossFade: true,
        } : undefined}
        speed={800}
        breakpoints={effect === 'fade' ? {
          640: { slidesPerView: 1, centeredSlides: false },
          768: { slidesPerView: 1, centeredSlides: false },
          1024: { slidesPerView: 1, centeredSlides: false },
        } : effect === 'coverflow' ? {
          640: { slidesPerView: 1.2, spaceBetween: 30, centeredSlides: true },
          768: { slidesPerView: 1.5, spaceBetween: 40, centeredSlides: true },
          1024: { slidesPerView: 2.2, spaceBetween: 50, centeredSlides: true },
        } : {
          640: { slidesPerView: 1, spaceBetween: 20, centeredSlides: false },
          768: { slidesPerView: 2, spaceBetween: 24, centeredSlides: false },
          1024: { slidesPerView: 3, spaceBetween: 24, centeredSlides: true },
        }}
        className="testimonial-swiper"
      >
        {testimonials.map((testimonial, index) => (
          <SwiperSlide key={testimonial.id} className={effect === 'coverflow' ? 'w-80' : ''}>
            <Card className="group relative h-[500px] bg-cover bg-center bg-no-repeat rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-700 ease-out overflow-hidden cursor-pointer border-0 transform hover:scale-[1.02] hover:-translate-y-2"
                  style={{ 
                    backgroundImage: `url(${testimonial.backgroundImage})`,
                    animationDelay: `${index * 0.1}s`
                  }}>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 rounded-3xl transition-all duration-500 group-hover:from-black/95 group-hover:via-black/50" />
              
              {/* Category Badge */}
              {testimonial.category && (
                <div className="absolute top-6 left-6 z-10 transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                  <Badge className="bg-white/90 text-gray-800 hover:bg-white font-medium px-3 py-1 text-sm rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                    {testimonial.category}
                  </Badge>
                </div>
              )}

              {/* Content */}
              <CardContent className="absolute bottom-0 left-0 right-0 p-8 z-10">
                {/* Quote Text - Default State */}
                <div className="group-hover:opacity-0 group-hover:-translate-y-4 transition-all duration-500 ease-out">
                  <blockquote className="text-white text-xl font-bold leading-relaxed mb-6 transform transition-all duration-700 ease-out">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="text-white/90 transform transition-all duration-500 delay-100">
                    <div className="font-semibold text-lg transition-all duration-300">{testimonial.speaker}</div>
                    <div className="text-sm opacity-80 transition-all duration-300">{testimonial.jobTitle}</div>
                  </div>
                </div>

                {/* Play Button - Hover State */}
                {testimonial.videoUrl && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out delay-200">
                    <Button
                      onClick={() => handlePlayVideo(testimonial.videoUrl!)}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:scale-110 transition-all duration-400 ease-out rounded-full px-6 py-2 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <Play className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                      <span className="transition-all duration-300">Play story</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Arrows */}
      {testimonials.length > 1 && (
        <>
          <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-20 w-14 h-14 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl rounded-full transition-all duration-500 ease-out flex items-center justify-center group hover:scale-125 hover:-translate-x-8 hover:bg-white max-md:w-10 max-md:h-10 max-md:-translate-x-2 max-md:hover:-translate-x-4">
            <svg className="w-6 h-6 text-gray-600 group-hover:text-primary max-md:w-5 max-md:h-5 transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-20 w-14 h-14 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl rounded-full transition-all duration-500 ease-out flex items-center justify-center group hover:scale-125 hover:translate-x-8 hover:bg-white max-md:w-10 max-md:h-10 max-md:translate-x-2 max-md:hover:translate-x-4">
            <svg className="w-6 h-6 text-gray-600 group-hover:text-primary max-md:w-5 max-md:h-5 transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Custom Pagination Dots */}
      {testimonials.length > 1 && (
        <div className="swiper-pagination-custom flex justify-center mt-8 space-x-2"></div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="relative w-full max-w-4xl mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-700 ease-out">
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-all duration-300 hover:scale-110 hover:rotate-90 transform"
            >
              <svg className="w-8 h-8 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]">
              <iframe
                src={selectedVideo}
                className="w-full h-full transition-opacity duration-500"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .testimonial-swiper {
          padding: 20px 0;
        }
        
        .testimonial-swiper .swiper-slide {
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          opacity: 0.7;
          transform: scale(0.95);
        }
        
        .testimonial-swiper .swiper-slide-active {
          opacity: 1;
          transform: scale(1);
        }
        
        .testimonial-swiper .swiper-slide-next,
        .testimonial-swiper .swiper-slide-prev {
          opacity: 0.8;
          transform: scale(0.98);
        }
        
        .testimonial-swiper .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #d1d5db;
          opacity: 1;
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          border-radius: 50%;
          position: relative;
        }
        
        .testimonial-swiper .swiper-pagination-bullet::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 0;
          height: 0;
          background: hsl(var(--primary));
          border-radius: 50%;
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .testimonial-swiper .swiper-pagination-bullet-active {
          background: hsl(var(--primary));
          transform: scale(1.8);
          box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.15);
        }
        
        .testimonial-swiper .swiper-pagination-bullet-active::before {
          width: 100%;
          height: 100%;
        }
        
        .testimonial-swiper .swiper-pagination-bullet:hover {
          background: hsl(var(--primary) / 0.6);
          transform: scale(1.4);
          box-shadow: 0 4px 8px -1px rgba(0, 0, 0, 0.1);
        }
        
        .testimonial-swiper .swiper-pagination-bullet-dynamic {
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .testimonial-swiper .swiper-slide-active .group {
          animation: fadeInScale 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .testimonial-swiper .swiper-slide-active blockquote {
          animation: slideInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both;
        }
        
        .testimonial-swiper .swiper-slide-active .font-semibold {
          animation: slideInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both;
        }
        
        /* Coverflow effect enhancements */
        .testimonial-swiper.swiper-coverflow .swiper-slide {
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .testimonial-swiper.swiper-coverflow .swiper-slide-shadow-left,
        .testimonial-swiper.swiper-coverflow .swiper-slide-shadow-right {
          background: linear-gradient(to right, rgba(0,0,0,0.5), transparent);
          border-radius: 24px;
        }
      `}</style>
    </div>
  );
};

export default TestimonialSlider;