import { PropsWithChildren, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { verifySession } from "../../pages/admin/admin-dashboard.service";
import { clearAccessToken, getAccessToken } from "../../pages/login/auth-storage";

type GuardState = "checking" | "allowed" | "denied";

export const ProtectedDoctorRoute = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<GuardState>("checking");
  useEffect(() => {
    if (!getAccessToken()) { setState("denied"); return; }
    let active = true;
    verifySession().then((user) => {
      if (!active) return;
      if (user?.role === "DOCTOR") setState("allowed");
      else { clearAccessToken(); setState("denied"); }
    }).catch(() => { if (active) { clearAccessToken(); setState("denied"); } });
    return () => { active = false; };
  }, []);
  if (state === "checking") return <main className="admin-auth-loading" role="status"><span />Verifying Doctor session…</main>;
  if (state === "denied") return <Navigate to="/login" replace />;
  return <>{children}</>;
};
