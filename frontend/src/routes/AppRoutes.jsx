import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/auth/Login';
import { RegisterClient } from '../pages/auth/RegisterClient';
import { RegisterAdvocate } from '../pages/auth/RegisterAdvocate';
import { ClientDashboard } from '../pages/client/Dashboard';
import { ClientProfile } from '../pages/client/Profile';
import { ClientDocuments } from '../pages/client/Documents';
import { ClientCases } from '../pages/client/Cases';
import { ClientNotifications } from '../pages/client/Notifications';
import { ClientAdvocateDetails } from '../pages/client/AdvocateDetails';
import { AdvocateProfile } from '../pages/advocate/Profile';
import AdvocateDashboard from '../pages/advocate/AdvocateDashboard';
import { VerificationStatus } from '../pages/advocate/VerificationStatus';
import { SubmitCredentials } from '../pages/advocate/SubmitCredentials';
import { VerificationQueue } from '../pages/admin/VerificationQueue';
import { VerificationDetail } from '../pages/admin/VerificationDetail';
import { CaseManagement } from '../pages/admin/CaseManagement';
import { DocumentReview } from '../pages/admin/DocumentReview';
import { CaseTracking } from '../pages/admin/CaseTracking';
import { RoleManagement } from '../pages/admin/RoleManagement';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ClientLayout } from '../components/layout/ClientLayout';
import { AdvocateLayout } from '../components/layout/AdvocateLayout';

const Landing = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
    <div className="max-w-4xl mx-auto px-4 text-center">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
        NRI Legal & Property Portal
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Connecting NRIs with verified legal professionals in India
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/auth/register/client"
          className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Find a Lawyer
        </a>
        <a
          href="/auth/register/advocate"
          className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
        >
          Join as Advocate
        </a>
      </div>
    </div>
  </div>
);

const AdvocateCaseManagement = CaseManagement;
const AdvocateCaseTracking = CaseTracking;
const AdvocateDocumentReview = DocumentReview;
const AdvocateRoleManagement = RoleManagement;

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-red-600 mb-2">
        Unauthorized
      </h2>
      <p className="text-gray-600 mb-4">
        You do not have permission to access this page.
      </p>
      <a
        href="/auth/login"
        className="text-primary-600 hover:text-primary-700 font-medium"
      >
        Go to Login
      </a>
    </div>
  </div>
);

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Auth Routes */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register/client" element={<RegisterClient />} />
      <Route path="/auth/register/advocate" element={<RegisterAdvocate />} />

      {/* ============ CLIENT ROUTES ============ */}
      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientLayout>
              <ClientDashboard />
            </ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/documents"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientLayout>
              <ClientDocuments />
            </ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/cases"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientLayout>
              <ClientCases />
            </ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/advocate"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientLayout>
              <ClientAdvocateDetails />
            </ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/notifications"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientLayout>
              <ClientNotifications />
            </ClientLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/profile"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientLayout>
              <ClientProfile />
            </ClientLayout>
          </ProtectedRoute>
        }
      />

      {/* Advocate Routes */}
      <Route
        path="/advocate"
        element={
          <ProtectedRoute allowedRoles={['advocate']}>
            <AdvocateLayout>
              <AdvocateDashboard />
            </AdvocateLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/profile"
        element={
          <ProtectedRoute allowedRoles={['advocate']}>
            <AdvocateLayout>
              <AdvocateProfile />
            </AdvocateLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/verification"
        element={
          <ProtectedRoute allowedRoles={['advocate']}>
            <AdvocateLayout>
              <VerificationStatus />
            </AdvocateLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/credentials/submit"
        element={
          <ProtectedRoute allowedRoles={['advocate']}>
            <AdvocateLayout>
              <SubmitCredentials />
            </AdvocateLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/cases"
        element={
          <ProtectedRoute allowedRoles={['advocate']}>
            <AdvocateLayout>
              <AdvocateCaseManagement />
            </AdvocateLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/cases-tracking"
        element={
          <ProtectedRoute allowedRoles={['advocate']}>
            <AdvocateLayout>
              <AdvocateCaseTracking />
            </AdvocateLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/documents"
        element={
          <ProtectedRoute allowedRoles={['advocate']}>
            <AdvocateLayout>
              <AdvocateDocumentReview />
            </AdvocateLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/roles"
        element={
          <ProtectedRoute allowedRoles={['advocate']}>
            <AdvocateLayout>
              <AdvocateRoleManagement />
            </AdvocateLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cases"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <CaseManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cases-tracking"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <CaseTracking />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <DocumentReview />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verification"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <VerificationQueue />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verification/:advocateId"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <VerificationDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <RoleManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
