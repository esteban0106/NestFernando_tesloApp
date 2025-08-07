
export const fileNamerHelp = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function
) => {

  if (!file) {
    return callback(new Error('No file provided!'), false);
  }

  const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;

  const fileExtension = file.originalname.split('.').pop();
  if (file.originalname.match(allowedExtensions)) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${file.fieldname}-${uniqueSuffix}.${fileExtension}`;
    return callback(null, fileName);
  }

  callback(null, false);
}
// export const fileSizeLimit = 1024 * 1024 * 5; // 5MB limit
// export const destinationPath = './uploads'; // Directory to save uploaded files