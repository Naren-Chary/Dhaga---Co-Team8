import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
const modelFastName = process.env.OPENROUTER_MODEL_FAST || 'google/gemini-2.5-flash';
const modelStrongName = process.env.OPENROUTER_MODEL_STRONG || 'meta-llama/llama-3.3-70b-instruct';

export const isOpenRouterConfigured = () => {
  return Boolean(
    openRouterApiKey &&
    openRouterApiKey !== 'your-openrouter-api-key' &&
    !openRouterApiKey.includes('placeholder')
  );
};

/**
 * Model 1: Fast & Cost-Efficient
 * Used for high-volume structured signal extraction, classification, and text normalization.
 */
export const getFastModel = (options = {}) => {
  if (!isOpenRouterConfigured()) {
    console.warn('[OpenRouter] API Key not set. Fast Model calls will fail if invoked without mock.');
  }

  return new ChatOpenAI({
    modelName: modelFastName,
    temperature: options.temperature ?? 0.1,
    maxTokens: options.maxTokens ?? 1024,
    apiKey: openRouterApiKey || 'mock-key',
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://dhaga-co.internal',
        'X-Title': 'Dhaga RTO Risk Intelligence',
      },
    },
    ...options,
  });
};

/**
 * Model 2: Stronger Reasoning Model
 * Used for ambiguous cases, complex multi-signal synthesis, intervention selection, and customer message generation.
 */
export const getStrongModel = (options = {}) => {
  if (!isOpenRouterConfigured()) {
    console.warn('[OpenRouter] API Key not set. Strong Model calls will fail if invoked without mock.');
  }

  return new ChatOpenAI({
    modelName: modelStrongName,
    temperature: options.temperature ?? 0.2,
    maxTokens: options.maxTokens ?? 3072,
    apiKey: openRouterApiKey || 'mock-key',
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://dhaga-co.internal',
        'X-Title': 'Dhaga RTO Risk Intelligence',
      },
    },
    ...options,
  });
};

export const getAIConfigStatus = () => {
  return {
    configured: isOpenRouterConfigured(),
    modelFast: modelFastName,
    modelStrong: modelStrongName,
    gateway: 'https://openrouter.ai/api/v1',
  };
};
