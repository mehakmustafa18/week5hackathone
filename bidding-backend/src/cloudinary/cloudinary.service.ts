import { Injectable } from '@nestjs/common';
import 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier'; // Alternative is using Node's stream.Readable.from(file.buffer)

@Injectable()
export class CloudinaryService {
  uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'cars' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      // Convert buffer to stream and pipe to upload stream using streamifier
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
