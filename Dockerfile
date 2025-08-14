# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
# This step is crucial for caching layers, as it only invalidates when dependencies change
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the port your Node.js app listens on
EXPOSE 3333

# Define the command to run your app
CMD ["node", "ace", "serve", "--hmr"]
