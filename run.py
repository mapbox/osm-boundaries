#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import os.path
import psycopg2
import subprocess


## Arguments & help

ap = argparse.ArgumentParser(description='Process OSM administrative ' +
                             'boundaries as individual ways.')
ap.add_argument('-d', dest='db_name', default='osm',
                help='PostgreSQL database.')
ap.add_argument('-U', dest='db_user', default='postgres',
                help='PostgreSQL user name.')
ap.add_argument('-H', dest='db_host', default='localhost',
                help='PostgreSQL host.')
ap.add_argument('-p', dest='db_port', default='5432',
                help='PostgreSQL port.')
ap.add_argument('-f', dest='min_admin_level', type=int, default=2,
                help='Minimum admin_level to retrieve.')
ap.add_argument('-t', dest='max_admin_level', type=int, default=4,
                help='Maximum admin_level to retrieve.')
ap.add_argument(dest='osm_input', metavar='planet.osm.pbf',
                help='An OpenStreetMap PBF file to process.')
args = ap.parse_args()


## PostgreSQL setup

# Set up the db connection
con = psycopg2.connect("dbname={0} user={1} host={2} port={3}".format(
    args.db_name, args.db_user, args.db_host, args.db_port))
cur = con.cursor()

# Set up PostgeSQL table
boundary_table = 'carto_boundary'

cur.execute('''
    create table if not exists {0} (
        osm_id bigint primary key,
        admin_level smallint,
        maritime smallint,
        disputed smallint,
        geom geometry(Geometry,900913),
        geom_gen1 geometry(Geometry,900913),
        geom_gen0 geometry(Geometry,900913)
    );'''.format(boundary_table))
con.commit()


## Process & import the boundaries with osmjs

if args.min_admin_level == args.max_admin_level:
    admin_levels = args.min_admin_level;
    outfile = 'osm_admin_{0}.osm.pbf'.format(admin_levels)
elif args.min_admin_level < args.max_admin_level:
    admin_levels = ','.join(str(i) for i in range(
                 args.min_admin_level, args.max_admin_level + 1))
    outfile = 'osm_admin_{0}-{1}.osm.pbf'.format(
            args.min_admin_level, args.max_admin_level)
else:
    print('Error: max admin level cannot be be less than min admin level')
    exit(1)

if os.path.exists(outfile):
    print('Found existing file {0}; skipping filtering.'.format(outfile))
else:
    subprocess.call(['''osmosis \
        --read-pbf {0} \
        --tf accept-relations admin_level={1} \
        --tf accept-relations boundary=administrative \
        --used-way \
        --used-node \
        --write-pbf {2}'''.format(
            args.osm_input,
            admin_levels,
            outfile)],
        shell=True)

subprocess.call(['node process-boundaries-node.js {0} | psql -h {1} -p {2} -U {3} -d {4} > /dev/null'.format(
        outfile,
        args.db_host,
        args.db_port,
        args.db_user,
        args.db_name)],
    shell=True)


## Create simplified geometries

cur.execute('update {0} set geom_gen1 = st_simplify(geom, 200);'.format(
    boundary_table))
con.commit()

cur.execute('update {0} set geom_gen0 = st_simplify(geom, 1000);'.format(
    boundary_table))
con.commit()

cur.close()
con.close()
