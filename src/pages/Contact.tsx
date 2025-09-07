import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Phone, MapPin, Clock, MessageSquare, Calendar } from 'lucide-react';

// Form validation schema
const contactFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Phone number is required"),
  positionTitle: z.string().min(2, "Position/Title is required"),
  companyName: z.string().min(2, "Company name is required"),
  dbaName: z.string().optional(),
  role: z.enum(["Independent Agent", "Business Leader", "Industry Professional", "Other"]).refine(val => val !== undefined, {
    message: "Please select your role"
  }),
  customRole: z.string().optional(),
  organizationSize: z.string().optional(),
  message: z.string().min(10, "Please provide a brief message")
});
type ContactFormData = z.infer<typeof contactFormSchema>;
const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      positionTitle: "",
      companyName: "",
      dbaName: "",
      role: undefined,
      customRole: "",
      organizationSize: "",
      message: ""
    }
  });
  const watchedRole = form.watch("role");

  // Determine if organization size should be shown
  const shouldShowOrganizationSize = watchedRole === "Business Leader" || watchedRole === "Industry Professional" || watchedRole === "Other";
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.functions.invoke('send-contact-email', {
        body: data
      });
      if (error) throw error;
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours."
      });
      form.reset();
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast({
        title: "Error sending message",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-hero">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get In Touch
          </h1>
          <p className="text-xl text-white/90">
            Ready to transform your Medicare training? We're here to help you succeed.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <Card className="shadow-professional">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Send Us a Message
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* Full Name */}
                    <FormField control={form.control} name="fullName" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    {/* Email and Phone Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="email" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="phoneNumber" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                    </div>

                    {/* Position and Company Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="positionTitle" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Position/Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your position" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="companyName" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                    </div>

                    {/* DBA Name */}
                    <FormField control={form.control} name="dbaName" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>DBA Name (if applicable)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter DBA name if different from company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    {/* Role Selection */}
                    <FormField control={form.control} name="role" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>What best describes you? *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Independent Agent">Independent Agent</SelectItem>
                              <SelectItem value="Business Leader">Business Leader</SelectItem>
                              <SelectItem value="Industry Professional">Industry Professional</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>} />

                    {/* Custom Role Field - Show if "Other" is selected */}
                    {watchedRole === "Other" && <FormField control={form.control} name="customRole" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>Please specify your role</FormLabel>
                            <FormControl>
                              <Input placeholder="Describe your role" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />}

                    {/* Organization Size - Conditional Display */}
                    {shouldShowOrganizationSize && <FormField control={form.control} name="organizationSize" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>Number of Agents in Your Organization</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select organization size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="1-10">1-10</SelectItem>
                                <SelectItem value="11-50">11-50</SelectItem>
                                <SelectItem value="51-100">51-100</SelectItem>
                                <SelectItem value="101-250">101-250</SelectItem>
                                <SelectItem value="250-500">250-500</SelectItem>
                                <SelectItem value="501-1000">501-1000</SelectItem>
                                <SelectItem value="1000+">1000+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>} />}

                    {/* Message */}
                    <FormField control={form.control} name="message" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Message *</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Tell us more about your training needs..." rows={5} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <Button type="submit" variant="hero" size="lg" disabled={isSubmitting} className="w-full text-slate-50">
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              
              {/* Contact Methods */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Mail className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Email</h3>
                      <p className="text-muted-foreground">admin@insurancetraininghq.com</p>
                      <p className="text-sm text-muted-foreground">We respond within 24 hours</p>
                    </div>
                  </div>
                  
                  
                  
                  <div className="flex items-start space-x-4">
                    <MapPin className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Website</h3>
                      <p className="text-muted-foreground">InsuranceTrainingHQ.com</p>
                      <p className="text-sm text-muted-foreground">Access your training portal 24/7</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" size="lg" className="w-full justify-start">
                    <MessageSquare className="h-5 w-5 mr-3" />
                    Chat with AI Assistant
                  </Button>
                  
                  <Button variant="outline" size="lg" className="w-full justify-start">
                    <Calendar className="h-5 w-5 mr-3" />
                    Schedule Consultation with Jay
                  </Button>
                  
                  
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Monday - Friday</span>
                    <span className="text-muted-foreground">9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Saturday</span>
                    <span className="text-muted-foreground">10:00 AM - 2:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sunday</span>
                    <span className="text-muted-foreground">Closed</span>
                  </div>
                  <div className="border-t pt-3 mt-4">
                    <p className="text-sm text-muted-foreground">
                      AI Chatbot available 24/7 for immediate assistance
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Don't wait to transform your Medicare training. Start your free trial today.
          </p>
          <Button variant="hero" size="xl" className="bg-white text-primary hover:bg-white/90">
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <div className="w-full bg-slate-900 py-6 shadow-xl border-t border-slate-800 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-slate-300 font-medium">
              Trusted by thousands of insurance professionals nationwide
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-slate-400">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">Secure & Encrypted</span>
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">NIPR Verified</span>
              </span>
            </div>
            <div className="flex items-center justify-center space-x-6 text-xs">
              <a href="/privacy-policy" className="text-slate-400 hover:text-white transition-colors duration-200 font-medium">
                Privacy Policy
              </a>
              <span className="text-slate-600">|</span>
              <a href="/terms-of-service" className="text-slate-400 hover:text-white transition-colors duration-200 font-medium">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Contact;