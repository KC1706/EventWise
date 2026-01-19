import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Store the googleAI plugin instance
let googleAIPlugin: ReturnType<typeof googleAI> | null = null;

// Lazy initialization of Genkit
let aiInstance: ReturnType<typeof genkit> | null = null;

function getAI() {
  if (aiInstance) {
    return aiInstance;
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    if (typeof window === 'undefined') {
      console.warn('GOOGLE_AI_API_KEY is not set. AI features will not work.');
    }
    // Return a mock object that will throw when methods are called
    return null;
  }

  try {
    // Initialize plugin - no apiVersion needed, Genkit handles it automatically
    googleAIPlugin = googleAI({
      apiKey: apiKey,
    });
    aiInstance = genkit({
      plugins: [googleAIPlugin],
    });
    return aiInstance;
  } catch (error) {
    console.error('Genkit initialization error:', error);
    return null;
  }
}

// Helper function to get the model reference using the new recommended API
// In @genkit-ai/google-genai, models are accessed via googleAI.model()
export function getGeminiModel(modelName: string = 'gemini-2.5-flash-lite') {
  // Ensure AI instance is initialized first (this registers the plugin with Genkit)
  const instance = getAI();
  if (!instance) {
    throw new Error('AI is not configured. Please set GOOGLE_AI_API_KEY environment variable.');
  }
  
  // Ensure plugin is initialized (this sets up the API key)
  if (!googleAIPlugin) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not set.');
    }
    googleAIPlugin = googleAI({
      apiKey: apiKey,
    });
  }
  
  // In the new API, googleAI.model() is a static method that returns a model reference
  // The model method is available on the googleAI import
  try {
    const model = googleAI.model(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} returned undefined`);
    }
    return model;
  } catch (error) {
    console.error(`[Genkit] Error getting model ${modelName}:`, error);
    throw new Error(`Failed to get model ${modelName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export the googleAI plugin instance for direct model access if needed
export function getGoogleAIPlugin() {
  if (!googleAIPlugin) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not set.');
    }
    googleAIPlugin = googleAI({
      apiKey: apiKey,
    });
  }
  return googleAIPlugin;
}

// Export ai as a proxy that includes all methods
export const ai = new Proxy({} as ReturnType<typeof genkit>, {
  get(target, prop) {
    const instance = getAI();
    if (!instance) {
      throw new Error('AI is not configured. Please set GOOGLE_AI_API_KEY environment variable.');
    }
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});
