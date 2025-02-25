FROM ghcr.io/qtvhao/node-20.12.2:main

COPY yarn.lock package.json tsconfig.json .
RUN yarn

COPY src src

RUN npx tsc
