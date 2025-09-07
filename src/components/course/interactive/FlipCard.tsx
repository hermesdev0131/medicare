import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FlipCardProps {
  frontContent: string;
  backContent: string;
  frontImage?: string;
  backImage?: string;
  title?: string;
  enableTTS?: boolean;
  onFlip?: (isFlipped: boolean) => void;
  className?: string;
}

const FlipCard = ({ 
  frontContent, 
  backContent, 
  frontImage, 
  backImage, 
  title,
  enableTTS = true,
  onFlip,
  className = ""
}: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    const newFlippedState = !isFlipped;
    setIsFlipped(newFlippedState);
    onFlip?.(newFlippedState);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stripHtml = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  return (
    <div className={`flip-card-container ${className}`} style={{ perspective: '1000px' }}>
      <motion.div
        className="flip-card"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ 
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '300px',
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={handleFlip}
      >
        {/* Front Side */}
        <Card 
          className="flip-card-side flip-card-front absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)'
          }}
        >
          <CardContent className="p-6 h-full flex flex-col justify-center relative">
            {title && (
              <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
            )}
            
            {frontImage && (
              <div className="mb-4 flex justify-center">
                <img 
                  src={frontImage} 
                  alt="Flip card front" 
                  className="max-h-24 object-contain rounded"
                />
              </div>
            )}
            
            <div 
              className="text-center text-foreground prose max-w-none"
              dangerouslySetInnerHTML={{ __html: frontContent }}
            />
            
            <div className="absolute top-2 right-2 flex space-x-1">
              {enableTTS && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(stripHtml(frontContent));
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Click to flip
            </div>
          </CardContent>
        </Card>

        {/* Back Side */}
        <Card 
          className="flip-card-side flip-card-back absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <CardContent className="p-6 h-full flex flex-col justify-center relative">
            {backImage && (
              <div className="mb-4 flex justify-center">
                <img 
                  src={backImage} 
                  alt="Flip card back" 
                  className="max-h-24 object-contain rounded"
                />
              </div>
            )}
            
            <div 
              className="text-center text-foreground prose max-w-none"
              dangerouslySetInnerHTML={{ __html: backContent }}
            />
            
            <div className="absolute top-2 right-2 flex space-x-1">
              {enableTTS && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(stripHtml(backContent));
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Click to flip back
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default FlipCard;