import OpenAI, { toFile } from 'openai';

const client = new OpenAI();

export async function transcribeAudio(fileBuffer: Buffer) {
  const transcription = await client.audio.transcriptions.create({
    model: 'whisper-1',
    language: 'pt',
    response_format: 'text',
    file: await toFile(fileBuffer, 'audio.m4a', { type: 'audio/m4a' }),
  });

  return transcription;
}

// 🔹 utilitário para validar e extrair JSON
function safeJSONParse(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI response does not contain valid JSON');
  }
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    throw new Error('Failed to parse AI JSON response');
  }
}

type GetMealDetailsFromTextParams = {
  text: string;
  createdAt: Date;
};

export async function getMealDetailsFromText({
  createdAt,
  text,
}: GetMealDetailsFromTextParams) {
  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: `
          Você é um nutricionista...
          (instruções mantidas)
        `,
      },
      {
        role: 'user',
        content: `
          Data: ${createdAt}
          Refeição: ${text}
        `,
      },
    ],
  });

  const raw = response.choices[0].message.content;
  if (!raw) {
    throw new Error('Empty AI response');
  }

  return safeJSONParse(raw);
}

type GetMealDetailsFromImageParams = {
  imageURL: string;
  createdAt: Date;
};

export async function getMealDetailsFromImage({
  createdAt,
  imageURL,
}: GetMealDetailsFromImageParams) {
  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content: `
          Meal date: ${createdAt}
          Você é um nutricionista especializado em análise de alimentos por imagem...
          (instruções mantidas)
        `,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageURL },
          },
        ],
      },
    ],
  });

  const raw = response.choices[0].message.content;
  if (!raw) {
    throw new Error('Empty AI response');
  }

  return safeJSONParse(raw);
}
