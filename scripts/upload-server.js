#!/usr/bin/env node

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

// We'll use exec to call upload script instead of requiring it

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Serve the upload tool
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../upload-tool.html'));
});

// Upload endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`Processing upload: ${req.file.originalname}`);
        
        // Use the existing upload script
        const result = await uploadImageFile(req.file);
        
        // Clean up temporary file
        await fs.unlink(req.file.path);
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: result
        });

    } catch (error) {
        console.error('Upload error:', error);
        
        // Clean up temporary file on error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error cleaning up temporary file:', unlinkError);
            }
        }
        
        res.status(500).json({
            error: 'Upload failed',
            message: error.message
        });
    }
});

// Git commit and push endpoint
app.post('/api/commit', async (req, res) => {
    try {
        const { fileCount } = req.body;
        const commitMessage = `Add ${fileCount} new image${fileCount > 1 ? 's' : ''} via upload tool

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

        console.log('Starting git commit and push...');
        
        // Add all changes
        await execAsync('git add .');
        console.log('Files added to git');
        
        // Check if there are changes to commit
        try {
            const { stdout } = await execAsync('git diff --cached --name-only');
            if (!stdout.trim()) {
                return res.json({
                    success: true,
                    message: 'No changes to commit'
                });
            }
        } catch (error) {
            console.log('Checking git diff failed, proceeding with commit');
        }
        
        // Commit changes
        await execAsync(`git commit -m "${commitMessage}"`);
        console.log('Changes committed');
        
        // Push to remote
        await execAsync('git push');
        console.log('Changes pushed to remote');
        
        res.json({
            success: true,
            message: 'Successfully committed and pushed changes'
        });

    } catch (error) {
        console.error('Git commit/push error:', error);
        res.status(500).json({
            error: 'Git commit/push failed',
            message: error.message
        });
    }
});

// Function to process uploaded file using existing upload logic
async function uploadImageFile(file) {
    const tempImagePath = file.path;
    const originalName = file.originalname;
    
    // Create a temporary script to use the existing upload functionality
    const uploadScript = path.join(__dirname, 'upload.js');
    
    // Execute the upload script with the temporary file
    const titleName = path.parse(originalName).name;
    const command = `node "${uploadScript}" "${tempImagePath}" --title "${titleName}"`;
    
    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd: path.join(__dirname, '..')
        });
        
        if (stderr) {
            console.warn('Upload warnings:', stderr);
        }
        
        return {
            originalName,
            message: stdout,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(`Upload script failed: ${error.message}`);
    }
}

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'Maximum file size is 50MB'
            });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     tomoπgraphy Upload Server                  ║
╠════════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                        ║
║  Upload tool: http://localhost:${PORT}/                             ║
║                                                                ║
║  Features:                                                     ║
║  • Drag & drop image upload                                    ║
║  • Automatic image processing                                  ║
║  • S3 upload integration                                       ║
║  • Auto git commit & push                                      ║
║                                                                ║
║  Press Ctrl+C to stop the server                              ║
╚════════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down upload server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\nShutting down upload server...');
    process.exit(0);
});