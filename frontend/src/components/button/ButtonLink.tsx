import { MouseEventHandler, ReactNode } from "react";
import "./ButtonLink.css";

interface ButtonLinkProps {
  children: ReactNode;
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  size?: "default" | "small";
  variant?: "primary" | "outline";
}

export const ButtonLink = ({
  children,
  href,
  onClick,
  size = "default",
  variant = "primary",
}: ButtonLinkProps) => (
  <a
    className={`button-link button-link--${variant} button-link--${size}`}
    href={href}
    onClick={onClick}
  >
    {children}
  </a>
);
