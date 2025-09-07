import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Link,
  Table,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Palette
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface FormattingToolbarProps {
  onFormatText: (format: string, value?: string) => void;
  className?: string;
}

export const FormattingToolbar = ({ onFormatText, className }: FormattingToolbarProps) => {
  const formatButtons = [
    // Text formatting
    { icon: Bold, format: 'bold', tooltip: 'Bold (Ctrl+B)' },
    { icon: Italic, format: 'italic', tooltip: 'Italic (Ctrl+I)' },
    { icon: Underline, format: 'underline', tooltip: 'Underline (Ctrl+U)' },
    { icon: Strikethrough, format: 'strikethrough', tooltip: 'Strikethrough' },
  ];

  const headingButtons = [
    { icon: Heading1, format: 'h1', tooltip: 'Heading 1' },
    { icon: Heading2, format: 'h2', tooltip: 'Heading 2' },
    { icon: Heading3, format: 'h3', tooltip: 'Heading 3' },
    { icon: Type, format: 'p', tooltip: 'Paragraph' },
  ];

  const listButtons = [
    { icon: List, format: 'bullist', tooltip: 'Bullet List' },
    { icon: ListOrdered, format: 'numlist', tooltip: 'Numbered List' },
    { icon: Quote, format: 'blockquote', tooltip: 'Quote' },
    { icon: Code, format: 'code', tooltip: 'Code Block' },
  ];

  const alignmentButtons = [
    { icon: AlignLeft, format: 'alignleft', tooltip: 'Align Left' },
    { icon: AlignCenter, format: 'aligncenter', tooltip: 'Align Center' },
    { icon: AlignRight, format: 'alignright', tooltip: 'Align Right' },
    { icon: AlignJustify, format: 'alignjustify', tooltip: 'Justify' },
  ];

  const indentButtons = [
    { icon: Outdent, format: 'outdent', tooltip: 'Decrease Indent' },
    { icon: Indent, format: 'indent', tooltip: 'Increase Indent' },
  ];

  const insertButtons = [
    { icon: Link, format: 'link', tooltip: 'Insert Link' },
    { icon: Table, format: 'table', tooltip: 'Insert Table' },
  ];

  const renderButtonGroup = (buttons: typeof formatButtons, groupClassName?: string) => (
    <div className={cn("flex items-center space-x-1", groupClassName)}>
      {buttons.map(({ icon: Icon, format, tooltip }) => (
        <Button
          key={format}
          variant="ghost"
          size="sm"
          onClick={() => onFormatText(format)}
          title={tooltip}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );

  return (
    <div className={cn("flex items-center space-x-2 p-2 border-b border-border bg-muted/30", className)}>
      {renderButtonGroup(formatButtons)}
      <Separator orientation="vertical" className="h-6" />
      {renderButtonGroup(headingButtons)}
      <Separator orientation="vertical" className="h-6" />
      {renderButtonGroup(listButtons)}
      <Separator orientation="vertical" className="h-6" />
      {renderButtonGroup(alignmentButtons)}
      <Separator orientation="vertical" className="h-6" />
      {renderButtonGroup(indentButtons)}
      <Separator orientation="vertical" className="h-6" />
      {renderButtonGroup(insertButtons)}
    </div>
  );
};

export default FormattingToolbar;