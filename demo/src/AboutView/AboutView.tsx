import CapabilityCard from "./components/CapabilityCard";
import CodeBlock from "./components/CodeBlock";
import PrincipleCard from "./components/PrincipleCard";
import SectionHeading from "./components/SectionHeading";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import { GITHUB_URL } from "./consts";
import "./styles.scss";

const principles = [
  {
    icon: "public",
    title: "General-purpose by design",
    description:
      "react-earth is not tied to a particular scientific discipline. It provides a common visualization environment for different kinds of geospatial data.",
    footer: "Discipline-agnostic environment",
  },
  {
    icon: "dataset",
    title: "Data-driven",
    description:
      "react-earth offers customizable rendering, allowing users to visualize their own geospatial datasets and adapt their visual representation to their needs.",
    footer: "User-defined color and form",
  },
  {
    icon: "code_blocks",
    title: "Open and extensible",
    description:
      "The library provides a foundation that users can integrate into their applications and extend to meet their specific requirements.",
    footer: "MIT license · Open source",
  },
];

const installCommand = "npm install @jamstec-spdx/react-earth";

const usageCode = `import React from "react";
import Earth, { GlobeController } from "@jamstec-spdx/react-earth";
import "@jamstec-spdx/react-earth/dist/index.css";

// Create a controller for globe interaction.
const globeController = new GlobeController();

export default function App() {
  return (
    <div className="earth-container">
      <Earth
        globeController={globeController}
        projection="ortho"
        overlayToolBox={overlayToolBox}
        getColor={getColor}
      />
    </div>
  );
}`;

function Hero() {
  return (
    <section className="hero" id="overview">
      <div className="hero-glow" />
      <div className="hero-content">
        <div className="eyebrow-pill">
          <span className="status-dot" />
          Open source · General-purpose geospatial visualization
        </div>
        <h1>Visualize Any Geospatial Field.</h1>
        <p className="hero-subtitle">
          Explore spatial data across disciplines with an interactive 3D globe.
        </p>
        <p className="hero-lead">
          An open-source React library for exploring spatial data on an
          interactive 3D globe. From biodiversity and population distributions
          to environmental observations and physical phenomena, visualize
          geospatial fields from a new perspective.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#demo">
            <span className="material-symbols-outlined">play_arrow</span>
            Explore the demo
          </a>
          <a
            className="button button-secondary"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
          >
            <span className="github-mark" aria-hidden="true">
              ⌘
            </span>
            View on GitHub
          </a>
        </div>

        <div className="viewport">
          <div className="viewport-bar">
            <div className="window-controls">
              <i />
              <i />
              <i />
            </div>
            <span className="viewport-title">&lt;Earth /&gt;</span>
            <span className="viewport-meta">projection="ortho"</span>
          </div>
          <div className="hero-image-wrap">
            <img
              src="https://raw.githubusercontent.com/JAMSTEC-SPDX/react-earth/main/docs/demo.png"
              alt="Interactive globe showing a geospatial data visualization"
            />
            <span className="image-watermark">
              <span className="status-dot" /> JAMSTEC / react-earth
            </span>
          </div>
          <div className="viewport-caption">
            <span>Scalar field overlays · Vector fields</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrinciplesSection() {
  return (
    <section className="principles-section" id="philosophy">
      <div className="container">
        <SectionHeading
          number="01"
          label="General-purpose by design"
          title="A universal visual medium for spatially distributed data."
        >
          react-earth is not tied to a particular scientific discipline. It does
          not impose domain-specific assumptions or interpretations on your
          datasets. Users bring their own data and decide how values are
          translated into color and form.
        </SectionHeading>

        <div className="card-grid grid-3 principles">
          {principles.map((item) => (
            <PrincipleCard key={item.title} {...item} />
          ))}
        </div>

        <div className="capabilities-section">
          <div className="section-description">
            react-earth allows users to visualize scalar fields and animated
            vector fields on one or more synchronized globes.
          </div>
          <div className="card-grid grid-2 capabilities-grid">
            <CapabilityCard
              icon="gradient"
              title="Scalar Fields"
              description="Represent geographically distributed numerical values through colors, continuous gradients, and spatial patterns across the planetary surface."
              examples={[
                "Species distribution",
                "Biodiversity indicators",
                "Population density",
                "Sea surface temperature",
                "Pollution concentration",
                "Vegetation indices",
                "Environmental measurements",
              ]}
              footer="Continuous spatial field"
            />
            <CapabilityCard
              icon="air"
              title="Vector Fields"
              description="Represent quantities with both magnitude and direction across geographical space."
              examples={[
                "Ocean currents",
                "Wind velocity",
                "Animal movement patterns",
                "Surface displacement",
                "Geophysical vector fields",
              ]}
              footer="Magnitude and direction"
            />

            <CapabilityCard
              icon="compare"
              title="Multiple Datasets & Comparison"
              description={
                <>
                  Display multiple globes simultaneously, with synchronized or
                  independent views, to easily compare different datasets.
                  <br />
                  <br />
                  This makes it possible to explore changes over time or examine
                  relationships between different variables side by side.
                </>
              }
              footer="Explore and compare spatial data"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function GettingStartedSection() {
  return (
    <section className="getting-started-section" id="getting-started">
      <div className="container">
        <SectionHeading
          number="03"
          label="Getting started"
          title="Add an interactive globe to your React application."
          subtitle="Install the package and use the Earth component in your project."
        />
        <div className="code-stack">
          <CodeBlock title="1. Install the npm package" code={installCommand} />
          <CodeBlock
            title="2. Import and mount the component"
            code={usageCode}
          />
        </div>
      </div>
    </section>
  );
}

function ComponentSection() {
  const items = [
    [
      "<Earth />",
      "Main React component",
      "The component used to render the interactive globe. It receives the visualization configuration and the data to display.",
    ],
    [
      "GlobeController",
      "Globe interaction",
      "A controller instance passed to the Earth component to manage globe interaction.",
    ],
    [
      "overlayToolBox",
      "Visualization data",
      "The data supplied to the component for the spatial visualization.",
    ],
    [
      "getColor(value)",
      "Value-to-color mapping",
      "A function supplied by the application to define how scalar values are translated into colors.",
    ],
  ];
  return (
    <section className="section-alt api-section" id="component-api">
      <div className="container">
        <SectionHeading
          number="04"
          label="Understanding the component"
          title="Separating data, visualization, and interaction."
        >
          react-earth provides a React component and related configuration
          properties that let an application supply spatial data and define how
          it should be represented.
        </SectionHeading>
        <div className="card-grid grid-2 api-grid">
          {items.map(([code, title, description]) => (
            <article className="api-card" key={code}>
              <div className="api-top">
                <code className="tone-text">{code}</code>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    [
      "01",
      "Prepare your data",
      "Prepare the spatial dataset in a structure compatible with the library.",
    ],
    [
      "02",
      "Configure the visualization",
      "Choose the visualization settings and define how scalar values should be mapped to colors.",
    ],
    [
      "03",
      "Pass data to react-earth",
      "Provide the data and configuration to the Earth component through its props.",
    ],
    [
      "04",
      "Explore the globe",
      "Use the interactive globe to explore the geographical distribution of your data.",
    ],
  ];
  return (
    <section className="workflow-section" id="workflow">
      <div className="container">
        <SectionHeading
          number="02"
          label="Workflow"
          title="From spatial data to visualization."
        />
        <div className="card-grid grid-4 workflow">
          {steps.map(([number, title, description]) => (
            <article className="step-card" key={number}>
              <span className="step-number tone-text">STEP {number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function UnderTheHoodSection() {
  return (
    <section className="section-alt under-hood-section" id="under-the-hood">
      <div className="container">
        <SectionHeading number="05" label="Credits" />
        <div>
          <p>
            react-earth is inspired by the{" "}
            <a
              href="https://earth.nullschool.net"
              target="_blank"
              rel="noreferrer"
            >
              Earth project created by Cameron Beccario
            </a>
            , known for its interactive global visualizations.
          </p>
          <p>
            react-earth adapts this inspiration into a reusable component for
            React applications, with a TypeScript-oriented development
            experience.
          </p>
          <p>
            This library is developed and maintained by the{" "}
            <a
              href="https://www.jamstec.go.jp/e/"
              target="_blank"
              rel="noreferrer"
            >
              Japan Agency for Marine-Earth Science and Technology (JAMSTEC)
            </a>
            .
          </p>
          <p>
            For implementation details and the exact capabilities of the current
            release, consult the source code and documentation in the project
            repository.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function AboutView() {
  return (
    <div className="documentation-page">
      <SiteHeader />
      <main>
        <Hero />
        <PrinciplesSection />
        <WorkflowSection />
        <GettingStartedSection />
        <ComponentSection />
        <UnderTheHoodSection />
      </main>
      <SiteFooter />
    </div>
  );
}
