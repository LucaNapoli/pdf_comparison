import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { readdir, unlink } from 'fs/promises';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// Endpoint to get the list of previously uploaded PDF files
app.get('/api/files', async (req, res) => {
    try {
        const files = await readdir(path.join(__dirname, 'uploads'));
        const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
        res.json(pdfFiles);
    } catch (error) {
        console.error('Error reading uploads directory:', error);
        // If the directory doesn't exist, return an empty array
        if (error.code === 'ENOENT') {
            return res.json([]);
        }
        res.status(500).json({ message: 'Error listing files.' });
    }
});

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });

// Endpoint to handle file uploads and ingestion
app.post('/upload', upload.array('pdfs'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
    }

    const uploadedFiles = req.files.map(f => f.path);
    console.log('Uploaded files:', uploadedFiles);

    try {
        // Ingest each file
        for (const file of uploadedFiles) {
            await runScript('ingest-data.js', [file]);
        }
        
        res.json({ message: 'Files ingested successfully.', files: uploadedFiles.map(f => path.basename(f)) });
    } catch (error) {
        console.error('Ingestion error:', error);
        res.status(500).json({ message: 'Error during file ingestion.' });
    }
});

// Endpoint to delete a specific PDF file
app.delete('/api/files/:filename', async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);
    const dbFilePath = `uploads/${filename}`;

    try {
        // Delete from database
        await runScript('delete-document.js', [dbFilePath]);
        
        // Delete from filesystem
        await unlink(filePath);

        res.json({ message: `Successfully deleted ${filename}.` });
    } catch (error) {
        console.error(`Error deleting file ${filename}:`, error);
        res.status(500).json({ message: `Error deleting file ${filename}.` });
    }
});

// Endpoint to handle queries
app.post('/query', async (req, res) => {
    const { question, files } = req.body;
    if (!question || !files || files.length < 1) {
        return res.status(400).json({ message: 'A question and at least one file are required.' });
    }

    const filePaths = files.map(f => path.join('uploads', f));
    console.log('Querying with:', { question, files: filePaths });

    try {
        const answer = await runScript('generate-response.js', [question, ...filePaths]);
        res.json({ answer });
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ message: 'Error generating response.' });
    }
});

// New endpoint to fetch a specific text chunk for preview
app.get('/api/preview', async (req, res) => {
    const { chunkId } = req.query;
    if (!chunkId) {
        return res.status(400).json({ message: 'Chunk ID is required.' });
    }

    const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);
    try {
        await client.connect();
        const db = client.db("rag_db");
        const collection = db.collection("test");
        
        const document = await collection.findOne(
            { chunk_id: chunkId },
            { projection: { _id: 0, text: 1, source_pdf: 1, page_number: 1 } }
        );

        if (document) {
            res.json({ 
                text: document.text,
                source: path.basename(document.source_pdf),
                page: document.page_number
            });
        } else {
            res.status(404).json({ message: 'Preview text not found.' });
        }
    } catch (error) {
        console.error('Preview Error:', error);
        res.status(500).json({ message: 'Failed to fetch preview.' });
    } finally {
        await client.close();
    }
});

function runScript(scriptName, args) {
    return new Promise((resolve, reject) => {
        const process = spawn('node', ['--env-file=.env', scriptName, ...args]);
        let output = '';
        let errorOutput = '';

        process.stdout.on('data', (data) => {
            output += data.toString();
            console.log(`[${scriptName} stdout]: ${data}`);
        });

        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`[${scriptName} stderr]: ${data}`);
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`Script ${scriptName} exited with code ${code}\n${errorOutput}`));
            }
        });
    });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
