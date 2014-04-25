// Usage:
// node process-boundaries.js boundaries.osm | psql -U <dbuser> -d <dbname>

var args = process.argv.slice(2);
var osmium = require('osmium');
var file = new osmium.File(args[0]);
var reader = new osmium.Reader(file);
var handler = new osmium.Handler();
var location_handler = new osmium.LocationHandler();

var ways_table = 'carto_boundary';

is_maritime = function(tags) {
    if (tags['maritime']) {
        return 1;
    }
    var maritime_tags = [
        'boundary_type',
        'border_type',
        'boundary'
    ];
    var maritime_vals = [
        'eez',
        'maritime',
        'territorial_waters',
        'territorial waters'
    ];
    for (i = 0; i < maritime_tags.length; i++) {
        if (maritime_vals.indexOf(tags[maritime_tags[i]]) >= 0) {
            return 1;
        }
    }
    return 0;
}

is_disputed = function(tags) {
    if (tags['disputed'] || tags['dispute']
        || tags['border_status'] === 'dispute')  {
        return 1;
    }
    return 0;
}

handler.on('way',function(way) {
    // This will import all ways in the OSM file except coastlines. We assume
    // that we are only looking at ways that belong in boundary relations.

    // ignore coastlines & closure segments
    if (way.tags()['natural'] == 'coastline'
        || way.tags()['closure_segment']) {
        return;
    }

    var geometry = way.wkt();
    // Catch failed geometries, skip them
    if (geometry == undefined) {
        return;
    } else {
        geometry = ['st_transform(st_geomfromtext(\'', geometry, '\', 4326), 900913)'].join('');
    }

    process.stdout.write(['INSERT INTO ', ways_table, ' (osm_id, maritime, disputed, geom) ',
          'VALUES (', way.id, ', ', is_maritime(way.tags()), ', ',
          is_disputed(way.tags()), ', ', geometry, ');'].join(''));
});

handler.on('relation',function(rel) {
    // For each relation we check a few key tags, then make any updates to
    // its way members as necessary.

    var way_ids = [],
        admin_level;

    try {
        admin_level = parseInt(rel.tags()['admin_level']);
    } catch(e) {}
    

    for (var i=0; i < rel.members().length; i++) {
        // build a list of way members for processing
        if (rel.members()[i].type = 'w') {
            way_ids.push(rel.members()[i].ref);
        }
    }

    if (way_ids.length === 0) {
        // relation has no way members, no updates needed
        return;
    }

    way_ids = way_ids.join(', ');

    if (typeof admin_level === 'number') {
        process.stdout.write(['UPDATE', ways_table, 'SET admin_level =', admin_level,
              'WHERE osm_id in (', way_ids, ') AND (admin_level >',
              admin_level, 'OR admin_level IS NULL);'].join(' '));
    }

    if (is_maritime(rel.tags())) {
        process.stdout.write(['UPDATE', ways_table, 'SET maritime = 1 WHERE osm_id in (',
              way_ids, ');'].join(' '));
    }

    if (is_disputed(rel.tags())) {
        process.stdout.write(['UPDATE', ways_table, 'SET disputed = 1 WHERE osm_id in (',
              way_ids, ');'].join(' '));
    }
});

reader.apply(location_handler, handler);
