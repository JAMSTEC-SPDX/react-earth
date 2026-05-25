# react-earth

This project is a React and TypeScript reimplementation of the brilliant [Cambecc/earth](https://github.com/cambecc/earth) project created by Cameron Beccario.

![demo](./docs/demo.gif)

The data visualization logic remains largely the same and relies on SVG/D3, WebGL and canvas for rendering.

This repository is organized as a monorepo containing:

- `lib`: the reusable `@jamstec-spdx/react-earth` library intended for publication on npm
- `demo`: a demonstration application showcasing how to use the library

If you want to customize the demo application for your own use cases, see [`demo/README.md`](https://github.com/JAMSTEC-SPDX/react-earth/tree/main/demo) for more information.

The development of this project was lead by the
[Japan Agency for Marine-Earth Science and Technology (JAMSTEC)](https://www.jamstec.go.jp/e/),
which studies climate and works on forecasting it.

## Project installation & development

Run the library watcher and demo app:

```bash
git clone https://github.com/JAMSTEC-SPDX/react-earth
cd react-earth
npm install
npm run dev
```

## Lib installation & basic usage

First, install the library in your React project:

```bash
npm install @jamstec-spdx/react-earth
```

Then use the Earth component in your application:

```tsx
import Earth, { GlobeController } from "@jamstec-spdx/react-earth";
import "@jamstec-spdx/react-earth/dist/index.css";

const globeController = new GlobeController();

const Component = () => (
  <Earth
    globeController={globeController}
    projection="ortho"
    overlayToolBox={overlayToolBox}
    getColor={getColor}
  />
);
```

`overlayToolBox` should contain the gridded scalar or vector field data to render on the globe and
`getColor` is a function that maps a field value from `overlayToolBox` to the color used for rendering.

For a more complete example, including data loading, streams, markers, and compare mode, see the
demo application in the [demo directory](https://github.com/JAMSTEC-SPDX/react-earth/tree/main/demo).

## Implementation details

Please refer to [`lib/README.md`](https://github.com/JAMSTEC-SPDX/react-earth/tree/main/lib) for more information.

## Release process

The `@jamstec-spdx/react-earth` package is automatically published to npm through GitHub Actions when a new GitHub release is created.

To publish a new version:

1. create and push a version tag:

```bash
git tag v0.0.X
git push origin v0.0.X
```

2. create a new GitHub release associated with this tag.

The CI pipeline will then automatically:

- build the library,
- update the package version,
- publish the package to npm.

## Current status

The API is still evolving and may change before the first stable release.
