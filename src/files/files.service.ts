import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {

  getStaticFile(imageName: string) {

    try {
      const path = join(__dirname, '../../static/uploads', imageName);
      if (!existsSync(path)) {
        throw new Error(`File ${imageName} not found`);
      }
      return path
    } catch (error) {
      throw new BadRequestException(`Error retrieving file: ${error.message}`);
    }
  }
}
