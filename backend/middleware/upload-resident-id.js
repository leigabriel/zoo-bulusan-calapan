const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create dedicated folder for resident ID images
const residentIdDir = path.join(__dirname, '../uploads/resident-id-images');
if (!fs.existsSync(residentIdDir)) {
    fs.mkdirSync(residentIdDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, residentIdDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'resident-id-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const uploadResidentId = upload.single('residentIdImage');

const handleResidentIdUpload = (req, res, next) => {
    uploadResidentId(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 5MB.'
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
};

// Utility function to save base64 image
const saveBase64Image = async (base64Data, userId) => {
    if (!base64Data) return null;
    
    try {
        // Remove data URL prefix if present
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
        
        // Get file extension from base64 header
        const matches = base64Data.match(/^data:image\/(\w+);base64,/);
        const ext = matches ? matches[1] : 'png';
        
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `resident-id-${userId || 'guest'}-${uniqueSuffix}.${ext}`;
        const filePath = path.join(residentIdDir, filename);
        
        // Write file
        fs.writeFileSync(filePath, base64Content, 'base64');
        
        // Return the relative path for storage in database
        return `/uploads/resident-id-images/${filename}`;
    } catch (error) {
        console.error('Error saving base64 image:', error);
        return null;
    }
};

module.exports = {
    upload,
    handleResidentIdUpload,
    saveBase64Image,
    residentIdDir
};
