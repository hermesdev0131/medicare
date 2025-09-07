import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Shield, Award, Clock, AlertTriangle, CheckCircle, Calendar, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComplianceData {
  compliance_score: number;
  ahip_certification_completed: boolean;
  ahip_completion_date: string | null;
  annual_training_hours: number;
  required_training_hours: number;
  cms_marketing_training: boolean;
  fraud_waste_abuse_training: boolean;
  privacy_security_training: boolean;
  state_specific_training: boolean;
  last_updated: string;
}

const MedicareComplianceWidget = () => {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('medicare_compliance')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('compliance_year', new Date().getFullYear())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setComplianceData(data);
      } else {
        // Create default compliance record
        const defaultData = {
          user_id: session.user.id,
          compliance_year: new Date().getFullYear(),
          ahip_certification_completed: false,
          ahip_completion_date: null,
          annual_training_hours: 0,
          required_training_hours: 15,
          cms_marketing_training: false,
          fraud_waste_abuse_training: false,
          privacy_security_training: false,
          state_specific_training: false,
          compliance_score: 0,
          last_updated: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('medicare_compliance')
          .insert(defaultData);

        if (!insertError) {
          setComplianceData(defaultData);
        }
      }
    } catch (error: any) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 75) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getComplianceLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Critical';
  };

  const getRemainingRequirements = () => {
    if (!complianceData) return [];
    
    const requirements = [];
    
    if (!complianceData.ahip_certification_completed) {
      requirements.push('Complete AHIP Certification');
    }
    
    if (complianceData.annual_training_hours < complianceData.required_training_hours) {
      const remaining = complianceData.required_training_hours - complianceData.annual_training_hours;
      requirements.push(`Complete ${remaining} more training hours`);
    }
    
    const missingTrainings = [];
    if (!complianceData.cms_marketing_training) missingTrainings.push('CMS Marketing');
    if (!complianceData.fraud_waste_abuse_training) missingTrainings.push('Fraud & Abuse');
    if (!complianceData.privacy_security_training) missingTrainings.push('Privacy & Security');
    if (!complianceData.state_specific_training) missingTrainings.push('State Training');
    
    if (missingTrainings.length > 0) {
      requirements.push(`Complete ${missingTrainings.join(', ')} training`);
    }
    
    return requirements;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-blue-200 rounded w-1/2"></div>
            <div className="h-8 bg-blue-200 rounded"></div>
            <div className="h-2 bg-blue-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = complianceData?.compliance_score || 0;
  const requirements = getRemainingRequirements();

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Shield className="h-5 w-5" />
          Medicare Compliance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className={`p-4 rounded-lg border ${getScoreBg(score)}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">Overall Compliance</div>
              <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {Math.round(score)}%
              </div>
              <Badge className={`mt-1 ${getScoreBg(score)} ${getScoreColor(score)}`}>
                {getComplianceLevel(score)}
              </Badge>
            </div>
            {score >= 90 ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            )}
          </div>
        </div>

        {/* AHIP Status */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">AHIP Certification</span>
          </div>
          <Badge className={complianceData?.ahip_certification_completed 
            ? "bg-green-100 text-green-700" 
            : "bg-red-100 text-red-700"}>
            {complianceData?.ahip_certification_completed ? "Current" : "Required"}
          </Badge>
        </div>

        {/* Training Hours */}
        {complianceData && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Annual Training</span>
              </div>
              <span className="text-sm text-blue-700">
                {complianceData.annual_training_hours}/{complianceData.required_training_hours} hrs
              </span>
            </div>
            <Progress 
              value={(complianceData.annual_training_hours / complianceData.required_training_hours) * 100} 
              className="h-2" 
            />
          </div>
        )}

        {/* Upcoming Requirements */}
        {requirements.length > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Action Required</span>
            </div>
            <div className="space-y-1">
              {requirements.slice(0, 2).map((req, index) => (
                <div key={index} className="text-xs text-yellow-700">• {req}</div>
              ))}
              {requirements.length > 2 && (
                <div className="text-xs text-yellow-700">+ {requirements.length - 2} more</div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-blue-700 border-blue-300 hover:bg-blue-50"
          onClick={() => window.location.href = '/profile?tab=compliance'}
        >
          View Full Compliance Dashboard
          <ExternalLink className="h-3 w-3 ml-2" />
        </Button>

        {/* Last Updated */}
        {complianceData?.last_updated && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Calendar className="h-3 w-3" />
            Last updated: {new Date(complianceData.last_updated).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicareComplianceWidget;