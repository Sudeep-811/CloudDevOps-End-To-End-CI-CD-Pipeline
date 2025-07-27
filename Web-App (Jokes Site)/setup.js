const fs = require('fs');
const path = require('path');

console.log('🎭 Setting up JokeMaster Website...\n');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
    console.log('✅ Created public directory');
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    const envContent = `# JokeMaster Configuration
PORT=3000
DB_PATH=./jokes.db
NODE_ENV=development

# Optional: Add your custom configurations here
# API_KEY=your_api_key_here
# SESSION_SECRET=your_session_secret_here
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file');
}

// Create .gitignore if it doesn't exist
const gitignorePath = path.join(__dirname, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite
*.sqlite3

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/

# Temporary folders
tmp/
temp/
`;
    
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Created .gitignore file');
}

// Create LICENSE file
const licensePath = path.join(__dirname, 'LICENSE');
if (!fs.existsSync(licensePath)) {
    const licenseContent = `MIT License

Copyright (c) ${new Date().getFullYear()} JokeMaster

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    
    fs.writeFileSync(licensePath, licenseContent);
    console.log('✅ Created LICENSE file');
}

// Create deployment scripts
const scriptsDir = path.join(__dirname, 'scripts');
if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir);
    
    // Development script
    const devScript = `#!/bin/bash
echo "🚀 Starting JokeMaster in development mode..."
npm run dev
`;
    fs.writeFileSync(path.join(scriptsDir, 'dev.sh'), devScript);
    
    // Production script
    const prodScript = `#!/bin/bash
echo "🌐 Starting JokeMaster in production mode..."
export NODE_ENV=production
npm start
`;
    fs.writeFileSync(path.join(scriptsDir, 'prod.sh'), prodScript);
    
    // Make scripts executable (Unix systems)
    if (process.platform !== 'win32') {
        fs.chmodSync(path.join(scriptsDir, 'dev.sh'), '755');
        fs.chmodSync(path.join(scriptsDir, 'prod.sh'), '755');
    }
    
    console.log('✅ Created deployment scripts');
}

// Create Docker files
const dockerfilePath = path.join(__dirname, 'Dockerfile');
if (!fs.existsSync(dockerfilePath)) {
    const dockerfileContent = `# Use official Node.js runtime as base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create public directory
RUN mkdir -p public

# Expose port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/api/stats || exit 1

# Start the application
CMD ["npm", "start"]
`;
    
    fs.writeFileSync(dockerfilePath, dockerfileContent);
    console.log('✅ Created Dockerfile');
}

// Create docker-compose.yml
const dockerComposePath = path.join(__dirname, 'docker-compose.yml');
if (!fs.existsSync(dockerComposePath)) {
    const dockerComposeContent = `version: '3.8'

services:
  jokemaster:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./jokes.db:/app/jokes.db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/stats"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - jokemaster
    restart: unless-stopped
`;
    
    fs.writeFileSync(dockerComposePath, dockerComposeContent);
    console.log('✅ Created docker-compose.yml');
}

// Create nginx configuration
const nginxConfPath = path.join(__dirname, 'nginx.conf');
if (!fs.existsSync(nginxConfPath)) {
    const nginxConfContent = `server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://jokemaster:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
    
    fs.writeFileSync(nginxConfPath, nginxConfContent);
    console.log('✅ Created nginx.conf');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Move the HTML files to the public/ directory:');
console.log('   - Move index.html to public/index.html');
console.log('   - Move styles.css to public/styles.css'); 
console.log('   - Move script.js to public/script.js');
console.log('\n2. Install dependencies: npm install');
console.log('3. Start the server: npm start');
console.log('4. Visit http://localhost:3000');
console.log('\n🚀 Happy coding and keep the jokes coming! 😄');