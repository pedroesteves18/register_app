import { Router } from "express";    
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const router = Router()

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

router.get('/s3', async (req, res) => {
    try {
      const key = req.query.key
      
      if (!key) {
        return res.status(400).send('Missing key parameter')
      }
      
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
      
      // Generate a pre-signed URL that expires in 1 hour
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
      
      // Redirect to the pre-signed URL
      res.redirect(signedUrl)
      
    } catch (error) {
      res.status(500).send(`Error generating pre-signed URL: ${error.message}`)
    }
  })

export default router;