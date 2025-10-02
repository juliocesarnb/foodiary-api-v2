import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq } from 'drizzle-orm';
import { Readable } from 'node:stream';
import { s3Client } from '../clients/s3Client';
import { db } from '../db';
import { mealsTable } from '../db/schema';
import { getMealDetailsFromImage, getMealDetailsFromText, transcribeAudio } from '../services/ai';

export class ProcessMeal {
  static async process({ fileKey }: { fileKey: string }) {
    const meal = await db.query.mealsTable.findFirst({
      where: eq(mealsTable.inputFileKey, fileKey),
    });

    if (!meal) {
      throw new Error(`Meal not found for fileKey=${fileKey}`);
    }

    if (meal.status === 'failed' || meal.status === 'success') {
      console.log(`[ProcessMeal] Meal ${meal.id} already finalized with status=${meal.status}`);
      return;
    }

    await db
      .update(mealsTable)
      .set({ status: 'processing' })
      .where(eq(mealsTable.id, meal.id));

    try {
      let icon = '';
      let name = '';
      let foods: any[] = [];

      if (meal.inputType === 'audio') {
        console.log(`[ProcessMeal] Processing audio meal id=${meal.id}`);
        const audioFileBuffer = await this.downloadAudioFile(meal.inputFileKey);
        const transcription = await transcribeAudio(audioFileBuffer);
        console.log(`[ProcessMeal] Transcription result: ${transcription}`);

        const mealDetails = await getMealDetailsFromText({
          createdAt: new Date(),
          text: transcription,
        });

        icon = mealDetails.icon;
        name = mealDetails.name;
        foods = mealDetails.foods;
      }

      if (meal.inputType === 'picture') {
        console.log(`[ProcessMeal] Processing picture meal id=${meal.id}`);
        const imageURL = await this.getImageURL(meal.inputFileKey);

        const mealDetails = await getMealDetailsFromImage({
          createdAt: meal.createdAt,
          imageURL,
        });

        icon = mealDetails.icon;
        name = mealDetails.name;
        foods = mealDetails.foods;
      }

      await db
        .update(mealsTable)
        .set({
          status: 'success',
          name,
          icon,
          foods,
          errorMessage: null, // limpa erro anterior se existir
        })
        .where(eq(mealsTable.id, meal.id));

      console.log(`[ProcessMeal] Meal ${meal.id} processed successfully!`);
    } catch (error: any) {
      console.error(`[ProcessMeal] Error processing meal id=${meal.id}:`, error);

      await db
        .update(mealsTable)
        .set({ status: 'failed', errorMessage: error.message || 'Unknown error' })
        .where(eq(mealsTable.id, meal.id));
    }
  }

  private static async downloadAudioFile(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    });

    const { Body } = await s3Client.send(command);

    if (!Body || !(Body instanceof Readable)) {
      throw new Error('Cannot load the audio file.');
    }

    const chunks: Buffer[] = [];
    for await (const chunk of Body) {
      chunks.push(chunk as Buffer);
    }

    return Buffer.concat(chunks);
  }

  private static async getImageURL(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 600 });
  }
}
