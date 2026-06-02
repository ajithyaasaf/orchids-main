# Stage 1: Build & Package Monorepo
FROM node:20-alpine AS builder
ENV CI=true
RUN npm install -g pnpm

WORKDIR /app

# Copy lockfiles and workspace configs
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install all workspace dependencies (including devDependencies for compilation)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source code
COPY shared/ ./shared/
COPY backend/ ./backend/

# Compile TypeScript
RUN pnpm --filter @orchids/shared build && pnpm --filter @orchids/backend build

# Deploy to standalone directory (creates flat production node_modules with only production dependencies)
RUN pnpm --filter=@orchids/backend --prod deploy /prod/backend

# Manually copy built dist folder into production directory
RUN cp -r backend/dist /prod/backend/dist

# Stage 2: Minimalist Runner Container
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Hugging Face binds strictly to port 7860
ENV PORT=7860
EXPOSE 7860

# Copy self-contained deployed production bundle
COPY --from=builder /prod/backend/package.json ./
COPY --from=builder /prod/backend/node_modules ./node_modules
COPY --from=builder /prod/backend/dist ./dist

CMD ["node", "dist/index.js"]
