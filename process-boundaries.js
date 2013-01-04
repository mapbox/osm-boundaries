// Usage:
// osmjs -l sparsetable -j osm-boundaries.js boundaries.osm | psql <dbname>

var ways_table = 'carto_boundary';

is_maritime = function(tags) {
    if (tags['maritime']) {
        return 1
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
        return 1
    }
    return 0
}

Osmium.Callbacks.way = function() {
    // This will import all ways in the OSM file except coastlines. We assume
    // that we are only looking at ways that are members of boundary relations.

    // ignore coastlines & closure segments
    if (this.tags['natural'] == 'coastline'
        || this.tags['closure_segment']) {
        return;
    }

    var geometry = this.geom.toHexWKB(true);
    // Catch failed geometries, skip them
    if (geometry == undefined) {
        return;
    }

    print(["SELECT insert_boundary(",this.id, ", ", is_maritime(this.tags),
          ", ", is_disputed(this.tags), ", '", geometry,
          "'::geometry);"].join(""));
}

Osmium.Callbacks.relation = function() {
    var rel_id = this.id,
        way_ids = [],
        admin_level

    try {
        admin_level = parseInt(this.tags['admin_level']);
    } catch(e) {}
    

    for (var i=0; i < this.members.length; i++) {
        // build a list of way members for processing
        if (this.members[i].type = 'w') {
            way_ids.push(this.members[i].ref);
        }
    }

    if (way_ids.length === 0) {
        // relation has no way members, no updates needed
        return;
    }

    way_ids = way_ids.join(', ');

    if (typeof admin_level === 'number') {
        print(['UPDATE', ways_table, 'SET admin_level =', admin_level,
              'WHERE osm_id in (', way_ids, ') AND (admin_level >',
              admin_level, 'OR admin_level IS NULL);'].join(' '));
    }

    if (is_maritime(this.tags)) {
        // TODO: more tags
        print(['UPDATE', ways_table, 'SET maritime = 1 WHERE osm_id in (',
              way_ids, ');'].join(' '));
    }

    if (is_disputed(this.tags)) {
        print(['UPDATE', ways_table, 'SET disputed = 1 WHERE osm_id in (',
              way_ids, ');'].join(' '));
    }
}
