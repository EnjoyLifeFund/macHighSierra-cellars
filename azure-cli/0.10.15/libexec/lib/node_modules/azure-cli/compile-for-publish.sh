#!/bin/sh
# Microsoft Azure OS X Package: Tarball Creation Script #2
# Copyright (c) Microsoft Corporation. All Rights Reserved.
#
# Remove streamline js file and publish compiled file to npm
# This deals with random errors caused by stale contents under 
# $HOME/.streamline

if [ ! -f ./package.json ]; then
	echo Please run this from the repo root folder
	exit 1
fi
npm install
node node_modules/streamline/bin/_node -c lib
find lib/ -name "*._js" -delete
node bin/azure --gen
node scripts/unit.js testlist.txt
node scripts/unit.js testlist-arm.txt
