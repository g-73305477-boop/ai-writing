export interface PracticeWord {
  word: string;
}

export interface CanvasRef {
  clear: () => void;
  toDataURL: () => string;
}