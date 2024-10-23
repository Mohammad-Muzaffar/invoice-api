import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define the path to the files directory
const filesDir = "./public/temp";

// Create the directory if it doesn't exist
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
}

// Define the storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filesDir);  // Ensure the directory path is correct
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);  // Use the original file name
    }
});

export const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },  // Optional: limit file size to 10MB
});