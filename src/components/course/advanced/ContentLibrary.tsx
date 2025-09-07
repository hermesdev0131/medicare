import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search,
  Filter,
  Upload,
  Download,
  Share2,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  Activity,
  Tag,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Star,
  Clock,
  Users,
  Grid,
  List,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Folder,
  File
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'text' | 'quiz' | 'interactive' | 'document' | 'template';
  category: string;
  tags: string[];
  difficulty_level: string;
  estimated_duration: number;
  usage_count: number;
  rating: number;
  author: string;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
  content_url?: string;
  metadata: any;
  is_public: boolean;
  is_featured: boolean;
}

interface ContentFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  content_count: number;
  created_at: string;
}

interface ContentLibraryProps {
  onSelectContent?: (content: ContentItem) => void;
  onClose?: () => void;
  mode?: 'browse' | 'select' | 'manage';
}

const ContentLibrary = ({ onSelectContent, onClose, mode = 'browse' }: ContentLibraryProps) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    category: '',
    difficulty_level: '',
    content_type: '',
    author: '',
    tags: [] as string[],
    rating_min: 0,
    duration_max: 0
  });

  const contentTypes = [
    { value: 'video', label: 'Video', icon: Video, color: 'bg-blue-100 text-blue-800' },
    { value: 'text', label: 'Text Content', icon: FileText, color: 'bg-gray-100 text-gray-800' },
    { value: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'bg-green-100 text-green-800' },
    { value: 'interactive', label: 'Interactive', icon: Activity, color: 'bg-purple-100 text-purple-800' },
    { value: 'document', label: 'Document', icon: File, color: 'bg-orange-100 text-orange-800' },
    { value: 'template', label: 'Template', icon: BookOpen, color: 'bg-pink-100 text-pink-800' }
  ];

  const categories = [
    'Medicare Basics',
    'Medicare Advantage',
    'Part D Coverage',
    'Compliance',
    'Marketing Guidelines',
    'Sales Training',
    'Customer Service',
    'TRICARE',
    'VA Benefits',
    'IHS Coordination'
  ];

  useEffect(() => {
    loadContentLibrary();
    loadFolders();
  }, []);

  useEffect(() => {
    filterAndSortContent();
  }, [contentItems, searchTerm, filters, sortBy, sortOrder, activeTab]);

  const loadContentLibrary = async () => {
    setLoading(true);
    try {
      // Mock Medicare-focused content library
      const mockContent: ContentItem[] = [
        {
          id: '1',
          title: 'Medicare Part A Hospital Coverage Explained',
          description: 'Comprehensive overview of Medicare Part A benefits, coverage periods, and deductibles',
          content_type: 'video',
          category: 'Medicare Basics',
          tags: ['part-a', 'hospital', 'inpatient', 'deductible'],
          difficulty_level: 'beginner',
          estimated_duration: 25,
          usage_count: 156,
          rating: 4.8,
          author: 'Medicare Training Team',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T14:30:00Z',
          thumbnail_url: '/api/placeholder/300/200',
          content_url: '/content/videos/medicare-part-a.mp4',
          metadata: {
            video_duration: 1500,
            transcript_available: true,
            cc_available: true
          },
          is_public: true,
          is_featured: true
        },
        {
          id: '2',
          title: 'CMS Marketing Guidelines Checklist',
          description: 'Interactive checklist for ensuring Medicare marketing materials comply with CMS regulations',
          content_type: 'interactive',
          category: 'Compliance',
          tags: ['cms', 'marketing', 'compliance', 'checklist'],
          difficulty_level: 'intermediate',
          estimated_duration: 15,
          usage_count: 203,
          rating: 4.9,
          author: 'Compliance Team',
          created_at: '2024-01-10T09:15:00Z',
          updated_at: '2024-01-25T11:45:00Z',
          metadata: {
            interactive_elements: 12,
            completion_tracking: true
          },
          is_public: true,
          is_featured: true
        },
        {
          id: '3',
          title: 'Medicare Part D Coverage Gap Scenarios',
          description: 'Real-world scenarios explaining the Medicare Part D coverage gap (donut hole)',
          content_type: 'text',
          category: 'Part D Coverage',
          tags: ['part-d', 'coverage-gap', 'donut-hole', 'scenarios'],
          difficulty_level: 'intermediate',
          estimated_duration: 20,
          usage_count: 89,
          rating: 4.5,
          author: 'Curriculum Designer',
          created_at: '2024-01-08T15:30:00Z',
          updated_at: '2024-01-18T10:20:00Z',
          metadata: {
            word_count: 2500,
            reading_level: 'intermediate',
            scenarios_count: 5
          },
          is_public: true,
          is_featured: false
        },
        {
          id: '4',
          title: 'TRICARE and Medicare Coordination Quiz',
          description: 'Assessment quiz covering coordination of benefits between TRICARE and Medicare',
          content_type: 'quiz',
          category: 'TRICARE',
          tags: ['tricare', 'medicare', 'coordination', 'benefits'],
          difficulty_level: 'advanced',
          estimated_duration: 30,
          usage_count: 67,
          rating: 4.3,
          author: 'Assessment Team',
          created_at: '2024-01-05T13:45:00Z',
          updated_at: '2024-01-15T16:20:00Z',
          metadata: {
            questions_count: 25,
            passing_score: 80,
            attempts_allowed: 3
          },
          is_public: true,
          is_featured: false
        },
        {
          id: '5',
          title: 'Medicare Advantage Plan Comparison Template',
          description: 'Customizable template for comparing Medicare Advantage plan features and benefits',
          content_type: 'template',
          category: 'Medicare Advantage',
          tags: ['ma-plans', 'comparison', 'template', 'benefits'],
          difficulty_level: 'beginner',
          estimated_duration: 10,
          usage_count: 134,
          rating: 4.6,
          author: 'Content Team',
          created_at: '2024-01-03T11:20:00Z',
          updated_at: '2024-01-12T09:10:00Z',
          metadata: {
            template_type: 'comparison_chart',
            customizable: true,
            export_formats: ['pdf', 'excel']
          },
          is_public: true,
          is_featured: true
        }
      ];

      setContentItems(mockContent);
    } catch (error: any) {
      console.error('Error loading content library:', error);
      toast({
        title: "Error",
        description: "Failed to load content library",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    // Mock folder structure
    const mockFolders: ContentFolder[] = [
      { id: '1', name: 'Medicare Fundamentals', content_count: 15, created_at: '2024-01-01' },
      { id: '2', name: 'Compliance Materials', content_count: 8, created_at: '2024-01-02' },
      { id: '3', name: 'Assessment Templates', content_count: 12, created_at: '2024-01-03' },
      { id: '4', name: 'Video Library', content_count: 23, created_at: '2024-01-04' },
      { id: '5', name: 'Interactive Content', content_count: 6, created_at: '2024-01-05' }
    ];
    setFolders(mockFolders);
  };

  const filterAndSortContent = () => {
    let filtered = contentItems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'featured') {
        filtered = filtered.filter(item => item.is_featured);
      } else if (activeTab === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(item => new Date(item.created_at) > oneWeekAgo);
      } else if (activeTab === 'popular') {
        filtered = filtered.filter(item => item.usage_count > 100);
      } else {
        filtered = filtered.filter(item => item.content_type === activeTab);
      }
    }

    // Additional filters
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    if (filters.difficulty_level) {
      filtered = filtered.filter(item => item.difficulty_level === filters.difficulty_level);
    }
    if (filters.content_type) {
      filtered = filtered.filter(item => item.content_type === filters.content_type);
    }
    if (filters.rating_min > 0) {
      filtered = filtered.filter(item => item.rating >= filters.rating_min);
    }
    if (filters.duration_max > 0) {
      filtered = filtered.filter(item => item.estimated_duration <= filters.duration_max);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof ContentItem];
      let bValue = b[sortBy as keyof ContentItem];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredItems(filtered);
  };

  const getContentTypeInfo = (type: string) => {
    return contentTypes.find(ct => ct.value === type) || contentTypes[0];
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleSelectItem = (item: ContentItem) => {
    if (mode === 'select' && onSelectContent) {
      onSelectContent(item);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderContentCard = (item: ContentItem) => {
    const typeInfo = getContentTypeInfo(item.content_type);
    const IconComponent = typeInfo.icon;

    return (
      <Card 
        key={item.id} 
        className={`hover:shadow-lg transition-shadow cursor-pointer ${selectedItems.includes(item.id) ? 'ring-2 ring-primary' : ''}`}
        onClick={() => handleSelectItem(item)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent className="h-4 w-4" />
              <Badge className={typeInfo.color}>
                {typeInfo.label}
              </Badge>
              {item.is_featured && (
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={e => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {item.description}
          </p>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(item.estimated_duration)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{item.usage_count}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{item.rating}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.category}</span>
              <Badge variant="outline" className="text-xs">
                {item.difficulty_level}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderListItem = (item: ContentItem) => {
    const typeInfo = getContentTypeInfo(item.content_type);
    const IconComponent = typeInfo.icon;

    return (
      <div 
        key={item.id}
        className={`flex items-center space-x-4 p-4 border rounded-lg hover:shadow-sm cursor-pointer ${selectedItems.includes(item.id) ? 'ring-2 ring-primary' : ''}`}
        onClick={() => handleSelectItem(item)}
      >
        <Checkbox 
          checked={selectedItems.includes(item.id)}
          onCheckedChange={() => toggleItemSelection(item.id)}
          onClick={e => e.stopPropagation()}
        />
        <IconComponent className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium truncate">{item.title}</h4>
            {item.is_featured && (
              <Star className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
            <span>{item.category}</span>
            <span>{formatDuration(item.estimated_duration)}</span>
            <span>{item.usage_count} uses</span>
            <span>★ {item.rating}</span>
          </div>
        </div>
        <Badge className={typeInfo.color}>
          {typeInfo.label}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {item.difficulty_level}
        </Badge>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Library</h1>
          <p className="text-muted-foreground">Medicare training content and resources</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Content
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="usage_count">Popular</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>
        <div className="flex border rounded">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-8 w-full max-w-4xl">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="quiz">Quizzes</TabsTrigger>
          <TabsTrigger value="interactive">Interactive</TabsTrigger>
          <TabsTrigger value="template">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} content items found
            </p>
            {selectedItems.length > 0 && (
              <Badge variant="secondary">
                {selectedItems.length} selected
              </Badge>
            )}
          </div>

          {/* Content Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(renderContentCard)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(renderListItem)}
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No content found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentLibrary;