#!/bin/bash

# Required :
# * pm2
# Optional :
# * yarn

cd `dirname $0`

printf "`date +%Y-%m-%d` : Trying ...\n" >> deploy.log

#PM2
echo "Cheking PM2 ..."
if npm list -g --depth=0 | grep pm2
then
	echo "PM2 already installed."
else
	echo "Installing PM2 ..."
	npm install pm2 -g
	echo "Installed PM2 !"
fi

## Install dependencies
echo "Installing dependencies ..."
if which yarn > /dev/null; then
	yarn
	(cd .. && yarn)
else
	npm install
	(cd .. && npm install)
fi
echo "Installed dependencies !"

## Build
echo "Building ..."
(cd .. && npm run build)
echo "Building : done !"

## Run with pm2
echo "Running PM2 ..."
pm2 startOrRestart ecosystem.json5 --env=production

echo "Deployed successfully !"
printf "`date +%Y-%m-%d` : \n$(git show --name-status)\n\n" >> deploy.log
