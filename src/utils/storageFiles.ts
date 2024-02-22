import * as multer from 'multer';

export const storageFiles = () =>
  multer.diskStorage({
    destination(req, file, callback) {
      const typeArray = file.mimetype.split('/');
      callback(null, `./uploads/profiles`);
     
    },
    filename: function (req, file, cb) {
      const uniqueSuffix =
        Date.now() + '-' + Math.round(Math.random() * 1000000000);
      cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    },
    
  });