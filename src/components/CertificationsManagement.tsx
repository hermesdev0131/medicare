import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Award, Calendar, Building, ExternalLink, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string | null;
  expiration_date: string | null;
  credential_id: string | null;
  verification_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CertificationForm {
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string;
  credential_id: string;
  verification_url: string;
}

const CertificationsManagement = () => {
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  
  const [form, setForm] = useState<CertificationForm>({
    name: "",
    issuing_organization: "",
    issue_date: "",
    expiration_date: "",
    credential_id: "",
    verification_url: ""
  });

  useEffect(() => {
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('certifications' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertifications(data as any || []);
    } catch (error: any) {
      console.error('Error loading certifications:', error);
      toast({
        title: "Error",
        description: "Failed to load certifications",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      issuing_organization: "",
      issue_date: "",
      expiration_date: "",
      credential_id: "",
      verification_url: ""
    });
    setEditingCert(null);
  };

  const openDialog = (cert?: Certification) => {
    if (cert) {
      setEditingCert(cert);
      setForm({
        name: cert.name,
        issuing_organization: cert.issuing_organization,
        issue_date: cert.issue_date || "",
        expiration_date: cert.expiration_date || "",
        credential_id: cert.credential_id || "",
        verification_url: cert.verification_url || ""
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.issuing_organization.trim()) {
      toast({
        title: "Error",
        description: "Certification name and issuing organization are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const certData = {
        user_id: session.user.id,
        name: form.name.trim(),
        issuing_organization: form.issuing_organization.trim(),
        issue_date: form.issue_date || null,
        expiration_date: form.expiration_date || null,
        credential_id: form.credential_id.trim() || null,
        verification_url: form.verification_url.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (editingCert) {
        const { error } = await supabase
          .from('certifications' as any)
          .update(certData)
          .eq('id', editingCert.id);
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Certification updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('certifications' as any)
          .insert({
            ...certData,
            created_at: new Date().toISOString()
          });
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Certification added successfully"
        });
      }

      await loadCertifications();
      closeDialog();
    } catch (error: any) {
      console.error('Error saving certification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save certification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (certId: string) => {
    if (!confirm("Are you sure you want to delete this certification?")) return;

    try {
      const { error } = await supabase
        .from('certifications' as any)
        .delete()
        .eq('id', certId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Certification deleted successfully"
      });

      await loadCertifications();
    } catch (error: any) {
      console.error('Error deleting certification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete certification",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const isExpiringSoon = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60 && diffDays > 0;
  };

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Professional Certifications</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your professional certifications and credentials
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="text-slate-50">
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingCert ? "Edit Certification" : "Add New Certification"}
              </DialogTitle>
              <DialogDescription>
                {editingCert 
                  ? "Update your certification details below."
                  : "Add a new professional certification or credential to your profile."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Certification Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Life & Health Insurance License"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuing_organization">Issuing Organization *</Label>
                <Input
                  id="issuing_organization"
                  value={form.issuing_organization}
                  onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })}
                  placeholder="e.g., State Department of Insurance"
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiration_date">Expiration Date</Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={form.expiration_date}
                    onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credential_id">Credential/License Number</Label>
                <Input
                  id="credential_id"
                  value={form.credential_id}
                  onChange={(e) => setForm({ ...form, credential_id: e.target.value })}
                  placeholder="e.g., 12345678"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification_url">Verification URL</Label>
                <Input
                  id="verification_url"
                  type="url"
                  value={form.verification_url}
                  onChange={(e) => setForm({ ...form, verification_url: e.target.value })}
                  placeholder="https://..."
                  disabled={loading}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 text-slate-50">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCert ? "Update Certification" : "Add Certification"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {certifications.length === 0 ? (
        <Card className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Certifications Added</h3>
            <p className="text-muted-foreground mb-4">
              Start building your professional profile by adding your certifications and credentials.
            </p>
            <Button onClick={() => openDialog()} className="text-slate-50">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Certification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certifications.map((cert) => {
            const expired = isExpired(cert.expiration_date);
            const expiringSoon = isExpiringSoon(cert.expiration_date);
            
            return (
              <Card key={cert.id} className="bg-card/90 backdrop-blur-md border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{cert.name}</h4>
                          <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                            <Building className="h-4 w-4" />
                            <span>{cert.issuing_organization}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {cert.issue_date && (
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                Issued: {formatDate(cert.issue_date)}
                              </Badge>
                            )}
                            
                            {cert.expiration_date && (
                              <Badge 
                                variant={expired ? "destructive" : expiringSoon ? "default" : "outline"}
                                className="text-xs"
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                {expired ? "Expired" : "Expires"}: {formatDate(cert.expiration_date)}
                              </Badge>
                            )}
                            
                            {cert.credential_id && (
                              <Badge variant="secondary" className="text-xs">
                                ID: {cert.credential_id}
                              </Badge>
                            )}
                          </div>

                          {(expired || expiringSoon) && (
                            <Alert className={`mb-3 ${expired ? 'border-destructive' : 'border-yellow-500'}`}>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                {expired 
                                  ? "This certification has expired. Consider renewing it."
                                  : "This certification expires soon. Consider renewing it."
                                }
                              </AlertDescription>
                            </Alert>
                          )}

                          {cert.verification_url && (
                            <a
                              href={cert.verification_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Verify Certificate
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(cert)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cert.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {certifications.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Keep your certifications up to date to maintain professional credibility
          </p>
        </div>
      )}
    </div>
  );
};

export default CertificationsManagement;