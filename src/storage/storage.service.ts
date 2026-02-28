import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';

/** 允许的图片 MIME 类型 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** 允许的视频 MIME 类型 */
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

/** 图片最大大小：5MB */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** 视频最大大小：50MB */
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

/** 预签名 URL 有效期：15 分钟 */
const PRESIGNED_URL_EXPIRES_IN = 15 * 60;

/**
 * 对象存储服务，封装 R2 Presigned URL 生成能力。
 */
@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || '';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';

    if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucketName || !this.publicUrl) {
      throw new Error('R2 环境变量未完整配置');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  /**
   * 生成上传预签名 URL。
   * @param userId 用户ID，用于隔离存储路径
   * @param filename 原始文件名
   * @param contentType 文件 MIME 类型
   * @returns uploadUrl（预签名上传URL）、objectKey（存储路径）、publicUrl（公开访问URL）
   */
  async getUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; objectKey: string; publicUrl: string }> {
    // 校验文件类型
    const validation = this.validateFileType(contentType);
    if (!validation.valid) {
      throw new BadRequestException('不支持的文件类型');
    }

    // 生成唯一 objectKey
    const ext = extname(filename) || this.getExtensionFromMime(contentType);
    const objectKey = `uploads/${userId}/${randomUUID()}${ext}`;

    // 创建 PUT 命令
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    // 生成预签名 URL
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    });

    return {
      uploadUrl,
      objectKey,
      publicUrl: `${this.publicUrl}/${objectKey}`,
    };
  }

  /**
   * 校验文件类型，返回是否允许及类型分类。
   */
  validateFileType(mimetype: string): { valid: boolean; isImage: boolean; isVideo: boolean } {
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimetype);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimetype);
    return { valid: isImage || isVideo, isImage, isVideo };
  }

  /**
   * 根据文件类型获取最大允许大小（字节）。
   */
  getMaxFileSize(isImage: boolean, isVideo: boolean): number {
    if (isImage) return MAX_IMAGE_SIZE;
    if (isVideo) return MAX_VIDEO_SIZE;
    return 0;
  }

  /**
   * 从 MIME 类型推断文件扩展名。
   */
  private getExtensionFromMime(mimetype: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
    };
    return mimeToExt[mimetype] || '';
  }
}