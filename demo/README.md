# react-earth-demo

This demo showcases a practical example of how to use the **react-earth** library,
a React-based solution for rendering interactive globe visualizations.

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
