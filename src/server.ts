import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { marked } from 'marked';
import chokidar from 'chokidar';

import { 
    createRelativePath, 
    prepareFileTreeWithReadme, 
    WebSocketMessages, 
    SCSS_COMPILE_COMMAND, 
    generateReadmeHtml,
    LogMessages 
} from './server-impl';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;

// Middleware
app.use(express.static('public'));
// Serve font files
app.use('/fonts', express.static('fonts'));

// Function to compile SCSS to CSS
function compileSCSS() {
    try {
        execSync(SCSS_COMPILE_COMMAND, { stdio: 'inherit' });
        console.log(LogMessages.scssCompiled);
    } catch (error) {
        console.error(LogMessages.scssFailed, error);
    }
}

// Initial compilation
compileSCSS();

// Helper function to build the file tree
interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
}

async function buildFileTree(dir: string, baseDir: string): Promise<FileNode[]> {
    const items: FileNode[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);
        
        if (entry.isDirectory()) {
            items.push({
                name: entry.name,
                path: relativePath,
                type: 'directory',
                children: await buildFileTree(fullPath, baseDir)
            });
        } else if (entry.isFile() && path.extname(entry.name) === '.html') {
            items.push({
                name: entry.name,
                path: relativePath,
                type: 'file'
            });
        }
    }
    return items;
}



const samplesDir = path.join(__dirname, '..', 'samples');

const watcher = chokidar.watch(samplesDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
});

// Broadcast file tree updates to all connected clients
async function broadcastFileTreeUpdate() {
    try {
        const fileTree = await buildFileTree(samplesDir, samplesDir);
        
        // Prepare file tree with README using utility function
        
        const result = prepareFileTreeWithReadme(fileTree);
        console.log('Broadcast file tree result:', JSON.stringify(result, null, 2));
        const message = WebSocketMessages.fileTreeUpdate(result);
        
        wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 means OPEN
                client.send(message);
            }
        });
    } catch (error) {
        console.error('Error broadcasting file tree update:', error);
    }
}

// Watch for style.scss and imported files changes
const styleWatcher = chokidar.watch(['style.scss', 'fonts.scss'], {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
});

styleWatcher
    .on('change', (path) => {
        console.log(LogMessages.styleChanged(path));
        compileSCSS();
        // Notify clients to reload CSS
        const message = WebSocketMessages.styleChanged();
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    })
    .on('error', (error) => {
        console.error(LogMessages.styleWatcherError, error);
    });

// Watch for file changes in samples
watcher
    .on('add', (path) => {
        console.log(LogMessages.fileAdded(path));
        broadcastFileTreeUpdate();
    })
    .on('change', (path) => {
        console.log(LogMessages.fileChanged(path));
        // Broadcast both file tree update and file change
        broadcastFileTreeUpdate();
        // Notify clients about the changed file using utility function
        
        const relativePath = createRelativePath(path, samplesDir, '/');
        const message = WebSocketMessages.fileChanged(relativePath);
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    })
    .on('unlink', (path) => {
        console.log(LogMessages.fileRemoved(path));
        broadcastFileTreeUpdate();
    })
    .on('addDir', (path) => {
        console.log(LogMessages.dirAdded(path));
        broadcastFileTreeUpdate();
    })
    .on('unlinkDir', (path) => {
        console.log(LogMessages.dirRemoved(path));
        broadcastFileTreeUpdate();
    })
    .on('error', (error) => {
        console.error(LogMessages.watcherError, error);
    });

// Handle WebSocket connections
wss.on('connection', async (ws) => {
    console.log(LogMessages.clientConnected);
    
    // Send initial file tree upon connection
    try {
        const samplesDir = path.join(__dirname, '..', 'samples');
        if (!fs.existsSync(samplesDir)) {
            fs.mkdirSync(samplesDir, { recursive: true });
        }
        const fileTree = await buildFileTree(samplesDir, samplesDir);
        
        // Add README as the first item - always from root, not samples
        const readmeItem = {
            name: 'README.md',
            path: 'README.md',
            type: 'file' as const
        };
        
        const result = [readmeItem, ...fileTree];
        console.log('WebSocket file tree result:', JSON.stringify(result, null, 2));
        ws.send(WebSocketMessages.fileTreeUpdate(result));
    } catch (error) {
        console.error(LogMessages.initialTreeError, error);
    }
    
    ws.on('close', () => {
        console.log(LogMessages.clientDisconnected);
    });
    
    ws.on('error', (error) => {
        console.error(LogMessages.websocketError, error);
    });
    
    // Send a test message
    ws.send(WebSocketMessages.test());
});

// Routes
app.get('/api/files', async (req, res) => {
    try {
        const samplesDir = path.join(__dirname, '..', 'samples');
        if (!fs.existsSync(samplesDir)) {
            fs.mkdirSync(samplesDir, { recursive: true });
        }
        const fileTree = await buildFileTree(samplesDir, samplesDir);
        
        // Add README as the first item - always from root, not samples
        const readmeItem = {
            name: 'README.md',
            path: 'README.md',
            type: 'file' as const
        };
        
        const result = [readmeItem, ...fileTree];
        console.log('API file tree result:', JSON.stringify(result, null, 2));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read samples directory' });
    }
});

// Serve README as HTML
app.get('/sample/README.md', async (req, res) => {
    const readmePath = path.join(__dirname, '..', 'README.md');
    if (fs.existsSync(readmePath)) {
        // Read and convert markdown to HTML using marked
        const markdown = fs.readFileSync(readmePath, 'utf-8');
        const htmlContent = await marked.parse(markdown);
        const html = generateReadmeHtml(htmlContent);
        res.send(html);
    } else {
        res.status(404).send('README not found');
    }
});

app.get('/sample/:path(*)', (req, res) => {
    const samplePath = path.join(__dirname, '..', 'samples', req.params.path);
    if (fs.existsSync(samplePath)) {
        res.sendFile(samplePath);
    } else {
        res.status(404).send('Sample not found');
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Update the server to use the HTTP server
server.listen(PORT, '0.0.0.0', () => {
    console.log(LogMessages.serverRunning(PORT));
    console.log(LogMessages.websocketReady);
});
