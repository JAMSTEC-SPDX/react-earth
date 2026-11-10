type CapabilityCardProps = {
  icon: string;
  title: string;
  description: React.ReactNode;
  examples?: string[];
  footer: string;
};

export default function CapabilityCard({
  icon,
  title,
  description,
  examples,
  footer,
}: CapabilityCardProps) {
  return (
    <article className={"capability-card tone-border"}>
      <div className="capability-title">
        <div className="icon-box tone">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <h3>{title}</h3>
        </div>
      </div>
      <p>{description}</p>
      {examples && (
        <>
          <span className="examples-label">Examples across disciplines</span>
          <div className="tag-list">
            {examples.map((example) => (
              <span className="tag" key={example}>
                {example}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="card-footer">{footer}</div>
    </article>
  );
}
