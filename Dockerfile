ARG PORT=3000
ARG PORT_DEBUG=9229
ARG BASE_IMAGE=node:22.11.0-bullseye-slim

FROM ${BASE_IMAGE} AS build

WORKDIR /home/node

COPY --chown=node:node . .

RUN npm ci
RUN npm run build

FROM ${BASE_IMAGE} AS production

ENV TZ="Europe/London"
ENV NODE_ENV production
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/internal-ca.crt

# Add curl to template.
# CDP PLATFORM HEALTHCHECK REQUIREMENT
USER root
RUN apt-get update \
    && apt-get install -y ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
COPY certificates/internal-ca.crt /usr/local/share/ca-certificates/internal-ca.crt
RUN chmod 644 /usr/local/share/ca-certificates/internal-ca.crt && update-ca-certificates
USER node

WORKDIR /home/node

COPY --from=build /home/node/package*.json .
COPY --from=build /home/node/src src
COPY --from=build /home/node/.public .public

RUN npm ci --omit=dev

ARG PORT
ENV PORT ${PORT}
EXPOSE ${PORT}

CMD [ "node", "src" ]
