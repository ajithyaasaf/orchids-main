# Stage 1: Build Monorepo (Shared + Backend)
FROM node:20-alpine AS builder
ENV CI=true

# Install pnpm v9 matching lockfileVersion 9.0
RUN npm install -g pnpm@9

WORKDIR /app

# Copy lockfiles and workspace configs available in HF Spaces
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy shared and backend source code
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build TypeScript for shared and backend
RUN pnpm --filter @orchids/shared build && pnpm --filter @orchids/backend build

# Stage 2: Minimalist Runner Container
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Hugging Face binds strictly to port 7860
ENV PORT=7860
EXPOSE 7860

# Copy runtime files from builder stage preserving workspace structure
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend
CMD ["node", "dist/index.js"]
