# react-earth

This project is a React and TypeScript reimplementation of the brilliant [Cambecc/earth](https://github.com/cambecc/earth) project created by Cameron Beccario.

![demo](./docs/demo.gif)

The data visualization logic remains largely the same and relies on SVG/D3, WebGL and canvas for rendering.

This repository is organized as a monorepo containing:

- `lib`: the reusable `react-earth` library intended for publication on npm
- `demo`: a demonstration application showcasing how to use the library

If you want to customize the demo application for your own use cases, see [`demo/README.md`](https://github.com/JAMSTEC-SPDX/react-earth/tree/main/demo) for more information.

This project was sponsored by the Japan Agency for Marine-Earth Science and
Technology (JAMSTEC), which studies climate and works on forecasting it.

## Architecture of lib

- React handles UI and application state.
- d3-geo computes projections and map geometry.
- WebGL renders the scalar data overlay.
- Canvas is used for particle-based vector field animation.

## Installation & basic usage

First, install the library in your React project:

```bash
npm install react-earth
```

Then use the Earth component in your application:

```tsx
import Earth, { GlobeController } from "react-earth";
import "react-earth/dist/index.css";

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

## Current status

The API is still evolving and may change before the first stable release.
