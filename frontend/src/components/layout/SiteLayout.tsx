import { ReactNode } from "react";
import { Footer } from "../footer/Footer";
import { Header } from "../header/Header";
import "./SiteLayout.css";

interface SiteLayoutProps {
  children: ReactNode;
}

export const SiteLayout = ({ children }: SiteLayoutProps) => (
  <div className="site-layout">
    <Header />
    {children}
    <Footer />
  </div>
);
