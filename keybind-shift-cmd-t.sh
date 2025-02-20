#!/bin/bash

docker compose up -d
npx tsc
node dist/enhance.js
