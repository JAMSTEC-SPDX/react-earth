import { JAMSTEC_URL, GITHUB_URL, NPM_URL } from "../consts";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <span>
          © {new Date().getFullYear()}{" "}
          <a href={JAMSTEC_URL} target="_blank" rel="noreferrer">
            Japan Agency for Marine-Earth Science and Technology (JAMSTEC)
          </a>
          . MIT License.
        </span>
        <div>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span>·</span>
          <a href={NPM_URL} target="_blank" rel="noreferrer">
            npm
          </a>
        </div>
      </div>
    </footer>
  );
}
