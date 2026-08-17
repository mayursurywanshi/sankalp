import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/sankalp-logo.png";
import { ButtonLink } from "../button/ButtonLink";
import "./Header.css";

const navigation = [
  ["Home", "/"], ["About Us", "/about"], ["Services", "/services"],
  ["Child Development", "/child-development"], ["Testimonials", "/testimonials"],
  ["Success Stories", "/success-stories"], ["Contact Us", "/contact"],
] as const;

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" to="/" aria-label="Sankalp home">
          <img src={logo} alt="Sankalp Child Development Center" />
        </Link>
        <button className="menu-toggle" type="button" aria-label="Toggle navigation"
          aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
          <span /><span /><span />
        </button>
        <nav className={isOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
          {navigation.map(([label, path], index) => (
            <NavLink className={({ isActive }) => isActive ? "active" : undefined}
              end={index === 0} to={path} key={label} onClick={() => setIsOpen(false)}>{label}</NavLink>
          ))}
          <ButtonLink href="#appointment" size="small" onClick={() => setIsOpen(false)}>
            Book Appointment
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
};
