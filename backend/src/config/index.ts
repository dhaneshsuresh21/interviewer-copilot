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

  if (!config.deepgramApiKey || !config.deepgramApiKey.trim()) {
    errors.push('DEEPGRAM_API_KEY is required and must not be empty');
  }

  if ((!config.openaiApiKey || !config.openaiApiKey.trim()) && 
      (!config.googleApiKey || !config.googleApiKey.trim())) {
    errors.push('Either OPENAI_API_KEY or GOOGLE_API_KEY is required and must not be empty');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
