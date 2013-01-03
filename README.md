# MapBox OSM Boundaries

This program will download, process, and import OSM boundary relations optimized for rendering. Main features:

- No polygons are built. Boundary relation way members are imported as linestrings. They acquire tagging information from their parent relations. The lowest `admin_level` value of any parent relations will be the `admin_level` value of the linestring.
- Various tag combinations are checked to see if each way is a maritime boundary. This information is simplified to a single `maritime` field with a value of either `0` (false) or `1` (true).
- Various tag combinations are checked to see if each way is a disputed boundary. This information is simplified to a single `disputed` field with a value of either `0` (false) or `1` (true).
- Geometries are imported to a Spherical Mercator projection (900913).

## Dependencies

- bash
- [PostgreSQL](http://postgresql.org) (tested with 9.2)
- [PostGIS](http://postgis.refractions.net) (tested with 2.0)
- [Osmium](http://github.com/joto/osmium/) - make sure `osmjs` is compiled and in your PATH

## Running

1. Adjust database parameters, etc, if necessary at the top of `build.sh`
2. Run `build.sh`. This will take at least several minutes while the data is downloaded, processed, and imported.
