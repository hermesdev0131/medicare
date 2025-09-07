import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, FileText, Image, Code, Layout } from "lucide-react";
import { toast } from "sonner";

interface ContentBlock {
  id: string;
  name: string;
  type: 'text' | 'image' | 'code' | 'template';
  content: string;
  description?: string;
  tags: string[];
  created_at: string;
}

export function ContentLibrary() {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBlock, setNewBlock] = useState({
    name: "",
    type: "text" as ContentBlock['type'],
    content: "",
    description: "",
    tags: ""
  });

  useEffect(() => {
    // Load demo content blocks
    setContentBlocks([
      {
        id: "1",
        name: "Welcome Message",
        type: "text",
        content: "Welcome to our newsletter! We're excited to share valuable insights with you.",
        description: "Standard welcome message for new subscribers",
        tags: ["welcome", "intro"],
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        name: "Call to Action Button",
        type: "code",
        content: `<a href="#" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Learn More</a>`,
        description: "Blue call-to-action button",
        tags: ["cta", "button"],
        created_at: new Date().toISOString()
      },
      {
        id: "3",
        name: "Newsletter Header Template",
        type: "template",
        content: `<div style="text-align: center; padding: 20px; background: #f8f9fa;">
  <h1 style="color: #333; margin: 0;">{{newsletter_title}}</h1>
  <p style="color: #666; margin: 5px 0;">{{newsletter_date}}</p>
</div>`,
        description: "Standard header template with title and date",
        tags: ["header", "template"],
        created_at: new Date().toISOString()
      }
    ]);
  }, []);

  const filteredBlocks = contentBlocks.filter(block => {
    const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         block.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         block.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "all" || block.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCreateBlock = () => {
    if (!newBlock.name || !newBlock.content) {
      toast.error("Please fill in name and content");
      return;
    }

    const block: ContentBlock = {
      id: Date.now().toString(),
      name: newBlock.name,
      type: newBlock.type,
      content: newBlock.content,
      description: newBlock.description,
      tags: newBlock.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      created_at: new Date().toISOString()
    };

    setContentBlocks(prev => [block, ...prev]);
    setNewBlock({ name: "", type: "text", content: "", description: "", tags: "" });
    setShowCreateDialog(false);
    toast.success("Content block created successfully");
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  };

  const getIcon = (type: ContentBlock['type']) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'template': return <Layout className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: ContentBlock['type']) => {
    switch (type) {
      case 'text': return 'default';
      case 'image': return 'secondary';
      case 'code': return 'destructive';
      case 'template': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Content Library</CardTitle>
              <CardDescription>
                Reusable content blocks, templates, and snippets for your newsletters
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content Block
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Content Block</DialogTitle>
                  <DialogDescription>
                    Create a reusable content block for your newsletters
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newBlock.name}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, name: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type
                    </Label>
                    <select
                      id="type"
                      value={newBlock.type}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, type: e.target.value as ContentBlock['type'] }))}
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="text">Text</option>
                      <option value="code">HTML/Code</option>
                      <option value="template">Template</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="content" className="text-right pt-2">
                      Content
                    </Label>
                    <Textarea
                      id="content"
                      value={newBlock.content}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, content: e.target.value }))}
                      className="col-span-3 min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={newBlock.description}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, description: e.target.value }))}
                      className="col-span-3"
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tags" className="text-right">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      value={newBlock.tags}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, tags: e.target.value }))}
                      className="col-span-3"
                      placeholder="Comma-separated tags"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateBlock}>
                    Create Content Block
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search content blocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="all">All Types</option>
              <option value="text">Text</option>
              <option value="code">HTML/Code</option>
              <option value="template">Template</option>
              <option value="image">Image</option>
            </select>
          </div>

          {/* Content Blocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBlocks.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {searchTerm || selectedType !== "all" 
                  ? "No content blocks found matching your criteria."
                  : "No content blocks yet. Create your first one to get started."
                }
              </div>
            ) : (
              filteredBlocks.map((block) => (
                <Card key={block.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIcon(block.type)}
                        <CardTitle className="text-sm">{block.name}</CardTitle>
                      </div>
                      <Badge variant={getTypeColor(block.type) as any}>
                        {block.type}
                      </Badge>
                    </div>
                    {block.description && (
                      <CardDescription className="text-xs">
                        {block.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-muted p-2 rounded text-xs font-mono max-h-20 overflow-hidden">
                      {block.content.substring(0, 100)}
                      {block.content.length > 100 && '...'}
                    </div>
                    {block.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {block.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => copyToClipboard(block.content)}
                    >
                      Copy to Clipboard
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}