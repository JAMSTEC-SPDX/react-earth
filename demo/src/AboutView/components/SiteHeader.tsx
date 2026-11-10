import { GITHUB_URL, NPM_URL } from "../consts";

export default function SiteHeader() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-titles">
          <a className="brand" href="#/" aria-label="react-earth home">
            react-earth
          </a>
        </div>

        <div className="header-actions">
          <a className="header-demo" href="#demo">
            Demo
          </a>
          <a
            className="header-external-link"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            className="header-external-link"
            href={NPM_URL}
            target="_blank"
            rel="noreferrer"
          >
            npm ↗
          </a>
        </div>
      </div>
    </header>
  );
}
