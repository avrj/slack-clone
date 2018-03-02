FROM node:8.9.4-alpine

# Slack clone is based at the root dir
WORKDIR /slack-clone

# Copy package.json and install dependencies
#   - we do this first to take advantage of caching
# ARG NPM_TOKEN
# COPY ./.npmrc /slack-clone/.npmrc
COPY ./package.json /slack-clone/package.json
COPY ./package-lock.json /slack-clone/package-lock.json
# COPY ./yarn.lock /slack-clone/yarn.lock

RUN ["npm", "install"]

# Copy the client-side of the app over and trigger the build.
COPY ./ /slack-clone
ENV NODE_ENV production

# build static assets (stored in `/dist`)
RUN ["npm", "run", "heroku-postbuild"]

ENTRYPOINT [ "npm" ]
CMD [ "start" ]
