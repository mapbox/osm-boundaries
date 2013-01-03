#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import os.path
import subprocess
import sys

if sys.version_info.major >= 3:
    from urllib.request import urlretrieve
else:
    from urllib import urlretrieve


if __name__ == '__main__':

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
    args = ap.parse_args()

    admin_level = args.min_admin_level
    while admin_level <= args.max_admin_level:

        # Downloading admin_levels separately gives us some duplicate way data,
        # but its still faster than executing a single complex query.

        outfile = 'osm_admin_level_{0}.osm'.format(admin_level)

        if not os.path.isfile(outfile):
            print('Retrieving admin_level={0}'.format(admin_level))

            query_url = 'http://overpass.osm.rambler.ru/cgi/'
            #query_url = 'http://overpass-api.de/api/' # alternate server
            query_timeout = 86400  # in seconds

            query = '''{0}interpreter?data=[timeout:{1}];(rel[boundary=administrative][admin_level={2}];);(._;way(r);node(w););out+qt;'''.format(
                    query_url, query_timeout, admin_level)

            urlretrieve(query, outfile)
        else:
            print('Using existing file for admin_level={0}'.format(admin_level))

        admin_level = admin_level + 1

    admin_level = args.min_admin_level
    while admin_level <= args.max_admin_level:
        print('Importing admin_level={0}'.format(admin_level))

        subprocess.call(['osmjs -l sparsetable -r -j process-boundaries.js osm_admin_level_{0}.osm | psql -h {1} -p {2} -U {3} -d {4}'.format(
                        admin_level, args.db_host, args.db_port,
                        args.db_user, args.db_name)],
                        shell=True)

        admin_level = admin_level + 1
