import { s3Client } from './s3Client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

async function run() {
  const fileContent = fs.readFileSync('/home/julio/Downloads/teste.m4a');

  const command = new PutObjectCommand({
    Bucket: 'jstacklab-v3-foodiary-uploads',
    Key: 'uploads/teste.m4a',
    Body: fileContent,
  });

  const response = await s3Client.send(command);
  console.log('Upload response:', response);
}

run();
