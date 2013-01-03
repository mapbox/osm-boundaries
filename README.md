# MapBox OSM Boundaries

This program will download, process, and import OSM boundary relations optimized for rendering. It is mainly intended for (and tested with) boundaries with low `admin_level` values (countries, territories, states, provinces, etc). No polygons are built, allowing different segments of a single boundary to be styled independently. Boundary relation way members are imported as linestrings. They acquire tagging information from their parent relations.

Currently the process relies on pulling boundary data from an [Overpass API](http://wiki.openstreetmap.org/wiki/Overpass_API) instance.

### Main features:

- The lowest `admin_level` value of any of a way's parent relations will be the `admin_level` value of the resulting linestring.
- Various tag combinations are checked to see if each way is a maritime boundary. This information is simplified to a single `maritime` field with a value of either `0` (false) or `1` (true).
- Various tag combinations are checked to see if each way is a disputed boundary. This information is simplified to a single `disputed` field with a value of either `0` (false) or `1` (true).
- Boundaries that are also coastlines (`natural=coastline`) are not imported.
- Boundaries that are closure segments (`closure_segment=yes`) are not imported. (Closure segments are ways added at the limits of the projection to close boundaries for valid multipolygon building. They are not actual borders.)
- Geometries are imported to a Spherical Mercator projection (900913).

### Known issues:

- boundaries that are not part of any `boundary=administrative` relation are ignored.

## Dependencies

- Python
- [PostgreSQL](http://postgresql.org) (tested with 9.2)
- [PostGIS](http://postgis.refractions.net) (tested with 2.0)
- [Osmium](http://github.com/joto/osmium/) - make sure `osmjs` is compiled and in your PATH

## Running

1. Adjust database parameters, etc, if necessary at the top of `build.sh`
2. Run `run.py`. This will take at least several minutes while the data is downloaded, processed, and imported. See `run.py --help` for options.
