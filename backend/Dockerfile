# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for build)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies, source files, and build tools to reduce image size
RUN rm -rf src tsconfig.json node_modules && \
    if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi && \
    npm cache clean --force

# Expose port
EXPOSE 4000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/server.js"]

