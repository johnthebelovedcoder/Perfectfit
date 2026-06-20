import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

@Injectable()
export class UploadsService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: config.get<string>("CLOUDINARY_API_KEY"),
      api_secret: config.get<string>("CLOUDINARY_API_SECRET"),
    });
  }

  generateUploadSignature(folder: "submissions" | "items") {
    const timestamp = Math.round(Date.now() / 1000);
    const uploadPreset = this.config.get<string>("CLOUDINARY_UPLOAD_PRESET") ?? "";

    const params = {
      folder: `thread/${folder}`,
      timestamp,
      upload_preset: uploadPreset,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      this.config.get<string>("CLOUDINARY_API_SECRET") ?? ""
    );

    return {
      signature,
      timestamp,
      uploadPreset,
      cloudName: this.config.get<string>("CLOUDINARY_CLOUD_NAME"),
      apiKey: this.config.get<string>("CLOUDINARY_API_KEY"),
      folder: `thread/${folder}`,
    };
  }

  async migrateImage(publicId: string) {
    const newPublicId = publicId.replace("thread/submissions/", "thread/items/");
    await cloudinary.uploader.rename(publicId, newPublicId);
    return newPublicId;
  }

  async deleteImage(publicId: string) {
    await cloudinary.uploader.destroy(publicId);
  }
}
