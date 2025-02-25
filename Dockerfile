FROM ghcr.io/qtvhao/node-20.12.2:main

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY yarn.lock package.json tsconfig.json .
RUN yarn

COPY src src

RUN npx tsc
