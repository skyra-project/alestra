FROM node:14-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache \
	build-base \
	cairo-dev \
	freetype-dev \
	g++ \
	gcc \
	giflib-dev \
	git \
	jpeg-dev \
	libjpeg-turbo-dev \
	musl-dev \
	pango-dev \
	pangomm-dev \
	pixman-dev \
	pkgconfig \
	python

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile --link-duplicates

COPY dist/ dist/

CMD ["yarn", "start"]