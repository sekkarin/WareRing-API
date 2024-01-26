import * as multer from 'multer';

export const storage = (path: string) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      const typeArray = file.mimetype.split('/');
      const fileType = typeArray[1];

      if (fileType == 'jpg' || fileType == 'png') {
        cb(null, `./upload/image/${path}`);
      } else if (fileType == 'pdf') {
        cb(null, `./upload/pdf/${path}`);
      }
      
    },
    filename: function (req, file, cb) {
      const uniqueSuffix =
        Date.now() + '-' + Math.round(Math.random() * 1000000000);
      cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    },
  });
