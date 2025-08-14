# Load Testing Container for 1000+ Connection Testing
# Supports Requirement 8 validation

FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy test scripts
COPY . .

# Create reports directory
RUN mkdir -p reports

# Run load tests
CMD ["npm", "run", "test:load"]
