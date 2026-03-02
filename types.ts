
export interface ImageState {
  original: string | null;       // Blob URL for efficient display
  originalBase64: string | null; // Base64 string for API calls
  edited: string | null;         // Blob URL for efficient display
  isProcessing: boolean;
  processingStage?: 'optimizing' | 'generating'; // Granular status
  error: string | null;
}

export interface EditHistory {
  prompt: string;
  imageUrl: string;
  timestamp: number;
}
