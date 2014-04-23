# MapBox OSM Boundaries

This program will process and import boundary relations from a OSM PBF file. The process is optimized for rendering - instead of building (multi)polygons, boundary relation way members are imported as unconnected linestrings allowing different segments of a single boundary to be styled independently. This also avoids overlapping lines where different boundaries and admin levels meet, and allows renderers like Mapnik to draw dashed lines correctly.

### Data processing

The data is manipulated and simplified for easier styling:

- The lowest `admin_level` value of any of a way's parent relations will be the `admin_level` value of the resulting linestring.
- Various tag combinations are checked to see if each way is a maritime boundary. This information is simplified to a single `maritime` field with a value of either `0` (false) or `1` (true).
- Various tag combinations are checked to see if each way is a disputed boundary. This information is simplified to a single `disputed` field with a value of either `0` (false) or `1` (true).
- Boundaries that are also coastlines (`natural=coastline`) are not imported.
- Boundaries that are closure segments (`closure_segment=yes`) are not imported. (Closure segments are ways added at the limits of the projection to close boundaries for valid multipolygon building. They are not actual borders.)
- Geometries are imported to a Spherical Mercator projection (900913).

### Known issues

- boundaries that are not part of any `boundary=administrative` relation are ignored.

## Dependencies

- Python & [Psycopg2](http://initd.org/psycopg/docs/) in a Unixy environment
- [Osmosis](http://wiki.openstreetmap.org/wiki/Osmosis) (requires version >= __0.42__ for planet files newer than Feb 9 2013)
- [PostgreSQL](http://postgresql.org) (tested with 9.2)
- [PostGIS](http://postgis.refractions.net) (tested with 2.0)
- [Node.js v0.10.x](http://nodejs.org/) (tested with 0.10.21)
- [Node-Osmium](https://github.com/osmcode/node-osmium)

## Running

1. Make sure you have a PostgreSQL database set up with PostGIS enabled.
2. Run `run.py -f 2 -t 4 data.osm.pbf` with appropriate options set for your database and desired admin levels. See `run.py --help` for available options.

The process will take quite some time and require lots of free disk space for temporary storage. Processing a full planet file might take over six hours and require at least 60 GB of free disk space.
