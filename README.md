# Stilo - Testeranto Branding & Styling

Stilo is the comprehensive styling system for the Testeranto testing framework. It provides a consistent visual language across all Testeranto components and tools.

## Features

- **Custom Typography**: Uses "M PLUS Rounded 1c" font family with multiple weights
- **Responsive Design**: Works across desktop and mobile devices
- **Theme System**: Support for light and dark themes with CSS custom properties
- **Component Library**: Pre-styled HTML elements for consistent UI
- **Real-time Preview**: Live reloading of style changes and sample content

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to http://localhost:3000

## Project Structure

```
stilo/
├── fonts/                 # Custom font files
├── public/               # Static assets and UI
├── samples/              # HTML examples demonstrating styling
├── src/                  # TypeScript server code
├── style.scss           # Main stylesheet
├── fonts.scss           # Font definitions
└── README.md            # This file
```

## Customization

Edit `style.scss` to modify the visual styling. The file uses Sass features and CSS custom properties for theming.

## Samples

The project includes various sample files demonstrating how to use the styling system:
- Typography (headings, text formatting)
- Forms (basic and advanced inputs)
- Tables (basic and complex layouts)
- Lists (ordered and unordered)
- Media (images and other media elements)

## Development

The server automatically:
- Watches for file changes in the samples directory
- Recompiles SCSS when style files are modified
- Provides real-time updates to connected clients via WebSocket
- Serves sample files with the applied styling

## License

MIT License - see LICENSE file for details
