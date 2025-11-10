FROM node:20-alpine

WORKDIR /app

# ensure we use bash/sh available
ENV NODE_ENV=development

# copy package manifests first for caching
COPY package.json package-lock.json* ./

# install deps (including dev for tsx)
RUN npm ci || npm install

# copy project
COPY . ./

# Use a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["sh", "-c", "npm run dev"]
