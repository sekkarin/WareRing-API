import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';

@Injectable()
export class ManageFileS3Service {
  private s3: S3Client;
  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_S3_BUCKET_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_S3_ACCESS_KEY'),
        secretAccessKey:
          this.configService.getOrThrow<string>('AWS_S3_SECRET_KEY'),
      },
    });
  }
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const bucketName =
      this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');
    const bucketRegion = this.configService.getOrThrow<string>(
      'AWS_S3_BUCKET_REGION',
    );
    const buffer = await sharp(file.buffer)
      .resize(250, 250, { fit: 'contain' })
      .toBuffer();
    const key = `${Date.now().toString()}-${file.originalname}`;
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read',
    };

    try {
      await this.s3.send(new PutObjectCommand(params));
      const fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${key}`;
      return fileUrl;
      // return this.getImage(key);
    } catch (error) {
      console.log(error);

      throw new InternalServerErrorException('Error uploading file to S3');
    }
  }

  async deleteImage(pathImage: string) {
    const bucketName =
      this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');
    // 'https://warering-project.s3.ap-southeast-1.amazonaws.com/1716626173212-89cb297a-1c5d-44de-8c33-6a20cf143034.jpg'

    const pathImageSplit = pathImage.split('com/')[1];
    try {
      const deleteObjectParams: DeleteObjectCommandInput = {
        Bucket: bucketName,
        Key: pathImageSplit,
      };
      await this.s3.send(new DeleteObjectCommand(deleteObjectParams));
      return true;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error not can delete image in S3',
      );
    }
  }
}
