FROM node:18.12.1-alpine3.16 AS base

ARG NODE_ENV=production

WORKDIR /foundkey

ENV BUILD_DEPS autoconf automake file g++ gcc libc-dev libtool make nasm pkgconfig python3 zlib-dev git

FROM base AS builder

COPY . ./

RUN apk add --no-cache $BUILD_DEPS && \
	git submodule update --init && \
	yarn install && \
	yarn build && \
	rm -rf .git

FROM base AS runner

RUN apk add --no-cache \
	ffmpeg \
	tini

ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder /foundkey/node_modules ./node_modules
COPY --from=builder /foundkey/built ./built
COPY --from=builder /foundkey/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /foundkey/packages/backend/built ./packages/backend/built
COPY --from=builder /foundkey/packages/foundkey-js/built ./packages/foundkey-js/built
COPY . ./

ENV NODE_ENV=production
CMD ["npm", "run", "migrateandstart"]

