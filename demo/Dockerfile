# ==== Build

FROM mhart/alpine-node:8.5.0 as builder

RUN mkdir -p /usr/src
WORKDIR /usr/src

RUN npm i -g snyk
RUN snyk auth $SNYK_TOKEN

COPY src src
COPY package.json yarn.lock gulpfile.babel.js webpack.config.js index.js .babelrc .eslint* ./

RUN npm install
# RUN yarn --silent
RUN yarn build

# ==== Run

FROM mhart/alpine-node:8.5.0

RUN mkdir -p /usr/src/app/demo

RUN npm i -g pm2@2.7.0

WORKDIR /usr/src/app

COPY --from=builder lib lib
COPY --from=builder node_modules node_modules
COPY --from=builder index.js .

WORKDIR /usr/src/app/demo

RUN cd demo
COPY . .
RUN yarn --silent

COPY ../lib lib

ENV PORT 3000

CMD ["pm2-docker", "start", "app.js"]

EXPOSE 3000
