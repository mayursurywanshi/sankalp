import { useEffect, useState } from "react";
import logo from "../../assets/sankalp-logo.webp";
import {
  fetchPublicSettings,
  PublicSettings,
} from "../../services/public-settings.service";
import { FOOTER_CONTENT } from "./footer.constants";
import "./Footer.css";

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11 11 0 0 0 3.5 1.1 1 1 0 0 1 .8 1v3.4a1 1 0 0 1-1 1A18.2 18.2 0 0 1 2.5 4.3a1 1 0 0 1 1-1h3.4a1 1 0 0 1 1 .8A11 11 0 0 0 9 7.6a1 1 0 0 1-.2 1l-2.2 2.2Z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" className="social-dot" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.6Z" />
    <path d="M9 8.5c.5 2.8 2 4.4 4.8 5.2M9.1 8.5l1.2 2-1 1M13.8 13.7l1-1 2 1.1" />
  </svg>
);

const SocialIcon = ({ label }: { label: string }) =>
  label === "Instagram" ? <InstagramIcon /> : <WhatsAppIcon />;

export const Footer = () => {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  useEffect(() => {
    void fetchPublicSettings()
      .then(setSettings)
      .catch(() => undefined);
  }, []);
  const contact = {
    phone: settings?.phone || FOOTER_CONTENT.contact.phone,
    email: settings?.email || FOOTER_CONTENT.contact.email,
    address: settings?.address || FOOTER_CONTENT.contact.address,
  };
  const socialLinks = [
    {
      label: "Instagram",
      path: settings?.instagramUrl || FOOTER_CONTENT.socialLinks[0].path,
    },
    {
      label: "WhatsApp",
      path: settings?.whatsapp
        ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=Hello%20Sankalp%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.`
        : FOOTER_CONTENT.socialLinks[1].path,
    },
  ];
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <a href="/" aria-label="Sankalp home">
            <img
              src={logo}
              alt="Sankalp Child Development Center"
              loading="lazy"
              decoding="async"
            />
          </a>
          <p>{FOOTER_CONTENT.description}</p>
        </div>

        <div className="footer-column">
          <h2>Quick Links</h2>
          {FOOTER_CONTENT.quickLinks.map((link) => (
            <a href={link.path} key={link.label}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="footer-column">
          <h2>Important Links</h2>
          {FOOTER_CONTENT.importantLinks.map((link) => (
            <a href={link.path} key={link.label}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="footer-column footer-contact">
          <h2>Contact Us</h2>
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
            <PhoneIcon />
            {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`}>
            <MailIcon />
            {contact.email}
          </a>
          <p>
            <PinIcon />
            {contact.address}
          </p>
        </div>

        <div className="footer-column footer-social">
          <h2>Follow Us</h2>
          <div>
            {socialLinks.map((social) => (
              <a
                href={social.path}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
                key={social.label}
              >
                <SocialIcon label={social.label} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <p className="footer-copyright">{FOOTER_CONTENT.copyright}</p>
    </footer>
  );
};
