import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/layout/SiteLayout";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { About } from "./pages/about/About";
import { BookAppointment } from "./pages/book-appointment/BookAppointment";
import { ChildDevelopment } from "./pages/child-development/ChildDevelopment";
import { Contact } from "./pages/contact/Contact";
import { Home } from "./pages/home/Home";
import { OurImpact } from "./pages/our-impact/OurImpact";
import { Services } from "./pages/services/Services";
import { Login } from "./pages/login/Login";
import { ProtectedAdminRoute } from "./components/auth/ProtectedAdminRoute";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminDoctors } from "./pages/admin/doctors/AdminDoctors";
import { ProtectedDoctorRoute } from "./components/auth/ProtectedDoctorRoute";
import { DoctorDashboard } from "./pages/doctor/DoctorDashboard";
import { AdminAppointments } from "./pages/admin/appointments/AdminAppointments";
import { AdminPatients } from "./pages/admin/patients/AdminPatients";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/admin/doctors" element={<ProtectedAdminRoute><AdminDoctors /></ProtectedAdminRoute>} />
        <Route path="/admin/appointments" element={<ProtectedAdminRoute><AdminAppointments /></ProtectedAdminRoute>} />
        <Route path="/admin/patients" element={<ProtectedAdminRoute><AdminPatients /></ProtectedAdminRoute>} />
        <Route path="/doctor/dashboard" element={<ProtectedDoctorRoute><DoctorDashboard /></ProtectedDoctorRoute>} />
        <Route path="*" element={(
          <SiteLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/book-appointment" element={<BookAppointment />} />
              <Route path="/child-development" element={<ChildDevelopment />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/our-impact" element={<OurImpact />} />
              <Route path="/services" element={<Services />} />
            </Routes>
          </SiteLayout>
        )} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
