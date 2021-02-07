#!/bin/bash

echo $'\033[1;33m'Running environment setup script installer
echo ------------------------------------------------------$'\033[1;33m'
echo

echo $'\033[0;33m'Installing environment...$'\033[0m'
echo
pwd=$(pwd)
pwd
ls -aF --color=always
echo

app=cv-generator-project-server

report() {
  heroku config -a $app
  # heroku run env -a $app
}

report
echo

maintenanceIsOff=$(heroku maintenance -a $app)

if [ $maintenanceIsOff == "off" ]; then
  heroku maintenance:on -a $app
fi

cat ./env.sh | sed "s/export /heroku config:set -a $app /g" > env-remote.sh
. ./env-remote.sh

if [ $maintenanceIsOff == "off" ]; then
  heroku maintenance:off -a $app
fi

report
echo


echo
echo $'\033[1;32m'Environment installed.$'\033[0m'

echo
# read  -n 1 -p "x" input
# exit
