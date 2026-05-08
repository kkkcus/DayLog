import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다'));
  },
});

router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '이미지가 없습니다' });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'daylog', transformation: [{ width: 800, crop: 'limit' }] },
        (err, result) => (err ? reject(err) : resolve(result))
      ).end(req.file.buffer);
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
