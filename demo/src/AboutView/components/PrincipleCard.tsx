type PrincipleCardProps = {
  icon: string;
  title: string;
  description: string;
  footer: string;
};

export default function PrincipleCard({
  icon,
  title,
  description,
  footer,
}: PrincipleCardProps) {
  return (
    <article className="principle-card">
      <div>
        <div className={`icon-box tone`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="card-footer">{footer}</div>
    </article>
  );
}
