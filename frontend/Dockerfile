# Frontend Dockerfile
FROM node:20

# Set working directory
WORKDIR /app

# Copy dependencies and install
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Expose the port for serving the build
EXPOSE 3000

# Serve the build with a simple HTTP server
CMD ["npx", "serve", "-s", "build"]

