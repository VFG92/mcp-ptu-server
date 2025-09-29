# Multi-stage build for MCP Streamable HTTP Server
# Optimized for Railway deployment

FROM node:22.12-alpine AS builder

# Copy source files
COPY src/everything /app
COPY tsconfig.json /tsconfig.json

WORKDIR /app

# Install dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.npm npm install

# Build TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine AS release

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
RUN npm ci --ignore-scripts --omit=dev

# Railway provides PORT environment variable
# Default to 3000 for local testing
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Health check for Railway monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the Streamable HTTP server
CMD ["node", "dist/streamableHttp.js"]

