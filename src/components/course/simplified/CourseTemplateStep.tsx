import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, BookOpen, Users, Sparkles, BarChart3 } from "lucide-react";

interface Module {
  title: string;
  description: string;
  module_order: number;
  estimated_duration_minutes: number;
  is_required: boolean;
  lessons: Lesson[];
}

interface Lesson {
  title: string;
  description: string;
  lesson_type: string;
  content_text: string;
  lesson_order: number;
  estimated_duration_minutes: number;
  is_required: boolean;
}

interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  modules: Omit<Module, 'id'>[];
  features: string[];
}

interface CourseTemplateStepProps {
  course: any;
  setCourse: (course: any) => void;
  modules: Module[];
  setModules: (modules: Module[]) => void;
}

const courseTemplates: CourseTemplate[] = [
  {
    id: "medicare-basics",
    name: "Medicare Fundamentals",
    description: "Complete introduction to Medicare for new agents",
    category: "medicare",
    difficulty: "beginner",
    duration: "4-6 hours",
    features: ["Interactive examples", "Practice scenarios", "Compliance focus", "CE credits"],
    modules: [
      {
        title: "Medicare Overview",
        description: "Introduction to Medicare program structure and history",
        module_order: 1,
        estimated_duration_minutes: 90,
        is_required: true,
        lessons: [
          {
            title: "What is Medicare?",
            description: "Overview of the Medicare program",
            lesson_type: "text",
            content_text: "Medicare is a federal health insurance program...",
            lesson_order: 1,
            estimated_duration_minutes: 30,
            is_required: true
          },
          {
            title: "Medicare History",
            description: "Understanding how Medicare evolved",
            lesson_type: "text",
            content_text: "Medicare was established in 1965...",
            lesson_order: 2,
            estimated_duration_minutes: 20,
            is_required: true
          }
        ]
      },
      {
        title: "Medicare Parts A & B",
        description: "Deep dive into Original Medicare",
        module_order: 2,
        estimated_duration_minutes: 120,
        is_required: true,
        lessons: [
          {
            title: "Part A - Hospital Insurance",
            description: "Coverage and benefits of Medicare Part A",
            lesson_type: "text",
            content_text: "Medicare Part A covers hospital stays...",
            lesson_order: 1,
            estimated_duration_minutes: 45,
            is_required: true
          },
          {
            title: "Part B - Medical Insurance",
            description: "Understanding Medicare Part B coverage",
            lesson_type: "text",
            content_text: "Medicare Part B covers medical services...",
            lesson_order: 2,
            estimated_duration_minutes: 45,
            is_required: true
          }
        ]
      }
    ]
  },
  {
    id: "sales-training",
    name: "Insurance Sales Mastery",
    description: "Advanced sales techniques for insurance professionals",
    category: "sales-training",
    difficulty: "intermediate",
    duration: "6-8 hours",
    features: ["Role-playing exercises", "Objection handling", "Lead generation", "CRM integration"],
    modules: [
      {
        title: "Sales Fundamentals",
        description: "Core principles of insurance sales",
        module_order: 1,
        estimated_duration_minutes: 180,
        is_required: true,
        lessons: [
          {
            title: "Understanding Your Customer",
            description: "Customer needs assessment techniques",
            lesson_type: "text",
            content_text: "Effective sales starts with understanding...",
            lesson_order: 1,
            estimated_duration_minutes: 60,
            is_required: true
          }
        ]
      }
    ]
  },
  {
    id: "compliance-training",
    name: "Compliance Essentials",
    description: "Stay compliant with insurance regulations",
    category: "compliance",
    difficulty: "intermediate",
    duration: "3-4 hours",
    features: ["Regulatory updates", "Case studies", "Certification exam", "Annual renewal"],
    modules: [
      {
        title: "Regulatory Framework",
        description: "Understanding insurance regulations",
        module_order: 1,
        estimated_duration_minutes: 120,
        is_required: true,
        lessons: [
          {
            title: "Federal Regulations",
            description: "Overview of federal insurance laws",
            lesson_type: "text",
            content_text: "Federal regulations govern many aspects...",
            lesson_order: 1,
            estimated_duration_minutes: 60,
            is_required: true
          }
        ]
      }
    ]
  }
];

export const CourseTemplateStep = ({ course, setCourse, modules, setModules }: CourseTemplateStepProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const applyTemplate = (template: CourseTemplate) => {
    setSelectedTemplate(template.id);
    setModules(template.modules.map((module, index) => ({
      ...module,
      id: `temp-${index}`,
      lessons: module.lessons.map((lesson, lessonIndex) => ({
        ...lesson,
        id: `temp-lesson-${index}-${lessonIndex}`
      }))
    })));
  };

  const skipTemplate = () => {
    setSelectedTemplate("custom");
    if (modules.length === 0) {
      setModules([]);
    }
  };

  const filteredTemplates = courseTemplates.filter(template => 
    !course.category || template.category === course.category
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose a Starting Point</h3>
        <p className="text-muted-foreground">
          Select a template to get started quickly, or build from scratch
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => applyTemplate(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
                {selectedTemplate === template.id && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    {template.difficulty}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {template.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {template.modules.length} modules
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {template.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Custom/Skip Template Option */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-dashed ${
            selectedTemplate === "custom" ? 'ring-2 ring-primary' : ''
          }`}
          onClick={skipTemplate}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Build from Scratch
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Start with a blank course and create your own structure
                </p>
              </div>
              {selectedTemplate === "custom" && (
                <CheckCircle className="h-5 w-5 text-primary" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Full customization
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Your pace
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Complete control</Badge>
                <Badge variant="secondary" className="text-xs">AI assistance</Badge>
                <Badge variant="secondary" className="text-xs">Flexible structure</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedTemplate && selectedTemplate !== "custom" && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="font-medium">Template Applied!</span>
              <span className="text-muted-foreground">
                You can customize the content in the next step.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};