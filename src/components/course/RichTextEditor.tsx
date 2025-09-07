import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Image,
  Video,
  FileText
} from "lucide-react";
import FormattingToolbar from "./FormattingToolbar";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  enableMediaUpload?: boolean;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...",
  height = 200,
  enableMediaUpload = false 
}: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormatText = (format: string, value?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText = text;
    let newStart = start;
    let newEnd = end;

    switch (format) {
      case 'bold':
        newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end);
        newEnd = end + 4;
        break;
      case 'italic':
        newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end);
        newEnd = end + 2;
        break;
      case 'underline':
        newText = text.substring(0, start) + `<u>${selectedText}</u>` + text.substring(end);
        newEnd = end + 7;
        break;
      case 'h1':
        newText = text.substring(0, start) + `# ${selectedText}` + text.substring(end);
        newEnd = end + 2;
        break;
      case 'h2':
        newText = text.substring(0, start) + `## ${selectedText}` + text.substring(end);
        newEnd = end + 3;
        break;
      case 'h3':
        newText = text.substring(0, start) + `### ${selectedText}` + text.substring(end);
        newEnd = end + 4;
        break;
      case 'ul':
        const ulLines = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        newText = text.substring(0, start) + ulLines + text.substring(end);
        newEnd = start + ulLines.length;
        break;
      case 'ol':
        const olLines = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
        newText = text.substring(0, start) + olLines + text.substring(end);
        newEnd = start + olLines.length;
        break;
      case 'link':
        const url = value || prompt('Enter URL:');
        if (url) {
          newText = text.substring(0, start) + `[${selectedText || 'Link Text'}](${url})` + text.substring(end);
          newEnd = start + `[${selectedText || 'Link Text'}](${url})`.length;
        }
        break;
      case 'quote':
        const quoteLines = selectedText.split('\n').map(line => `> ${line}`).join('\n');
        newText = text.substring(0, start) + quoteLines + text.substring(end);
        newEnd = start + quoteLines.length;
        break;
      default:
        return;
    }

    onChange(newText);

    // Restore cursor position after state update
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newEnd, newEnd);
      }
    }, 0);
  };

  const insertMedia = (type: 'image' | 'video' | 'file') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;
    let insertText = '';

    switch (type) {
      case 'image':
        const imageUrl = prompt('Enter image URL:');
        if (imageUrl) {
          insertText = `![Image](${imageUrl})`;
        }
        break;
      case 'video':
        const videoUrl = prompt('Enter video URL:');
        if (videoUrl) {
          insertText = `[Video: Click to watch](${videoUrl})`;
        }
        break;
      case 'file':
        const fileUrl = prompt('Enter file URL:');
        if (fileUrl) {
          insertText = `[Download File](${fileUrl})`;
        }
        break;
    }

    if (insertText) {
      const newText = text.substring(0, start) + insertText + text.substring(start);
      onChange(newText);

      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(start + insertText.length, start + insertText.length);
        }
      }, 0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Content Editor</CardTitle>
          {enableMediaUpload && (
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => insertMedia('image')}
                type="button"
              >
                <Image className="h-4 w-4 mr-2" />
                Add Image
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => insertMedia('video')}
                type="button"
              >
                <Video className="h-4 w-4 mr-2" />
                Add Video
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => insertMedia('file')}
                type="button"
              >
                <FileText className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <FormattingToolbar onFormatText={handleFormatText} />
        <div className="p-6">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[200px] border-0 resize-none focus-visible:ring-0 font-mono text-sm"
            style={{ 
              height: `${height}px`,
              pointerEvents: 'auto' // Ensure pointer events are enabled
            }}
          />
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-2">Formatting Tips:</p>
            <ul className="space-y-1 text-xs">
              <li>• Select text and use toolbar buttons for formatting</li>
              <li>• **Bold**, *Italic*, # Heading 1, ## Heading 2</li>
              <li>• Use - for bullet points, numbers for ordered lists</li>
              <li>• [Link Text](URL) for links</li>
              <li>• ![Image](URL) for images</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RichTextEditor;