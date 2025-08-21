"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ws_1 = require("ws");
const http_1 = require("http");
const marked_1 = require("marked");
const chokidar_1 = __importDefault(require("chokidar"));
const server_impl_1 = require("./server-impl");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
const PORT = 3000;
// Middleware
app.use(express_1.default.static('public'));
// Serve font files
app.use('/fonts', express_1.default.static('fonts'));
// Function to compile SCSS to CSS using esbuild
async function compileSCSS() {
    await (0, server_impl_1.compileSCSSWithEsbuild)();
}
// Initial compilation
compileSCSS().catch(error => {
    console.error(server_impl_1.LogMessages.scssFailed, error);
});
async function buildFileTree(dir, baseDir) {
    const items = [];
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(dir, entry.name);
        const relativePath = path_1.default.relative(baseDir, fullPath);
        if (entry.isDirectory()) {
            items.push({
                name: entry.name,
                path: relativePath,
                type: 'directory',
                children: await buildFileTree(fullPath, baseDir)
            });
        }
        else if (entry.isFile() && path_1.default.extname(entry.name) === '.html') {
            items.push({
                name: entry.name,
                path: relativePath,
                type: 'file'
            });
        }
    }
    return items;
}
const samplesDir = path_1.default.join(__dirname, '..', 'samples');
const watcher = chokidar_1.default.watch(samplesDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
});
// Broadcast file tree updates to all connected clients
async function broadcastFileTreeUpdate() {
    try {
        const fileTree = await buildFileTree(samplesDir, samplesDir);
        // Prepare file tree with README using utility function
        const result = (0, server_impl_1.prepareFileTreeWithReadme)(fileTree);
        console.log('Broadcast file tree result:', JSON.stringify(result, null, 2));
        const message = server_impl_1.WebSocketMessages.fileTreeUpdate(result);
        wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 means OPEN
                client.send(message);
            }
        });
    }
    catch (error) {
        console.error('Error broadcasting file tree update:', error);
    }
}
// Watch for style.scss and imported files changes
const styleWatcher = chokidar_1.default.watch(['src/style.scss', 'src/fonts.scss'], {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
});
styleWatcher
    .on('change', async (path) => {
    console.log(server_impl_1.LogMessages.styleChanged(path));
    await compileSCSS();
    // Notify clients to reload CSS
    const message = server_impl_1.WebSocketMessages.styleChanged();
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });
})
    .on('error', (error) => {
    console.error(server_impl_1.LogMessages.styleWatcherError, error);
});
// Watch for file changes in samples
watcher
    .on('add', (path) => {
    console.log(server_impl_1.LogMessages.fileAdded(path));
    broadcastFileTreeUpdate();
})
    .on('change', (path) => {
    console.log(server_impl_1.LogMessages.fileChanged(path));
    // Broadcast both file tree update and file change
    broadcastFileTreeUpdate();
    // Notify clients about the changed file using utility function
    const relativePath = (0, server_impl_1.createRelativePath)(path, samplesDir, '/');
    const message = server_impl_1.WebSocketMessages.fileChanged(relativePath);
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });
})
    .on('unlink', (path) => {
    console.log(server_impl_1.LogMessages.fileRemoved(path));
    broadcastFileTreeUpdate();
})
    .on('addDir', (path) => {
    console.log(server_impl_1.LogMessages.dirAdded(path));
    broadcastFileTreeUpdate();
})
    .on('unlinkDir', (path) => {
    console.log(server_impl_1.LogMessages.dirRemoved(path));
    broadcastFileTreeUpdate();
})
    .on('error', (error) => {
    console.error(server_impl_1.LogMessages.watcherError, error);
});
// Handle WebSocket connections
wss.on('connection', async (ws) => {
    console.log(server_impl_1.LogMessages.clientConnected);
    // Send initial file tree upon connection
    try {
        const samplesDir = path_1.default.join(__dirname, '..', 'samples');
        if (!fs_1.default.existsSync(samplesDir)) {
            fs_1.default.mkdirSync(samplesDir, { recursive: true });
        }
        const fileTree = await buildFileTree(samplesDir, samplesDir);
        // Add README as the first item - always from root, not samples
        const readmeItem = {
            name: 'README.md',
            path: 'README.md',
            type: 'file'
        };
        const result = [readmeItem, ...fileTree];
        console.log('WebSocket file tree result:', JSON.stringify(result, null, 2));
        ws.send(server_impl_1.WebSocketMessages.fileTreeUpdate(result));
    }
    catch (error) {
        console.error(server_impl_1.LogMessages.initialTreeError, error);
    }
    ws.on('close', () => {
        console.log(server_impl_1.LogMessages.clientDisconnected);
    });
    ws.on('error', (error) => {
        console.error(server_impl_1.LogMessages.websocketError, error);
    });
    // Send a test message
    ws.send(server_impl_1.WebSocketMessages.test());
});
// Routes
app.get('/api/files', async (req, res) => {
    try {
        const samplesDir = path_1.default.join(__dirname, '..', 'samples');
        if (!fs_1.default.existsSync(samplesDir)) {
            fs_1.default.mkdirSync(samplesDir, { recursive: true });
        }
        const fileTree = await buildFileTree(samplesDir, samplesDir);
        // Add README as the first item - always from root, not samples
        const readmeItem = {
            name: 'README.md',
            path: 'README.md',
            type: 'file'
        };
        const result = [readmeItem, ...fileTree];
        console.log('API file tree result:', JSON.stringify(result, null, 2));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read samples directory' });
    }
});
// Serve README as HTML
app.get('/sample/README.md', async (req, res) => {
    const readmePath = path_1.default.join(__dirname, '..', 'README.md');
    if (fs_1.default.existsSync(readmePath)) {
        // Read and convert markdown to HTML using marked
        const markdown = fs_1.default.readFileSync(readmePath, 'utf-8');
        const htmlContent = await marked_1.marked.parse(markdown);
        const html = (0, server_impl_1.generateReadmeHtml)(htmlContent);
        res.send(html);
    }
    else {
        res.status(404).send('README not found');
    }
});
app.get('/sample/:path(*)', (req, res) => {
    const samplePath = path_1.default.join(__dirname, '..', 'samples', req.params.path);
    if (fs_1.default.existsSync(samplePath)) {
        res.sendFile(samplePath);
    }
    else {
        res.status(404).send('Sample not found');
    }
});
// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
// Update the server to use the HTTP server
server.listen(PORT, '0.0.0.0', () => {
    console.log(server_impl_1.LogMessages.serverRunning(PORT));
    console.log(server_impl_1.LogMessages.websocketReady);
});
