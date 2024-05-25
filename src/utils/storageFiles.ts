import * as multer from 'multer';
import * as fs from 'fs';
export const storageFiles = () =>
  multer.diskStorage({
    destination: '/uploads/profiles',
    filename: function (req, file, cb) {
      const uniqueSuffix =
        Date.now() + '-' + Math.round(Math.random() * 1000000000);
      cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    },
  });
