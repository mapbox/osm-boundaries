#!/bin/bash
set -e -u
debug=true

$debug && echo "infile=$1"
$debug && echo "outfile=$2"

min_admin_level=2
max_admin_level=11
outpbf=osm_admin_$min_admin_level-$max_admin_level.osm.pbf
$debug && echo "outpbf=$outpbf"

# the underscore and sed part is a workaround for a bug in coreutils 8.20
admin_levels=$(seq -s ',_' $min_admin_level $max_admin_level | sed 's/_//g')
$debug && echo "admin_levels=$admin_levels"

if [ -e $outpbf ]; then
    echo "Found OSM file '$outpbf'; Skipping Osmosis processing."
else
    cmd="osmosis \
        --read-pbf $1 \
        --tf accept-relations admin_level=$admin_levels \
        --tf accept-relations boundary=administrative \
        --used-way \
        --used-node \
        --write-pbf $outpbf"
    $debug && echo $cmd
    $cmd
fi

# Basic file setup
sqlite3 $2 < template.sql
osmjs -l sparsetable -r -j process-boundaries.js $outpbf | sqlite3 $2
