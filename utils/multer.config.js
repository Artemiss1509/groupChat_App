import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx|txt/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(file.originalname.toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
};

export const upload = multer({
    storage:  storage,
    limits: {
        fileSize: 50 * 1024 * 1024
    },
    fileFilter:  fileFilter
});