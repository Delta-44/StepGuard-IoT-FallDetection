import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'stepguard_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'heic'],
    public_id: (req: any, file: any) => `user-${req.params.id}-${Date.now()}`,
  } as any, // Aserción de tipo necesaria para algunos parámetros específicos
});

const upload = multer({ storage: storage });

export default upload;
