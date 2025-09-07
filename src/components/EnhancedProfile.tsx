import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Shield, 
  Award, 
  Clock, 
  Building, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Camera,
  Upload,
  Save,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CertificationsManagement from "./CertificationsManagement";
import VerificationBadges from "./VerificationBadges";

interface ProfileData {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone_number: string | null;
  company_name: string | null;
  position_title: string | null;
  npn: string;
  license_state: string | null;
  license_number: string | null;
  avatar_url: string | null;
  bio: string | null;
  profile_completion_percentage: number;
  profile_completed: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  npn_verified: boolean;
  verification_badges: any[];
  created_at: string;
  updated_at: string;
}

interface ComplianceData {
  id?: string;
  user_id: string;
  compliance_year: number;
  ahip_certification_completed: boolean;
  ahip_completion_date: string | null;
  annual_training_hours: number;
  required_training_hours: number;
  cms_marketing_training: boolean;
  fraud_waste_abuse_training: boolean;
  privacy_security_training: boolean;
  state_specific_training: boolean;
  compliance_score: number;
  last_updated: string;
}

interface EnhancedProfileProps {
  userId: string;
  onUpdate?: () => void;
}

const EnhancedProfile = ({ userId, onUpdate }: EnhancedProfileProps) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    companyName: "",
    positionTitle: "",
    licenseState: "",
    licenseNumber: "",
    bio: ""
  });

  const [complianceForm, setComplianceForm] = useState({
    ahipCompleted: false,
    ahipDate: "",
    trainingHours: 0,
    cmsTraining: false,
    fraudTraining: false,
    privacyTraining: false,
    stateTraining: false
  });

  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
    "Wisconsin", "Wyoming"
  ];

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        // Ensure we have a complete profile object with all required fields
        const completeProfile = {
          ...profileData,
          profile_completion_percentage: (profileData as any).profile_completion_percentage || 0,
          verification_badges: Array.isArray(profileData.verification_badges) 
            ? profileData.verification_badges 
            : []
        };
        setProfile(completeProfile as ProfileData);
        setFormData({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          phoneNumber: profileData.phone_number || "",
          companyName: profileData.company_name || "",
          positionTitle: profileData.position_title || "",
          licenseState: profileData.license_state || "",
          licenseNumber: profileData.license_number || "",
          bio: profileData.bio || ""
        });
      }

      // Load compliance data
      const { data: complianceData, error: complianceError } = await supabase
        .from('medicare_compliance')
        .select('*')
        .eq('user_id', userId)
        .eq('compliance_year', new Date().getFullYear())
        .single();

      if (complianceError && complianceError.code !== 'PGRST116') {
        console.error('Compliance error:', complianceError);
      }

      if (complianceData) {
        setCompliance(complianceData);
        setComplianceForm({
          ahipCompleted: complianceData.ahip_certification_completed,
          ahipDate: complianceData.ahip_completion_date || "",
          trainingHours: complianceData.annual_training_hours,
          cmsTraining: complianceData.cms_marketing_training,
          fraudTraining: complianceData.fraud_waste_abuse_training,
          privacyTraining: complianceData.privacy_security_training,
          stateTraining: complianceData.state_specific_training
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        company_name: formData.companyName,
        position_title: formData.positionTitle,
        license_state: formData.licenseState,
        license_number: formData.licenseNumber,
        bio: formData.bio,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

      await loadProfileData();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateCompliance = async () => {
    try {
      setSaving(true);

      // Calculate compliance score
      const scoreResponse = await supabase.rpc('calculate_medicare_compliance_score', {
        ahip_completed: complianceForm.ahipCompleted,
        training_hours: complianceForm.trainingHours,
        required_hours: 15,
        cms_training: complianceForm.cmsTraining,
        fraud_training: complianceForm.fraudTraining,
        privacy_training: complianceForm.privacyTraining,
        state_training: complianceForm.stateTraining
      });

      const complianceData = {
        user_id: userId,
        compliance_year: new Date().getFullYear(),
        ahip_certification_completed: complianceForm.ahipCompleted,
        ahip_completion_date: complianceForm.ahipDate || null,
        annual_training_hours: complianceForm.trainingHours,
        required_training_hours: 15,
        cms_marketing_training: complianceForm.cmsTraining,
        fraud_waste_abuse_training: complianceForm.fraudTraining,
        privacy_security_training: complianceForm.privacyTraining,
        state_specific_training: complianceForm.stateTraining,
        compliance_score: scoreResponse.data || 0,
        last_updated: new Date().toISOString()
      };

      const { error } = compliance?.id 
        ? await supabase
            .from('medicare_compliance')
            .update(complianceData)
            .eq('id', compliance.id)
        : await supabase
            .from('medicare_compliance')
            .insert(complianceData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance data updated successfully"
      });

      await loadProfileData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update compliance data",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      await loadProfileData();
      toast({
        title: "Success",
        description: "Avatar updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    return `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase();
  };

  const getComplianceStatus = () => {
    const score = compliance?.compliance_score || 0;
    if (score >= 90) return { status: "excellent", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 75) return { status: "good", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 60) return { status: "needs improvement", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { status: "critical", color: "text-red-600", bg: "bg-red-100" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </div>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    className="hidden"
                    disabled={uploading}
                  />
                </Label>
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile?.first_name && profile?.last_name 
                  ? `${profile.first_name} ${profile.last_name}` 
                  : "Complete Your Profile"}
              </h1>
              <p className="text-muted-foreground">{profile?.position_title || "Medicare Agent"}</p>
              <p className="text-sm text-muted-foreground">{profile?.company_name}</p>
              
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Profile Completion:</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={profile?.profile_completion_percentage || 0} className="w-32" />
                    <span className="text-sm">{profile?.profile_completion_percentage || 0}%</span>
                  </div>
                </div>
                <VerificationBadges profile={profile} compact />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="certifications">Licenses</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your insurance agency"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionTitle">Position Title</Label>
                  <Input
                    id="positionTitle"
                    value={formData.positionTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, positionTitle: e.target.value }))}
                    placeholder="Medicare Specialist"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseState">Primary License State</Label>
                  <Select value={formData.licenseState} onValueChange={(value) => setFormData(prev => ({ ...prev, licenseState: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="Your license number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about your Medicare experience and specialties..."
                  rows={4}
                />
              </div>

              <Button onClick={updateProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getComplianceStatus().color}`}>
                    {Math.round(compliance?.compliance_score || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">out of 100</p>
                  <Badge className={`mt-2 ${getComplianceStatus().bg} ${getComplianceStatus().color}`}>
                    {getComplianceStatus().status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Training Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {compliance?.annual_training_hours || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">of 15 required</p>
                  <Progress 
                    value={((compliance?.annual_training_hours || 0) / 15) * 100} 
                    className="mt-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AHIP Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {compliance?.ahip_certification_completed ? (
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  ) : (
                    <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                  )}
                  <p className="text-sm">
                    {compliance?.ahip_certification_completed ? "Certified" : "Not Certified"}
                  </p>
                  {compliance?.ahip_completion_date && (
                    <p className="text-xs text-muted-foreground">
                      Completed: {new Date(compliance.ahip_completion_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Update Compliance Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AHIP Certification */}
              <div className="space-y-4">
                <h4 className="font-semibold">AHIP Certification</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ahipCompleted"
                    checked={complianceForm.ahipCompleted}
                    onChange={(e) => setComplianceForm(prev => ({ ...prev, ahipCompleted: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="ahipCompleted">AHIP Certification Completed</Label>
                </div>
                {complianceForm.ahipCompleted && (
                  <div className="space-y-2">
                    <Label htmlFor="ahipDate">Completion Date</Label>
                    <Input
                      id="ahipDate"
                      type="date"
                      value={complianceForm.ahipDate}
                      onChange={(e) => setComplianceForm(prev => ({ ...prev, ahipDate: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {/* Training Hours */}
              <div className="space-y-2">
                <Label htmlFor="trainingHours">Annual Training Hours Completed</Label>
                <Input
                  id="trainingHours"
                  type="number"
                  min="0"
                  max="50"
                  value={complianceForm.trainingHours}
                  onChange={(e) => setComplianceForm(prev => ({ ...prev, trainingHours: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              {/* Required Trainings */}
              <div className="space-y-4">
                <h4 className="font-semibold">Required Training Modules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cmsTraining"
                      checked={complianceForm.cmsTraining}
                      onChange={(e) => setComplianceForm(prev => ({ ...prev, cmsTraining: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="cmsTraining">CMS Marketing Guidelines</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="fraudTraining"
                      checked={complianceForm.fraudTraining}
                      onChange={(e) => setComplianceForm(prev => ({ ...prev, fraudTraining: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="fraudTraining">Fraud, Waste & Abuse</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="privacyTraining"
                      checked={complianceForm.privacyTraining}
                      onChange={(e) => setComplianceForm(prev => ({ ...prev, privacyTraining: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="privacyTraining">Privacy & Security</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="stateTraining"
                      checked={complianceForm.stateTraining}
                      onChange={(e) => setComplianceForm(prev => ({ ...prev, stateTraining: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="stateTraining">State-Specific Training</Label>
                  </div>
                </div>
              </div>

              <Button onClick={updateCompliance} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Update Compliance
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <CertificationsManagement />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Activity tracking coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedProfile;