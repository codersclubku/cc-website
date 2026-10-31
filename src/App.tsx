import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { motion } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SkipLink } from './components/SkipLink';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BottomTabBar } from './components/BottomTabBar';
import { Loader } from './components/Loader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useReducedMotion } from './hooks/useReducedMotion';
import { CursorProvider } from './components/cursor/CursorProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingReportButton } from './components/feedback/FloatingReportButton';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Events = lazy(() => import('./pages/Events').then((m) => ({ default: m.Events })));
const EventDetail = lazy(() => import('./pages/EventDetail').then((m) => ({ default: m.EventDetail })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Projects = lazy(() => import('./pages/Projects').then((m) => ({ default: m.Projects })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })));
const Team = lazy(() => import('./pages/Team').then((m) => ({ default: m.Team })));
const Gallery = lazy(() => import('./pages/Gallery').then((m) => ({ default: m.Gallery })));
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const Feedback = lazy(() => import('./pages/Feedback').then((m) => ({ default: m.Feedback })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

const SignUp = lazy(() => import('./pages/SignUp').then((m) => ({ default: m.SignUp })));
const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const Account = lazy(() => import('./pages/Account').then((m) => ({ default: m.Account })));
const Onboarding = lazy(() => import('./pages/Onboarding').then((m) => ({ default: m.Onboarding })));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents').then((m) => ({ default: m.AdminStudents })));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents').then((m) => ({ default: m.AdminEvents })));
const AdminRegistrations = lazy(() => import('./pages/admin/AdminRegistrations').then((m) => ({ default: m.AdminRegistrations })));
const AdminCheckIn = lazy(() => import('./pages/admin/AdminCheckIn').then((m) => ({ default: m.AdminCheckIn })));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements').then((m) => ({ default: m.AdminAnnouncements })));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects').then((m) => ({ default: m.AdminProjects })));
const AdminTeam = lazy(() => import('./pages/admin/AdminTeam').then((m) => ({ default: m.AdminTeam })));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery').then((m) => ({ default: m.AdminGallery })));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages').then((m) => ({ default: m.AdminMessages })));
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback').then((m) => ({ default: m.AdminFeedback })));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

const PublicLayout: React.FC = () => {
  const location = useLocation();
  const prefersReduced = useReducedMotion();
  const isEventDetailOrRegister = location.pathname.startsWith('/events/') || location.pathname === '/register';

  return (
    <div
      data-cursor-hide-native
      className="min-h-[100dvh] flex flex-col bg-[var(--bg)] text-[var(--text)] font-body transition-colors duration-150 overflow-x-clip"
    >
      <SkipLink />
      <Header />
      <main
        id="main-content"
        className={`flex-1 w-full flex flex-col ${isEventDetailOrRegister ? 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0'}`}
        tabIndex={-1}
      >
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
              <Loader variant="snake" delayMs={150} />
            </div>
          }
        >
          <motion.div
            key={location.pathname}
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="w-full flex-1 flex flex-col"
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </Suspense>
      </main>
      <Footer />
      <BottomTabBar />
      <FloatingReportButton />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary title="Platform System Error" description="The application encountered an unexpected error. Please try refreshing.">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Analytics />
            <CursorProvider>
              <ScrollToTop />
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:slug" element={<EventDetail />} />
                  <Route path="/events/:slug/register" element={<Register />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:slug" element={<ProjectDetail />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/terms-of-service" element={<Terms />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary title="Onboarding Error">
                          <Onboarding />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute requireStudentPortalAccess>
                        <ErrorBoundary title="Student Account Error">
                          <Account />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route
                  path="/admin"
                  element={
                    <Suspense
                      fallback={
                        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
                          <Loader variant="snake" delayMs={150} />
                        </div>
                      }
                    >
                      <AdminLayout />
                    </Suspense>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="students" element={<AdminStudents />} />
                  <Route path="team" element={<AdminTeam />} />
                  <Route path="events" element={<AdminEvents />} />
                  <Route path="registrations" element={<AdminRegistrations />} />
                  <Route path="check-in" element={<AdminCheckIn />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  <Route path="projects" element={<AdminProjects />} />
                  <Route path="gallery" element={<AdminGallery />} />
                  <Route path="messages" element={<AdminMessages />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                </Route>
              </Routes>
            </CursorProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
