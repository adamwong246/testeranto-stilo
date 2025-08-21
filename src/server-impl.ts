// Pure utility functions without external dependencies

// Helper to create a relative path from a full path and samples directory
export function createRelativePath(filePath: string, samplesDir: string, pathSep: string): string {
    return filePath.replace(samplesDir + pathSep, '').split(pathSep).join('/');
}

// Helper to prepare file tree result with README at the top
export function prepareFileTreeWithReadme(fileTree: any[]): any[] {
    const readmeItem = {
        name: 'README.md',
        path: 'README.md',
        type: 'file' as const
    };
    return [readmeItem, ...fileTree];
}

// WebSocket message templates
export const WebSocketMessages = {
    fileTreeUpdate: (data: any) => JSON.stringify({ type: 'fileTreeUpdate', data }),
    fileChanged: (path: string) => JSON.stringify({ type: 'fileChanged', path }),
    styleChanged: () => JSON.stringify({ type: 'styleChanged' }),
    test: () => JSON.stringify({ type: 'test', message: 'Connection established' })
};

// SCSS compilation command
export const SCSS_COMPILE_COMMAND = 'npx sass src/style.scss public/style.css';

// Function to compile SCSS using esbuild
export async function compileSCSSWithEsbuild() {
    try {
        // Dynamically import esbuild and sassPlugin
        const esbuild = require('esbuild');
        const { sassPlugin } = require('esbuild-sass-plugin');
        
        await esbuild.build({
            entryPoints: ['src/style.scss'],
            bundle: true,
            outfile: 'public/style.css',
            plugins: [sassPlugin()],
            loader: {
                '.ttf': 'file',
                '.woff': 'file',
                '.woff2': 'file',
                '.eot': 'file'
            }
        });
        console.log(LogMessages.scssCompiled);
    } catch (error) {
        console.error(LogMessages.scssFailed, error);
    }
}

// HTML template for README
export function generateReadmeHtml(htmlContent: string): string {
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
export const LogMessages = {
    scssCompiled: 'SCSS compiled successfully',
    scssFailed: 'Failed to compile SCSS:',
    clientConnected: 'Client connected',
    clientDisconnected: 'Client disconnected',
    websocketError: 'WebSocket error:',
    fileTreeError: 'Error broadcasting file tree update:',
    initialTreeError: 'Error building initial file tree:',
    styleWatcherError: 'Style watcher error:',
    watcherError: 'Watcher error:',
    serverRunning: (port: number) => `Server running at http://localhost:${port}`,
    websocketReady: 'WebSocket server is ready',
    fileAdded: (path: string) => `File ${path} has been added`,
    fileChanged: (path: string) => `File ${path} has been changed`,
    fileRemoved: (path: string) => `File ${path} has been removed`,
    dirAdded: (path: string) => `Directory ${path} has been added`,
    dirRemoved: (path: string) => `Directory ${path} has been removed`,
    styleChanged: (path: string) => `Style file ${path} has been changed`
};
