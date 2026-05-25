# react-earth-demo

This demo showcases a practical example of how to use the **@jamstec-spdx/react-earth** library,
a React-based solution for rendering interactive globe visualizations.

## Features

- Orthographic and equirectangular projections
- Overlay rendering from scalar and vector fields
- Particle-based vector field animation
- SVG coastlines and graticules
- Interactive globe rotation and zoom (with support for synchronized globes)
- Marker support
- Compare mode

Feel free to reuse and customize this demo project. Here are a few examples of what can be done:

- customize the Earth menu
- add new datasets or supported fields (currently wind, currents, and temperature)
- customize the color scales
- display multiple synchronized globes side by side

## Climatic data

For demonstration purposes, the application provides two arbitrary climatic datasets:

- a wind vector field dataset,
- a temperature scalar field dataset.

These datasets are only intended to showcase the visualization capabilities of the application
and do not represent real scientific observations or forecasts.

## Map data

Map data is sourced from [Natural Earth](https://www.naturalearthdata.com/) and needs
to be converted to [TopoJSON](https://github.com/topojson/topojson/wiki) format before
being used in this project.

For convenience, 110m resolution coastlines are already included in the `/public/data`
directory.

To build your own `earth-topo` file:

- download the desired dataset from the [Natural Earth website](https://www.naturalearthdata.com/)
- install [GDAL](https://gdal.org/en/stable/) and [TopoJSON tools](https://bost.ocks.org/mike/map/#installing-tools)
- run the following commands (replace `50m` with the scale of your choice):

```
unzip -o ne_*.zip
ogr2ogr -f GeoJSON coastlines.json ne_50m_coastline.shp
geo2topo -o earth-topo.json coastlines.json
cp earth-topo*.json <earth-git-repository>/public/data/
```

Keep in mind that additional datasets can also be integrated, such as rivers, lakes, or country boundaries, depending on your visualization needs.

## Notes

This demo is intentionally simple and focuses on clarity over completeness. It is designed as a starting point rather than a full-featured implementation, giving you a clean foundation to build upon and adapt to your own use cases.
