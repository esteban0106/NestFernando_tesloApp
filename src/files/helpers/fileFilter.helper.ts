
export const fileFilterHelp = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function
) => {

  if (!file) {
    return callback(new Error('No file provided!'), false);
  }

  const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;

  if (file.originalname.match(allowedExtensions)) {
    return callback(null, true);
  }

  callback(null, false);
}
// export const fileSizeLimit = 1024 * 1024 * 5; // 5MB limit
// export const destinationPath = './uploads'; // Directory to save uploaded files