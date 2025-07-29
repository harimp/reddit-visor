// Development configuration for hot reloading
const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function startProcess(name, command, args, cwd) {
    log(`Starting ${name}...`, colors.cyan);
    
    const process = spawn(command, args, {
        cwd: cwd,
        stdio: 'inherit',
        shell: true
    });

    process.on('error', (error) => {
        log(`${name} error: ${error.message}`, colors.red);
    });

    process.on('exit', (code) => {
        if (code !== 0) {
            log(`${name} exited with code ${code}`, colors.red);
        }
    });

    return process;
}

function startDevelopment() {
    log('🚀 Starting Reddit Visor Development Environment', colors.bright + colors.green);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.green);
    
    // Start backend with nodemon
    const backend = startProcess(
        'Backend (nodemon)',
        'npm',
        ['run', 'dev'],
        path.join(__dirname, 'backend')
    );

    // Wait a bit before starting frontend
    setTimeout(() => {
        // Start frontend with React Fast Refresh
        const frontend = startProcess(
            'Frontend (React)',
            'npm',
            ['run', 'dev'],
            path.join(__dirname, 'frontend')
        );
    }, 2000);

    // Handle process termination
    process.on('SIGINT', () => {
        log('\n🛑 Shutting down development servers...', colors.yellow);
        backend.kill();
        process.exit(0);
    });

    log('\n📝 Development servers starting...', colors.blue);
    log('   Backend:  http://localhost:3001', colors.blue);
    log('   Frontend: http://localhost:3000', colors.blue);
    log('\n💡 Hot reloading enabled for both frontend and backend!', colors.green);
    log('   - Backend: Changes to .js, .json, .env files will restart server', colors.yellow);
    log('   - Frontend: React Fast Refresh will update components instantly', colors.yellow);
    log('\n🔥 Press Ctrl+C to stop all servers', colors.magenta);
}

if (require.main === module) {
    startDevelopment();
}

module.exports = { startDevelopment };
