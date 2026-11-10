import { type PropsWithChildren } from "react";

type SectionHeadingProps = PropsWithChildren<{
  number: string;
  label: string;
  title?: string;
  subtitle?: string;
}>;

export default function SectionHeading({
  number,
  label,
  title,
  subtitle,
  children,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <span className="section-kicker">
        {number} — {label}
      </span>
      {title && <h2>{title}</h2>}
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      {children && <div className="section-description">{children}</div>}
    </div>
  );
}
