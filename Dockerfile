# Base image
FROM node:23-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app

# Build stage
FROM base AS build
RUN corepack enable pnpm && pnpm install -g @nestjs/cli
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Installer stage to install production dependencies
FROM base AS installer
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Production stage without pkg manager
FROM node:23-alpine AS production
COPY --from=installer /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
CMD [ "node", "dist/main.js" ]