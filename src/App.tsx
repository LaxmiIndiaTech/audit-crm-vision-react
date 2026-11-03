import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/components/auth/LoginPage";
import Dashboard from "@/pages/Dashboard";
import Branches from "@/pages/Branches";
import { BranchView, BranchUpload } from "@/components/branches";
import CashNorms from "@/pages/CashNorms";
import { CashNormsUpload, CashNormsView } from "@/components/cash-norms";
import SectionAuditPage from "@/pages/SectionAuditPage";
import Scorecard from "@/pages/Scorecard";
import Feedback from "@/pages/Feedback";
import ScoringMaster from "@/pages/ScoringMaster";
import HolidayMaster from "@/pages/HolidayMaster";
import States from "@/pages/States";
import Cities from "@/pages/Cities";
import Employees from "@/pages/Employees";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="audit-crm-theme">
      <TooltipProvider>
        <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="branches" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <Branches />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="branches/:id" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <BranchView />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="cash-norms"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <CashNorms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="branches/upload"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <BranchUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="cash-norms/upload"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <CashNormsUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="cash-norms/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <CashNormsView />
                  </ProtectedRoute>
                }
              />
              {/* Audit Sections B through G */}
              <Route
                path="operational-aspects"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <SectionAuditPage sectionCode="B" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="customer-management"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <SectionAuditPage sectionCode="C" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="display-regulatory"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <SectionAuditPage sectionCode="D" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="document-management"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <SectionAuditPage sectionCode="E" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin-housekeeping"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <SectionAuditPage sectionCode="F" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="information-security"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <SectionAuditPage sectionCode="G" />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="states" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <States />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="cities" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Cities />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employees" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <Employees />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="scoring-master"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <ScoringMaster />
                  </ProtectedRoute>
                }
              />
              <Route
                path="holiday-master"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <HolidayMaster />
                  </ProtectedRoute>
                }
              />
              <Route
                path="scorecard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <Scorecard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="feedback"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'employee', 'super_admin']}>
                    <Feedback />
                  </ProtectedRoute>
                }
              />
              {/** Settings & Profile removed as not required */}
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
