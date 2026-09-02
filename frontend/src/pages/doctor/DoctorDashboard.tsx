import { useNavigate } from "react-router-dom";
import logo from "../../assets/sankalp-logo.png";
import { logoutAdmin } from "../admin/admin-dashboard.service";
import "./DoctorDashboard.css";

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const logout = async () => { await logoutAdmin(); navigate("/login", { replace: true }); };
  return <main className="doctor-welcome-page"><section><img src={logo} alt="Sankalp" /><div className="doctor-welcome-icon">🩺</div><small>SECURE DOCTOR ACCESS</small><h1>Welcome to Sankalp</h1><p>Your Doctor login is working successfully. Patient schedules and clinical tools will appear here when the Doctor Dashboard is developed.</p><aside><span>✓</span>Your Doctor session is verified and protected.</aside><button type="button" onClick={() => void logout()}>Logout</button></section></main>;
};
