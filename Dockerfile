# Use Node.js 20 as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install yarn
RUN corepack enable && corepack prepare yarn@4.1.0 --activate

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application
COPY . .

# Build the application
RUN yarn build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["yarn", "start"] 