# Use the specified image as the base
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Install Prisma CLI
RUN npm install -g prisma

# Copy the package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma client for this environment
RUN npx prisma generate
 
# Expose port 3000 for the app
EXPOSE 3000

# Run the app when the container launches
CMD [ "npm", "start" ]
