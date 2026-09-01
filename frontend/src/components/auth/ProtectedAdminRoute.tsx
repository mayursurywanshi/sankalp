import { PropsWithChildren, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { clearAccessToken, getAccessToken } from "../../pages/login/auth-storage";
import { verifyAdminSession } from "../../pages/admin/admin-dashboard.service";

type GuardState = "checking" | "allowed" | "denied";

export const ProtectedAdminRoute = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setState("denied");
      return;
    }

    let active = true;
    verifyAdminSession()
      .then((user) => {
        if (!active) return;
        if (user?.role === "ADMIN") setState("allowed");
        else {
          clearAccessToken();
          setState("denied");
        }
      })
      .catch(() => {
        if (!active) return;
        clearAccessToken();
        setState("denied");
      });

    return () => { active = false; };
  }, []);

  if (state === "checking") {
    return <main className="admin-auth-loading" role="status" aria-live="polite"><span />Verifying secure session…</main>;
  }
  if (state === "denied") return <Navigate to="/login" replace />;
  return <>{children}</>;
};
