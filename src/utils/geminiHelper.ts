import { GeminiModelType } from '../types';

export const GEMINI_MODELS: {
  id: GeminiModelType;
  name: string;
  badge: string;
  desc: string;
  recommended?: boolean;
}[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    badge: 'Mặc định - Siêu nhanh',
    desc: 'Tốc độ phản hồi tức thì, tối ưu quota miễn phí, thông minh và tiết kiệm tài nguyên.',
    recommended: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    badge: 'Tư duy sâu',
    desc: 'Khả năng suy luận phức tạp, phân tích hành vi học sinh và soạn văn bản chuyên sâu.',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Dự phòng cao cấp',
    desc: 'Ổn định, đáng tin cậy khi các phiên bản Preview đang có lưu lượng truy cập cao.',
  },
];

export const FALLBACK_CHAIN: GeminiModelType[] = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

const STORAGE_API_KEY = 'gemini_api_key';
const STORAGE_SELECTED_MODEL = 'gemini_selected_model';

export const getStoredApiKey = (): string => {
  try {
    return localStorage.getItem(STORAGE_API_KEY) || '';
  } catch {
    return '';
  }
};

export const setStoredApiKey = (key: string): void => {
  try {
    localStorage.setItem(STORAGE_API_KEY, key.trim());
  } catch (e) {
    console.error('Cannot save Gemini API Key', e);
  }
};

export const getStoredModel = (): GeminiModelType => {
  try {
    const saved = localStorage.getItem(STORAGE_SELECTED_MODEL) as GeminiModelType;
    if (saved && FALLBACK_CHAIN.includes(saved)) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'gemini-3-flash-preview';
};

export const setStoredModel = (model: GeminiModelType): void => {
  try {
    localStorage.setItem(STORAGE_SELECTED_MODEL, model);
  } catch (e) {
    console.error('Cannot save Gemini Model', e);
  }
};

interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  onModelAttempt?: (model: GeminiModelType, attemptIndex: number) => void;
}

export interface GenerateResult {
  text: string;
  usedModel: GeminiModelType;
}

/**
 * Execute content generation with automatic Fallback and clear raw error reporting.
 */
export async function callGeminiWithFallback(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('Vui lòng cài đặt Gemini API Key trong phần Cài đặt trước khi sử dụng tính năng AI.');
  }

  const initialModel = getStoredModel();
  // Ensure the user's chosen model is tried first, followed by other fallback models
  const modelsToTry: GeminiModelType[] = [
    initialModel,
    ...FALLBACK_CHAIN.filter((m) => m !== initialModel),
  ];

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    if (options.onModelAttempt) {
      options.onModelAttempt(currentModel, i);
    }

    try {
      // Direct REST API fetch to ensure compatibility across Vite, Vercel SPA and offline environments
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
      
      const payload: any = {
        contents: [
          {
            parts: [{ text: options.prompt }],
          },
        ],
      };

      if (options.systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorStatus = response.status;
        const errorMessage = errorData?.error?.message || response.statusText;
        const errorDetails = errorData?.error?.status ? ` [${errorData.error.status}]` : '';
        throw new Error(`${errorStatus}${errorDetails}: ${errorMessage}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('API không trả về nội dung hợp lệ.');
      }

      return {
        text: generatedText,
        usedModel: currentModel,
      };
    } catch (err: any) {
      console.warn(`[Gemini AI] Model ${currentModel} gặp sự cố:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback chain
    }
  }

  // If all models failed, throw with raw error
  throw new Error(`Tất cả các model AI đều gặp lỗi. Chi tiết: ${lastError?.message || 'Không rõ nguyên nhân'}`);
}
