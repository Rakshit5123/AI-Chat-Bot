import OpenAI from "openai";
import type { ChatProvider, ProviderConfig, ChatCompletionChunk } from "./base-provider";
import type { Message } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export class OpenAIProvider implements ChatProvider {
  async streamCompletion(
    messages: Message[],
    config: ProviderConfig,
    onChunk: (chunk: ChatCompletionChunk) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (config.systemPrompt) {
      chatMessages.push({
        role: "system",
        content: config.systemPrompt,
      });
    }

    chatMessages.push(
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }))
    );

    const stream = await getOpenAI().chat.completions.create(
      {
        model: config.model,
        messages: chatMessages,
        stream: true,
        max_completion_tokens: config.maxTokens || 8192,
      },
      { signal }
    );

    let fullContent = "";

    try {
      for await (const chunk of stream) {
        if (signal?.aborted) {
          throw new Error("Stream aborted");
        }

        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullContent += content;
          onChunk({
            content,
            done: false,
          });
        }
      }

      onChunk({ content: "", done: true });
      return fullContent;
    } catch (error: any) {
      if (error.name === "AbortError" || signal?.aborted) {
        throw new Error("Stream aborted");
      }
      throw error;
    }
  }
}
