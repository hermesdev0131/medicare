import { useState } from 'react';
import FlipCard from './FlipCard';
import DragDropActivity from './DragDropActivity';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface InteractiveContentProps {
  content: {
    type: 'flip-card' | 'drag-drop' | 'timeline' | 'hotspot' | 'scenario';
    data: any;
  };
  onComplete?: (score?: number) => void;
  enableTTS?: boolean;
  enableAccessibility?: boolean;
}

const TimelineActivity = ({ data, onComplete, enableTTS }: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && enableTTS) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const nextStep = () => {
    if (currentStep < data.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.(100);
    }
  };

  const playTimeline = () => {
    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= data.steps.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          onComplete?.(100);
          return prev;
        }
        return prev + 1;
      });
    }, data.intervalMs || 3000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>{data.title}</span>
            {enableTTS && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => speakText(data.title)}
                className="h-6 w-6 p-0"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            <Button size="sm" onClick={playTimeline} disabled={isPlaying}>
              <Play className="h-4 w-4 mr-2" />
              Auto Play
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCurrentStep(0)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Timeline Progress */}
        <div className="relative">
          <div className="flex justify-between items-center mb-4">
            {data.steps.map((_: any, index: number) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-all ${
                  index <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>
          
          {/* Progress line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted -z-10">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / (data.steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Current Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-muted/50 p-6 rounded-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{data.steps[currentStep].title}</h3>
            <Badge variant="outline">
              Step {currentStep + 1} of {data.steps.length}
            </Badge>
          </div>
          
          {data.steps[currentStep].image && (
            <img
              src={data.steps[currentStep].image}
              alt={data.steps[currentStep].title}
              className="w-full max-h-48 object-cover rounded mb-4"
            />
          )}
          
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: data.steps[currentStep].content }}
          />
          
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {enableTTS && (
                <Button
                  variant="ghost"
                  onClick={() => speakText(data.steps[currentStep].content)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={nextStep}>
                {currentStep === data.steps.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

const HotspotActivity = ({ data, onComplete, enableTTS }: any) => {
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);
  const [completedHotspots, setCompletedHotspots] = useState<Set<number>>(new Set());

  const handleHotspotClick = (index: number) => {
    setSelectedHotspot(index);
    setCompletedHotspots(prev => new Set([...prev, index]));
    
    if (completedHotspots.size + 1 === data.hotspots.length) {
      onComplete?.(100);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && enableTTS) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>{data.title}</span>
          {enableTTS && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => speakText(data.title)}
              className="h-6 w-6 p-0"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{data.instruction}</p>
        
        <div className="relative inline-block">
          <img
            src={data.image}
            alt={data.title}
            className="w-full max-w-2xl rounded-lg"
          />
          
          {/* Hotspots */}
          {data.hotspots.map((hotspot: any, index: number) => (
            <button
              key={index}
              className={`absolute w-6 h-6 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                completedHotspots.has(index)
                  ? 'bg-green-500 ring-4 ring-green-200'
                  : 'bg-primary ring-4 ring-primary/30 animate-pulse'
              }`}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
              }}
              onClick={() => handleHotspotClick(index)}
            />
          ))}
        </div>

        {/* Hotspot Info */}
        {selectedHotspot !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted p-4 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{data.hotspots[selectedHotspot].title}</h4>
              {enableTTS && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => speakText(data.hotspots[selectedHotspot].content)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: data.hotspots[selectedHotspot].content }}
            />
          </motion.div>
        )}

        <div className="text-center">
          <Badge variant="outline">
            {completedHotspots.size} of {data.hotspots.length} explored
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const InteractiveContent = ({ 
  content, 
  onComplete, 
  enableTTS = true, 
  enableAccessibility = true 
}: InteractiveContentProps) => {
  const renderContent = () => {
    switch (content.type) {
      case 'flip-card':
        return (
          <FlipCard
            frontContent={content.data.frontContent}
            backContent={content.data.backContent}
            frontImage={content.data.frontImage}
            backImage={content.data.backImage}
            title={content.data.title}
            enableTTS={enableTTS}
            onFlip={(isFlipped) => {
              if (isFlipped) {
                onComplete?.(100);
              }
            }}
          />
        );

      case 'drag-drop':
        return (
          <DragDropActivity
            title={content.data.title}
            description={content.data.description}
            items={content.data.items}
            targets={content.data.targets}
            enableTTS={enableTTS}
            onComplete={(correct, total) => {
              const score = Math.round((correct / total) * 100);
              onComplete?.(score);
            }}
          />
        );

      case 'timeline':
        return (
          <TimelineActivity
            data={content.data}
            onComplete={onComplete}
            enableTTS={enableTTS}
          />
        );

      case 'hotspot':
        return (
          <HotspotActivity
            data={content.data}
            onComplete={onComplete}
            enableTTS={enableTTS}
          />
        );

      default:
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Interactive content type "{content.type}" not supported yet.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
    </div>
  );
};

export default InteractiveContent;