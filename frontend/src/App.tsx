import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { ProtectedAdminRoute } from "./components/auth/ProtectedAdminRoute";
import { ProtectedDoctorRoute } from "./components/auth/ProtectedDoctorRoute";
import { PageSkeleton } from "./components/loading/PageSkeleton";

const About = lazy(() =>
  import("./pages/about/About").then((module) => ({ default: module.About })),
);
const BookAppointment = lazy(() =>
  import("./pages/book-appointment/BookAppointment").then((module) => ({
    default: module.BookAppointment,
  })),
);
const ChildDevelopment = lazy(() =>
  import("./pages/child-development/ChildDevelopment").then((module) => ({
    default: module.ChildDevelopment,
  })),
);
const Contact = lazy(() =>
  import("./pages/contact/Contact").then((module) => ({
    default: module.Contact,
  })),
);
const Home = lazy(() =>
  import("./pages/home/Home").then((module) => ({ default: module.Home })),
);
const OurImpact = lazy(() =>
  import("./pages/our-impact/OurImpact").then((module) => ({
    default: module.OurImpact,
  })),
);
const Services = lazy(() =>
  import("./pages/services/Services").then((module) => ({
    default: module.Services,
  })),
);
const Login = lazy(() =>
  import("./pages/login/Login").then((module) => ({ default: module.Login })),
);
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard").then((module) => ({
    default: module.AdminDashboard,
  })),
);
const AdminDoctors = lazy(() =>
  import("./pages/admin/doctors/AdminDoctors").then((module) => ({
    default: module.AdminDoctors,
  })),
);
const DoctorDashboard = lazy(() =>
  import("./pages/doctor/DoctorDashboard").then((module) => ({
    default: module.DoctorDashboard,
  })),
);
const AdminAppointments = lazy(() =>
  import("./pages/admin/appointments/AdminAppointments").then((module) => ({
    default: module.AdminAppointments,
  })),
);
const AdminPatients = lazy(() =>
  import("./pages/admin/patients/AdminPatients").then((module) => ({
    default: module.AdminPatients,
  })),
);
const AdminSuccessStories = lazy(() =>
  import("./pages/admin/success-stories/AdminSuccessStories").then(
    (module) => ({ default: module.AdminSuccessStories }),
  ),
);
const AdminFeedback = lazy(() =>
  import("./pages/admin/feedback/AdminFeedback").then((module) => ({
    default: module.AdminFeedback,
  })),
);
const AdminContactRequests = lazy(() =>
  import("./pages/admin/contact-requests/AdminContactRequests").then(
    (module) => ({ default: module.AdminContactRequests }),
  ),
);
const AdminPerformance = lazy(() =>
  import("./pages/admin/performance/AdminPerformance").then((module) => ({
    default: module.AdminPerformance,
  })),
);
const FeedbackForm = lazy(() =>
  import("./pages/feedback/FeedbackForm").then((module) => ({
    default: module.FeedbackForm,
  })),
);

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageSkeleton cards={4} />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedAdminRoute>
                <AdminDoctors />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <ProtectedAdminRoute>
                <AdminAppointments />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/patients"
            element={
              <ProtectedAdminRoute>
                <AdminPatients />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/success-stories"
            element={
              <ProtectedAdminRoute>
                <AdminSuccessStories />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedAdminRoute>
                <AdminFeedback />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/contact-requests"
            element={
              <ProtectedAdminRoute>
                <AdminContactRequests />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/performance"
            element={
              <ProtectedAdminRoute>
                <AdminPerformance />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/f/:token" element={<FeedbackForm />} />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedDoctorRoute>
                <DoctorDashboard />
              </ProtectedDoctorRoute>
            }
          />
          <Route
            path="*"
            element={
              <SiteLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route
                    path="/book-appointment"
                    element={<BookAppointment />}
                  />
                  <Route
                    path="/child-development"
                    element={<ChildDevelopment />}
                  />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/our-impact" element={<OurImpact />} />
                  <Route path="/services" element={<Services />} />
                </Routes>
              </SiteLayout>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
