import type { Message } from "@shared/schema";

export interface ChatCompletionChunk {
  content: string;
  done: boolean;
}

export interface ProviderConfig {
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export interface ChatProvider {
  streamCompletion(
    messages: Message[],
    config: ProviderConfig,
    onChunk: (chunk: ChatCompletionChunk) => void,
    signal?: AbortSignal
  ): Promise<string>;
}
