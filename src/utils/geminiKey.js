/**
 * Utility helper to manage and rotate Gemini API keys.
 * Supports multiple API keys with automatic failover and model cascade.
 */

export const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash'
];

/**
 * Returns all configured Gemini API keys in rotation priority:
 * 1. User custom key from localStorage (if set)
 * 2. VITE_GEMINI_API_KEY_1 from .env
 * 3. VITE_GEMINI_API_KEY_2 from .env
 * 4. VITE_GEMINI_API_KEY from .env
 */
export function getAllGeminiApiKeys() {
  const keys = [];

  const userKey = localStorage.getItem('GEMINI_API_KEY');
  if (userKey && userKey.trim().length > 0) {
    keys.push(userKey.trim());
  }

  const envKey1 = import.meta.env.VITE_GEMINI_API_KEY_1;
  if (envKey1 && envKey1.trim().length > 0) {
    keys.push(envKey1.trim());
  }

  const envKey2 = import.meta.env.VITE_GEMINI_API_KEY_2;
  if (envKey2 && envKey2.trim().length > 0) {
    keys.push(envKey2.trim());
  }

  const defaultKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (defaultKey && defaultKey.trim().length > 0) {
    keys.push(defaultKey.trim());
  }

  // Deduplicate keys
  return [...new Set(keys)];
}

/**
 * Returns the primary active key (or first available key in the rotation pool)
 */
export function getGeminiApiKey() {
  const keys = getAllGeminiApiKeys();
  return keys.length > 0 ? keys[0] : '';
}

/**
 * Executes an operation with automatic Gemini API key rotation and model failover.
 * @param {Function} operation - async (apiKey, modelName) => result
 * @returns {Promise<any>}
 */
export async function executeWithGeminiRotation(operation) {
  const keys = getAllGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error('No Gemini API key configured. Please configure an API key in Settings or .env.');
  }

  let lastError = null;

  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    for (let m = 0; m < GEMINI_MODELS.length; m++) {
      const modelName = GEMINI_MODELS[m];
      try {
        const result = await operation(key, modelName);
        return result;
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini Rotation] Key ${k + 1}/${keys.length} with model "${modelName}" failed:`, err?.message || err);
      }
    }
  }

  throw lastError || new Error('All Gemini API keys and models in rotation failed.');
}

export function setGeminiApiKey(key) {
  if (key && typeof key === 'string') {
    localStorage.setItem('GEMINI_API_KEY', key.trim());
  } else {
    localStorage.removeItem('GEMINI_API_KEY');
  }
}

export function removeGeminiApiKey() {
  localStorage.removeItem('GEMINI_API_KEY');
}

export function hasCustomGeminiApiKey() {
  const userKey = localStorage.getItem('GEMINI_API_KEY');
  return !!(userKey && userKey.trim().length > 0);
}

export function hasDefaultGeminiApiKey() {
  const keys = getAllGeminiApiKeys();
  return keys.length > 0;
}

export function hasAnyGeminiApiKey() {
  return getAllGeminiApiKeys().length > 0;
}
