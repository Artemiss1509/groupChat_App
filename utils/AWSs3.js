import AWS from 'aws-sdk'
import { BUCKET_NAME, IAM_KEY, IAM_SECRET } from "../utils/env.js";

export async function uploadToS3(data, filename){
  const s3bucket = new AWS.S3({
    accessKeyId:IAM_KEY,
    secretAccessKey: IAM_SECRET,
    
  })

  try {
    var params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: data,
      ACL: 'public-read'
    }
    return await new Promise((resolve, reject ) => {
      s3bucket.upload(params,(error, data)=>{
        if (error){
          console.error('File upload error', error)
          reject(error)
        }else{
          resolve(data.Location)
        }
    })
    })
  } catch (error) {
    console.error("File did not get uploaded:", error)
  }
}