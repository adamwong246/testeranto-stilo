"use strict";
// Pure utility functions without external dependencies
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogMessages = exports.SCSS_COMPILE_COMMAND = exports.WebSocketMessages = void 0;
exports.createRelativePath = createRelativePath;
exports.prepareFileTreeWithReadme = prepareFileTreeWithReadme;
exports.generateReadmeHtml = generateReadmeHtml;
// Helper to create a relative path from a full path and samples directory
function createRelativePath(filePath, samplesDir, pathSep) {
    return filePath.replace(samplesDir + pathSep, '').split(pathSep).join('/');
}
// Helper to prepare file tree result with README at the top
function prepareFileTreeWithReadme(fileTree) {
    const readmeItem = {
        name: 'README.md',
        path: 'README.md',
        type: 'file'
    };
    return [readmeItem, ...fileTree];
}
// WebSocket message templates
exports.WebSocketMessages = {
    fileTreeUpdate: (data) => JSON.stringify({ type: 'fileTreeUpdate', data }),
    fileChanged: (path) => JSON.stringify({ type: 'fileChanged', path }),
    styleChanged: () => JSON.stringify({ type: 'styleChanged' }),
    test: () => JSON.stringify({ type: 'test', message: 'Connection established' })
};
// SCSS compilation command
exports.SCSS_COMPILE_COMMAND = 'npx sass src/style.scss public/style.css';
// HTML template for README
function generateReadmeHtml(htmlContent) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stilo - README</title>
    <link href="/style.css" rel="stylesheet">
    <style>
        .readme-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .readme-content h1 {
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
        }
        .readme-content code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
        }
        .readme-content pre {
            background: #f8f8f8;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .readme-content pre code {
            background: transparent;
            padding: 0;
        }
    </style>
</head>
<body>
    <div class="readme-content">
        ${htmlContent}
    </div>
</body>
</html>`;
}
// Log messages
exports.LogMessages = {
    scssCompiled: 'SCSS compiled successfully',
    scssFailed: 'Failed to compile SCSS:',
    clientConnected: 'Client connected',
    clientDisconnected: 'Client disconnected',
    websocketError: 'WebSocket error:',
    fileTreeError: 'Error broadcasting file tree update:',
    initialTreeError: 'Error building initial file tree:',
    styleWatcherError: 'Style watcher error:',
    watcherError: 'Watcher error:',
    serverRunning: (port) => `Server running at http://localhost:${port}`,
    websocketReady: 'WebSocket server is ready',
    fileAdded: (path) => `File ${path} has been added`,
    fileChanged: (path) => `File ${path} has been changed`,
    fileRemoved: (path) => `File ${path} has been removed`,
    dirAdded: (path) => `Directory ${path} has been added`,
    dirRemoved: (path) => `Directory ${path} has been removed`,
    styleChanged: (path) => `Style file ${path} has been changed`
};
