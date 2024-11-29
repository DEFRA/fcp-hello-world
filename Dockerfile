ARG PARENT_VERSION=20-bullseye-slim
ARG PORT=3000
ARG PORT_DEBUG=9229

FROM node:${PARENT_VERSION} AS development

ENV TZ="Europe/London"

ARG PARENT_VERSION
LABEL uk.gov.defra.ffc.parent-image=node:${PARENT_VERSION}

ARG PORT
ARG PORT_DEBUG
ENV PORT ${PORT}
EXPOSE ${PORT} ${PORT_DEBUG}

COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node . .
RUN npm run build

CMD [ "npm", "run", "docker:dev" ]

FROM development AS productionBuild

ENV NODE_ENV production

RUN npm run build

FROM node:${PARENT_VERSION} AS production

ENV TZ="Europe/London"

# Add curl to template.
# CDP PLATFORM HEALTHCHECK REQUIREMENT
USER root
RUN apt-get update \
    && apt-get install -y ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
USER node

ARG PARENT_VERSION
LABEL uk.gov.defra.ffc.parent-image=node:${PARENT_VERSION}

COPY --from=productionBuild /home/node/package*.json ./
COPY --from=productionBuild /home/node/.server ./.server/
COPY --from=productionBuild /home/node/.public/ ./.public/

RUN npm ci --omit=dev

ARG PORT
ENV PORT ${PORT}
EXPOSE ${PORT}

CMD [ "node", "." ]
