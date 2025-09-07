import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, BarChart3 } from "lucide-react";

interface Course {
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration_hours: number;
}

interface CourseOverviewStepProps {
  course: Course;
  setCourse: (course: Course) => void;
}

export const CourseOverviewStep = ({ course, setCourse }: CourseOverviewStepProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Course Basics</p>
            <p className="text-xs text-muted-foreground">Title, description & category</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Difficulty Level</p>
            <p className="text-xs text-muted-foreground">Match your audience</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Duration</p>
            <p className="text-xs text-muted-foreground">Estimated completion time</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-2">Course Title *</label>
          <Input
            value={course.title}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
            placeholder="e.g., Medicare Basics for New Agents"
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Choose a clear, descriptive title that explains what learners will gain
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Course Description *</label>
          <Textarea
            value={course.description}
            onChange={(e) => setCourse({ ...course, description: e.target.value })}
            placeholder="Describe what learners will accomplish in this course. Include key topics, skills they'll develop, and how it will help their career..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Help learners understand the value and outcomes of your course
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Category *</label>
            <Select 
              value={course.category} 
              onValueChange={(value) => setCourse({ ...course, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medicare">Medicare</SelectItem>
                <SelectItem value="life-insurance">Life Insurance</SelectItem>
                <SelectItem value="health-insurance">Health Insurance</SelectItem>
                <SelectItem value="property-casualty">Property & Casualty</SelectItem>
                <SelectItem value="annuities">Annuities</SelectItem>
                <SelectItem value="sales-training">Sales Training</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="continuing-education">Continuing Education</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Difficulty Level *</label>
            <Select 
              value={course.difficulty_level} 
              onValueChange={(value) => setCourse({ ...course, difficulty_level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">
                  <div>
                    <p className="font-medium">Beginner</p>
                    <p className="text-xs text-muted-foreground">New to the topic</p>
                  </div>
                </SelectItem>
                <SelectItem value="intermediate">
                  <div>
                    <p className="font-medium">Intermediate</p>
                    <p className="text-xs text-muted-foreground">Some experience</p>
                  </div>
                </SelectItem>
                <SelectItem value="advanced">
                  <div>
                    <p className="font-medium">Advanced</p>
                    <p className="text-xs text-muted-foreground">Expert level</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Estimated Duration (hours)</label>
            <Input
              type="number"
              min="0.5"
              max="40"
              step="0.5"
              value={course.estimated_duration_hours}
              onChange={(e) => setCourse({ ...course, estimated_duration_hours: parseFloat(e.target.value) || 1 })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Total time to complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};