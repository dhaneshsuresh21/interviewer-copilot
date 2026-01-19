import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export function validateConfig() {
  const errors: string[] = [];

  if (!config.deepgramApiKey) {
    errors.push('DEEPGRAM_API_KEY is required');
  }

  if (!config.openaiApiKey && !config.googleApiKey) {
    errors.push('Either OPENAI_API_KEY or GOOGLE_API_KEY is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
