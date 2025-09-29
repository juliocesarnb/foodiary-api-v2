import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  endpoint: 'http://localhost:4571', // porta do seu S3 local
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',    // qualquer valor é aceito pelo S3 local
    secretAccessKey: 'test',
  },
  forcePathStyle: true,      // obrigatório para buckets locais
});
