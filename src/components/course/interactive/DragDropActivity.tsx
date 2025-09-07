import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";

interface DragItem {
  id: string;
  content: string;
  correctTarget: string;
  image?: string;
}

interface DropTarget {
  id: string;
  label: string;
  acceptedItems: string[];
  image?: string;
}

interface DragDropActivityProps {
  title: string;
  description?: string;
  items: DragItem[];
  targets: DropTarget[];
  onComplete?: (correct: number, total: number) => void;
  allowMultipleAttempts?: boolean;
  showFeedback?: boolean;
  enableTTS?: boolean;
}

const ItemType = 'DRAG_ITEM';

const DraggableItem = ({ 
  item, 
  isMatched, 
  isIncorrect, 
  enableTTS 
}: { 
  item: DragItem; 
  isMatched: boolean; 
  isIncorrect: boolean;
  enableTTS?: boolean;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: item.id },
    canDrag: !isMatched,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && enableTTS) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <motion.div
      ref={drag}
      initial={{ scale: 1 }}
      whileHover={{ scale: isMatched ? 1 : 1.05 }}
      whileDrag={{ scale: 1.1 }}
      animate={{ 
        scale: isDragging ? 1.1 : 1,
        opacity: isDragging ? 0.5 : 1 
      }}
    >
      <Card 
        className={`
          cursor-${isMatched ? 'default' : 'grab'} transition-all duration-200
          ${isMatched ? 'bg-green-50 border-green-200' : ''}
          ${isIncorrect ? 'bg-red-50 border-red-200 animate-pulse' : ''}
          ${isDragging ? 'shadow-lg' : ''}
        `}
      >
        <CardContent className="p-4 text-center relative">
          {item.image && (
            <img 
              src={item.image} 
              alt="" 
              className="w-12 h-12 object-contain mx-auto mb-2 rounded"
            />
          )}
          <p className="text-sm font-medium">{item.content}</p>
          
          {isMatched && (
            <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-green-600" />
          )}
          
          {isIncorrect && (
            <XCircle className="absolute top-2 right-2 h-4 w-4 text-red-600" />
          )}

          {enableTTS && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => speakText(item.content)}
              className="absolute top-2 left-2 h-6 w-6 p-0"
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DropZone = ({ 
  target, 
  droppedItems, 
  onDrop, 
  showFeedback, 
  enableTTS 
}: { 
  target: DropTarget;
  droppedItems: DragItem[];
  onDrop: (targetId: string, itemId: string) => void;
  showFeedback: boolean;
  enableTTS?: boolean;
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemType,
    drop: (item: { id: string }) => onDrop(target.id, item.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && enableTTS) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      ref={drop}
      className={`
        p-4 border-2 border-dashed rounded-lg min-h-32 transition-all duration-200
        ${isOver && canDrop ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'}
        ${canDrop ? 'border-green-400' : ''}
      `}
    >
      <div className="text-center mb-3">
        <div className="flex items-center justify-center space-x-2">
          <h3 className="font-medium">{target.label}</h3>
          {enableTTS && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => speakText(target.label)}
              className="h-6 w-6 p-0"
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        {target.image && (
          <img 
            src={target.image} 
            alt="" 
            className="w-16 h-16 object-contain mx-auto mt-2 rounded"
          />
        )}
      </div>
      
      <div className="space-y-2">
        {droppedItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Badge 
              variant={
                showFeedback 
                  ? (item.correctTarget === target.id ? 'default' : 'destructive')
                  : 'secondary'
              }
              className="block text-center py-2"
            >
              {item.content}
              {showFeedback && (
                item.correctTarget === target.id 
                  ? <CheckCircle className="inline ml-2 h-3 w-3" />
                  : <XCircle className="inline ml-2 h-3 w-3" />
              )}
            </Badge>
          </motion.div>
        ))}
      </div>
      
      {droppedItems.length === 0 && (
        <p className="text-muted-foreground text-center text-sm mt-4">
          Drop items here
        </p>
      )}
    </div>
  );
};

const DragDropActivity = ({ 
  title, 
  description, 
  items, 
  targets, 
  onComplete, 
  allowMultipleAttempts = true,
  showFeedback = true,
  enableTTS = true
}: DragDropActivityProps) => {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [availableItems, setAvailableItems] = useState<DragItem[]>(items);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [incorrectItems, setIncorrectItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    // Shuffle items initially
    setAvailableItems([...items].sort(() => Math.random() - 0.5));
  }, [items]);

  const handleDrop = (targetId: string, itemId: string) => {
    const newPlacements = { ...placements, [itemId]: targetId };
    setPlacements(newPlacements);
    
    // Remove from available items
    setAvailableItems(prev => prev.filter(item => item.id !== itemId));
    
    // Clear incorrect status
    setIncorrectItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const checkAnswers = () => {
    let correctCount = 0;
    const newIncorrectItems = new Set<string>();
    
    Object.entries(placements).forEach(([itemId, targetId]) => {
      const item = items.find(i => i.id === itemId);
      if (item && item.correctTarget === targetId) {
        correctCount++;
      } else {
        newIncorrectItems.add(itemId);
      }
    });

    setIncorrectItems(newIncorrectItems);
    setShowResults(true);
    
    if (correctCount === items.length) {
      setIsCompleted(true);
      toast({
        title: "Excellent! 🎉",
        description: "You got all matches correct!",
      });
    } else {
      toast({
        title: "Good try!",
        description: `You got ${correctCount} out of ${items.length} correct.`,
        variant: allowMultipleAttempts ? "default" : "destructive",
      });
    }
    
    onComplete?.(correctCount, items.length);
  };

  const resetActivity = () => {
    setPlacements({});
    setAvailableItems([...items].sort(() => Math.random() - 0.5));
    setIsCompleted(false);
    setShowResults(false);
    setIncorrectItems(new Set());
  };

  const getDroppedItemsForTarget = (targetId: string): DragItem[] => {
    return Object.entries(placements)
      .filter(([_, target]) => target === targetId)
      .map(([itemId]) => items.find(item => item.id === itemId)!)
      .filter(Boolean);
  };

  const isAllItemsPlaced = availableItems.length === 0;

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{title}</span>
                {enableTTS && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(`${title}. ${description || ''}`);
                        utterance.rate = 0.8;
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <Button onClick={resetActivity} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Available Items */}
          {availableItems.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Drag these items to the correct categories:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableItems.map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    isMatched={false}
                    isIncorrect={incorrectItems.has(item.id)}
                    enableTTS={enableTTS}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Drop Targets */}
          <div>
            <h3 className="font-medium mb-3">Drop zones:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targets.map((target) => (
                <DropZone
                  key={target.id}
                  target={target}
                  droppedItems={getDroppedItemsForTarget(target.id)}
                  onDrop={handleDrop}
                  showFeedback={showResults && showFeedback}
                  enableTTS={enableTTS}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {isAllItemsPlaced && !isCompleted && (
            <div className="flex justify-center">
              <Button onClick={checkAnswers} size="lg">
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Answers
              </Button>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-4 bg-muted rounded-lg"
            >
              <p className="text-lg font-medium">
                {isCompleted ? '🎉 Perfect Score!' : '📊 Results'}
              </p>
              <p className="text-muted-foreground">
                You got {Object.entries(placements).filter(([itemId]) => {
                  const item = items.find(i => i.id === itemId);
                  return item && item.correctTarget === placements[itemId];
                }).length} out of {items.length} correct.
              </p>
              
              {!isCompleted && allowMultipleAttempts && (
                <p className="text-sm text-muted-foreground mt-2">
                  Items with incorrect placements are highlighted. Try moving them to different categories.
                </p>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </DndProvider>
  );
};

export default DragDropActivity;