# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **tomoπgraphy** - a modern photo gallery website with cyberpunk aesthetics that combines a static frontend with powerful Node.js-based upload management tools. The site features random artwork display, chronological galleries, and AWS S3 integration for scalable image hosting.

## Development Commands

```bash
# Install dependencies and setup (first time)
npm install
npm run setup

# Development workflow
npm run dev                    # Start local server (http://localhost:8000)
npm run upload ./image.jpg -- --title "Title"  # Upload single image
npm run batch-upload ./folder/                 # Upload entire folder
npm run deploy                 # Deploy to GitHub Pages

# Advanced upload options
npm run batch-upload ./folder/ --use-file-date  # Preserve original dates
npm run batch-upload ./folder/ --dry-run        # Preview without uploading
npm run generate-responsive    # Create responsive image variants

# Setup variations
npm run setup-new             # Setup with new S3 bucket creation
npm run clean                 # Cleanup utility
```

## Architecture

### Frontend (Static Site)
- **Platform**: GitHub Pages hosting from `/docs` directory
- **Technology**: Pure HTML/CSS/JS (no framework dependencies)
- **Entry Point**: `docs/index.html`
- **Core Logic**: `docs/js/gallery.js` contains the PixelGallery class
- **Data Source**: `docs/data/artworks.json` (artwork metadata)
- **Styling**: Cyberpunk-inspired design with green gradients

### Backend (Node.js CLI Tools)
- **Image Processing**: Sharp.js for thumbnails, WebP conversion, responsive variants
- **Storage**: AWS S3 with multi-format strategy (original, thumbnail, webp, responsive)
- **Upload Pipeline**: Metadata extraction → S3 upload → JSON database update
- **Requirements**: Node.js ≥14.0.0

### Data Flow
1. **Content Creation**: Images uploaded via `scripts/upload.js` or `scripts/batch-upload.js`
2. **Processing**: Sharp.js generates multiple formats and sizes
3. **Storage**: All variants stored in S3 with structured URLs
4. **Metadata**: `docs/data/artworks.json` updated with image data and S3 URLs
5. **Frontend**: Gallery loads metadata and displays images with responsive srcsets

## Configuration

### Setup Process
- Run `npm run setup` to create `config/config.json` from `config/config_template.json`
- **Never commit `config/config.json`** - contains AWS credentials
- Template includes S3 settings, image quality settings, and site metadata

### Image Processing Settings
- **WebP Quality**: 80% (configurable in config.json)
- **JPEG Quality**: 90% (configurable in config.json)
- **Responsive Breakpoints**: 640w, 768w, 1024w, 1366w, 1920w, 2560w
- **Thumbnail Size**: Configurable maximum dimensions

## Key Implementation Details

### Frontend Architecture (`docs/js/gallery.js`)
- **PixelGallery Class**: Main controller handling view switching and image loading
- **Responsive Images**: Uses srcset/sizes for optimal loading across devices
- **Modal System**: Full-screen viewer with keyboard navigation (←/→ arrows, Esc)
- **View Modes**: Random display and chronological gallery with year organization
- **Mobile Support**: Touch-friendly controls and responsive layouts

### Upload Architecture (`scripts/`)
- **Atomic Operations**: Each upload is a complete transaction (process → upload → metadata update)
- **Error Handling**: Comprehensive validation and rollback capabilities
- **Progress Tracking**: Real-time feedback for batch operations
- **File Validation**: Supports common image formats with Sharp.js processing

### Metadata Structure
Each artwork entry in `artworks.json` contains:
- Basic info: id, title, description, date, dimensions, fileSize
- S3 URLs: original, thumbnail, webp, responsive variants
- Organization: year/month for chronological display

## Common Development Tasks

### Adding New Features to Gallery
- Frontend changes go in `docs/js/gallery.js` (PixelGallery class)
- Styling changes in `docs/styles.css`
- Test locally with `npm run dev`

### Modifying Upload Pipeline
- Core logic in `scripts/upload.js` and `scripts/batch-upload.js`
- Image processing settings in `config/config.json`
- Always test with `--dry-run` flag first

### Deployment
- `npm run deploy` commits changes and pushes to GitHub
- GitHub Pages automatically rebuilds from `/docs` directory
- No build process needed - static files served directly