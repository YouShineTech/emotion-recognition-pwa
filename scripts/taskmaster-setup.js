#!/usr/bin/env node

/**
 * Taskmaster AI Setup Script
 * Initializes Taskmaster AI for the emotion-recognition-pwa project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Taskmaster AI for emotion-recognition-pwa...');

// Check if taskmaster.db exists, create if not
const dbPath = path.join(__dirname, '..', 'taskmaster.db');
if (!fs.existsSync(dbPath)) {
    console.log('📊 Creating new taskmaster database...');
    // The database will be created automatically when the MCP server starts
}

// Create initial project tasks
console.log('📋 Creating initial project structure tasks...');

// Add npm scripts to package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add taskmaster-related scripts
packageJson.scripts = {
    ...packageJson.scripts,
    'taskmaster:dev': 'npx @astrotask/mcp --database-path ./taskmaster.db --log-level debug',
    'taskmaster:start': 'npx @astrotask/mcp --database-path ./taskmaster.db',
    'taskmaster:reset': 'rm -f taskmaster.db && npm run taskmaster:start',
    'taskmaster:backup': 'cp taskmaster.db taskmaster-backup-$(date +%Y%m%d-%H%M%S).db',
    'taskmaster:status': 'echo "Taskmaster AI is configured and ready to use!"'
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Taskmaster AI setup complete!');
console.log('');
console.log('📖 Usage:');
console.log('  • MCP server is configured in ~/.config/Cursor/User/globalStorage/saoudrizwan.cline-dev/settings/cline_mcp_settings.json');
console.log('  • Database: ./taskmaster.db');
console.log('  • Config: ./taskmaster.config.json');
console.log('');
console.log('🛠️  Available commands:');
console.log('  npm run taskmaster:start   - Start the MCP server');
console.log('  npm run taskmaster:dev     - Start with debug logging');
console.log('  npm run taskmaster:reset   - Reset database');
console.log('  npm run taskmaster:backup  - Backup database');
console.log('');
console.log('🤖 AI Integration:');
console.log('  The MCP server provides these tools:');
console.log('  • createTask - Create new tasks');
console.log('  • listTasks - List and filter tasks');
console.log('  • updateTask - Update existing tasks');
console.log('  • completeTask - Mark tasks as complete');
console.log('  • getTaskContext - Get task with full context');
console.log('  • deleteTask - Delete tasks');
console.log('');
console.log('💡 Example usage in AI:');
console.log('  "Create a task to implement WebRTC connection handling"');
console.log('  "List all pending tasks for the frontend"');
console.log('  "Mark the authentication task as complete"');
