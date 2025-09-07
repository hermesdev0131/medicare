import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import ContentCreatorDashboard from "./pages/ContentCreatorDashboard";
import EmailConfirmation from "./pages/EmailConfirmation";
import AgentResourceHQ from "./pages/AgentResourceHQ";
import AdminDashboard from "./pages/AdminDashboard";
import InstructionalDesignerDashboard from "./pages/InstructionalDesignerDashboard";
import FacilitatorDashboard from "./pages/FacilitatorDashboard";
import NotFound from "./pages/NotFound";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import AIContentTools from "./pages/AIContentTools";
import NewsletterArchive from "./pages/NewsletterArchive";
import ContentReader from "./pages/ContentReader";
import AuthorDashboard from "./pages/AuthorDashboard";
import AuthorStudio from "./pages/AuthorStudio";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import CourseEditor from "./pages/CourseEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/subscription-success" element={<SubscriptionSuccess />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/content-creator" element={<ContentCreatorDashboard />} />
        <Route path="/ai-content-tools" element={
          <ProtectedRoute>
            <AIContentTools />
          </ProtectedRoute>
        } />
        <Route path="/email-confirmation" element={<EmailConfirmation />} />
        <Route path="/agent-hq" element={
          <ProtectedRoute requireSubscription={true}>
            <AgentResourceHQ />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/instructional-designer" element={
          <ProtectedRoute>
            <InstructionalDesignerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/facilitator" element={
          <ProtectedRoute>
            <FacilitatorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/newsletter-archive" element={<NewsletterArchive />} />
        <Route path="/content/:slug" element={<ContentReader />} />
        <Route path="/author-dashboard" element={
          <ProtectedRoute>
            <AuthorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/author-studio" element={
          <ProtectedRoute>
            <AuthorStudio />
          </ProtectedRoute>
        } />
        <Route path="/analytics-dashboard" element={
          <ProtectedRoute>
            <AnalyticsDashboard />
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId/editor" element={
          <ProtectedRoute>
            <CourseEditor />
          </ProtectedRoute>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
