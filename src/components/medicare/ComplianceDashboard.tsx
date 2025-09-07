import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Clock, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  TrendingUp,
  FileText,
  Users,
  Target,
  BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComplianceMetrics {
  compliance_score: number;
  ahip_certification_completed: boolean;
  ahip_completion_date: string | null;
  annual_training_hours: number;
  required_training_hours: number;
  cms_marketing_training: boolean;
  fraud_waste_abuse_training: boolean;
  privacy_security_training: boolean;
  state_specific_training: boolean;
  compliance_year: number;
  last_updated: string;
}

interface ComplianceDashboardProps {
  userId: string;
}

const ComplianceDashboard = ({ userId }: ComplianceDashboardProps) => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadComplianceMetrics();
    loadUpcomingDeadlines();
  }, [userId]);

  const loadComplianceMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('medicare_compliance')
        .select('*')
        .eq('user_id', userId)
        .eq('compliance_year', new Date().getFullYear())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setMetrics(data);
    } catch (error: any) {
      console.error('Error loading compliance metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingDeadlines = async () => {
    try {
      // Get certifications that expire within 60 days
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', userId)
        .gte('expiration_date', new Date().toISOString().split('T')[0])
        .lte('expiration_date', new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) throw error;

      const deadlines = [
        // Add AHIP renewal deadline if needed
        ...(!metrics?.ahip_certification_completed ? [{
          type: 'AHIP Certification',
          description: 'Complete your AHIP certification for Medicare selling',
          dueDate: new Date(new Date().getFullYear(), 11, 31), // Dec 31
          priority: 'high',
          status: 'overdue'
        }] : []),
        
        // Add certification renewals
        ...(data || []).map(cert => ({
          type: 'License Renewal',
          description: `${cert.name} expires soon`,
          dueDate: new Date(cert.expiration_date),
          priority: 'medium',
          status: 'upcoming'
        })),

        // Add training hours deadline
        ...(metrics && metrics.annual_training_hours < metrics.required_training_hours ? [{
          type: 'Training Hours',
          description: `Complete ${metrics.required_training_hours - metrics.annual_training_hours} more training hours`,
          dueDate: new Date(new Date().getFullYear(), 11, 31),
          priority: 'medium',
          status: 'in-progress'
        }] : [])
      ];

      setUpcomingDeadlines(deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()));
    } catch (error: any) {
      console.error('Error loading deadlines:', error);
    }
  };

  const getComplianceLevel = () => {
    const score = metrics?.compliance_score || 0;
    if (score >= 90) return { level: "Excellent", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
    if (score >= 75) return { level: "Good", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
    if (score >= 60) return { level: "Needs Improvement", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
    return { level: "Critical", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  };

  const getTrainingProgress = () => {
    if (!metrics) return 0;
    return Math.min((metrics.annual_training_hours / metrics.required_training_hours) * 100, 100);
  };

  const getRequiredTrainingsCompleted = () => {
    if (!metrics) return 0;
    const completed = [
      metrics.cms_marketing_training,
      metrics.fraud_waste_abuse_training,
      metrics.privacy_security_training,
      metrics.state_specific_training
    ].filter(Boolean).length;
    return (completed / 4) * 100;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const timeDiff = date.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const complianceLevel = getComplianceLevel();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medicare Compliance Dashboard</h2>
          <p className="text-muted-foreground">Track your compliance status and requirements</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Compliance Year</div>
          <div className="text-xl font-bold">{new Date().getFullYear()}</div>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <Card className={`${complianceLevel.bg} ${complianceLevel.border} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${complianceLevel.bg}`}>
                <Shield className={`h-8 w-8 ${complianceLevel.color}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Overall Compliance Score</h3>
                <p className="text-muted-foreground">Based on all Medicare requirements</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${complianceLevel.color}`}>
                {Math.round(metrics?.compliance_score || 0)}
              </div>
              <Badge className={`${complianceLevel.bg} ${complianceLevel.color} border-current`}>
                {complianceLevel.level}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AHIP Certification</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {metrics?.ahip_certification_completed ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Certified</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600 font-medium">Not Certified</span>
                </>
              )}
            </div>
            {metrics?.ahip_completion_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Completed: {formatDate(new Date(metrics.ahip_completion_date))}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.annual_training_hours || 0}/{metrics?.required_training_hours || 15}
            </div>
            <Progress value={getTrainingProgress()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {getTrainingProgress().toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Required Training</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[
                metrics?.cms_marketing_training,
                metrics?.fraud_waste_abuse_training,
                metrics?.privacy_security_training,
                metrics?.state_specific_training
              ].filter(Boolean).length}/4
            </div>
            <Progress value={getRequiredTrainingsCompleted()} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Modules completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Training Modules Status */}
      <Card>
        <CardHeader>
          <CardTitle>Required Training Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "CMS Marketing Guidelines", completed: metrics?.cms_marketing_training, required: true },
              { name: "Fraud, Waste & Abuse", completed: metrics?.fraud_waste_abuse_training, required: true },
              { name: "Privacy & Security", completed: metrics?.privacy_security_training, required: true },
              { name: "State-Specific Training", completed: metrics?.state_specific_training, required: true }
            ].map((module, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {module.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <div className="font-medium">{module.name}</div>
                    {module.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                </div>
                <Badge variant={module.completed ? "default" : "secondary"}>
                  {module.completed ? "Complete" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.slice(0, 5).map((deadline, index) => {
              const daysUntil = getDaysUntil(deadline.dueDate);
              return (
                <Alert key={index} className={getPriorityColor(deadline.priority)}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{deadline.type}</div>
                        <div className="text-sm">{deadline.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatDate(deadline.dueDate)}</div>
                        <div className="text-xs">
                          {daysUntil > 0 ? `${daysUntil} days left` : 'Overdue'}
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!metrics?.ahip_certification_completed && (
            <div className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium">Complete AHIP Certification</div>
                  <div className="text-sm text-muted-foreground">Required for Medicare selling</div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Start Certification
              </Button>
            </div>
          )}

          {metrics && metrics.annual_training_hours < metrics.required_training_hours && (
            <div className="flex items-center justify-between p-3 border rounded-lg border-yellow-200 bg-yellow-50">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium">Complete Training Hours</div>
                  <div className="text-sm text-muted-foreground">
                    {metrics.required_training_hours - metrics.annual_training_hours} hours remaining
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                View Courses
              </Button>
            </div>
          )}

          {metrics && !metrics.cms_marketing_training && (
            <div className="flex items-center justify-between p-3 border rounded-lg border-blue-200 bg-blue-50">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">CMS Marketing Guidelines</div>
                  <div className="text-sm text-muted-foreground">Required training module</div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Start Training
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceDashboard;