import { useState } from "react";
import logo from "../../assets/sankalp-logo.png";
import { ButtonLink } from "../button/ButtonLink";
import "./Header.css";

const navigation = [
  ["Home", "#home"], ["About Us", "#about"], ["Services", "#services"],
  ["Gallery", "#gallery"], ["Testimonials", "#testimonials"],
  ["Success Stories", "#stories"], ["Contact Us", "#contact"],
] as const;

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Sankalp home">
        <img src={logo} alt="Sankalp Child Development Center" />
      </a>
      <button className="menu-toggle" type="button" aria-label="Toggle navigation"
        aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
        <span /><span /><span />
      </button>
      <nav className={isOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
        {navigation.map(([label, href], index) => (
          <a className={index === 0 ? "active" : undefined} href={href} key={label}
            onClick={() => setIsOpen(false)}>{label}</a>
        ))}
        <ButtonLink href="#appointment" size="small" onClick={() => setIsOpen(false)}>
          Book Appointment
        </ButtonLink>
      </nav>
    </header>
  );
};
