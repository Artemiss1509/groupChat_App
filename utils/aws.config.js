import { S3Client } from "@aws-sdk/client-s3";
import { AWS_BUCKET_NAME, IAM_KEY, IAM_SECRET } from "./env.js";

export const s3Client = new S3Client({
    region: "ap-south-2",
    credentials: {
        accessKeyId: IAM_KEY,
        secretAccessKey: IAM_SECRET
    }
});

export const BUCKET_NAME = AWS_BUCKET_NAME;