import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Wand2, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Target,
  Loader2,
  Download,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

interface ContentGeneratorProps {
  userId: string;
  courseId?: string;
  onContentGenerated?: (content: string, type: string) => void;
  className?: string;
}

const contentTypes = [
  { value: 'lesson', label: 'Lesson Content', icon: BookOpen },
  { value: 'quiz', label: 'Quiz Questions', icon: HelpCircle },
  { value: 'summary', label: 'Summary', icon: FileText },
  { value: 'exercise', label: 'Practice Exercise', icon: Target },
];

const difficultyLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  userId,
  courseId,
  onContentGenerated,
  className = ''
}) => {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('lesson');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for content generation",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt,
          contentType,
          userId,
          courseId,
          difficulty,
          topic: topic || undefined
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      setIsExpanded(true);
      
      if (onContentGenerated) {
        onContentGenerated(data.content, contentType);
      }

      toast({
        title: "Content Generated",
        description: `Successfully generated ${contentType} content`,
      });

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive"
      });
    }
  };

  const selectedContentType = contentTypes.find(ct => ct.value === contentType);
  const ContentIcon = selectedContentType?.icon || Wand2;

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`fixed bottom-4 left-4 z-50 ${className}`}
      >
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full p-3 shadow-lg bg-secondary hover:bg-secondary/90"
          title="AI Content Generator"
        >
          <Wand2 className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`fixed bottom-4 left-4 w-96 z-50 ${className}`}
    >
      <Card className="shadow-2xl border-secondary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-secondary" />
              <CardTitle className="text-lg">AI Content Generator</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          </div>
          <Badge variant="outline" className="w-fit">
            <ContentIcon className="h-3 w-3 mr-1" />
            {selectedContentType?.label}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Medicare topic (e.g., Part C, MAPD, TRICARE)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <Textarea
            placeholder="Describe Medicare content to generate (e.g., 'Create a quiz about Medicare Part D enrollment periods and compliance requirements')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />

          <Button
            onClick={generateContent}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>

          {generatedContent && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Generated Content</h4>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      title="Copy to clipboard"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto bg-muted p-3 rounded text-sm">
                  <div className="whitespace-pre-wrap">{generatedContent}</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};