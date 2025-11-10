import { CohereClient } from "cohere-ai";
import type { ChatProvider, ProviderConfig, ChatCompletionChunk } from "./base-provider";
import type { Message } from "@shared/schema";

let cohereClient: CohereClient | null = null;

function getCohere(): CohereClient {
  if (!cohereClient) {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      throw new Error("COHERE_API_KEY is not set in environment variables");
    }
    cohereClient = new CohereClient({ token: apiKey });
  }
  return cohereClient;
}

export class CohereProvider implements ChatProvider {
  async streamCompletion(
    messages: Message[],
    config: ProviderConfig,
    onChunk: (chunk: ChatCompletionChunk) => void,
    signal?: AbortSignal
  ): Promise<string> {
    try {
      const cohere = getCohere();
      
      // Use chatStream for streaming responses
      const stream = await cohere.chatStream({
        model: config.model || "command-r-08-2024",
        message: messages[messages.length - 1]?.content || "",
        chatHistory: messages.slice(0, -1).map(msg => ({
          role: msg.role === "user" ? "USER" : "CHATBOT",
          message: msg.content,
        })),
      });

      let fullContent = "";

      for await (const chunk of stream) {
        if (signal?.aborted) {
          throw new Error("Stream aborted");
        }

        if (chunk.eventType === "text-generation") {
          const content = chunk.text || "";
          if (content) {
            fullContent += content;
            onChunk({
              content,
              done: false,
            });
          }
        }

        if (chunk.eventType === "stream-end") {
          onChunk({ content: "", done: true });
        }
      }

      return fullContent;
    } catch (error: any) {
      if (error.name === "AbortError" || signal?.aborted) {
        throw new Error("Stream aborted");
      }
      console.error("❌ Cohere API Error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw error;
    }
  }
}

// Legacy function for backward compatibility
export async function generateCohereResponse(prompt: string): Promise<string> {
  try {
    const cohere = getCohere();
    const response = await cohere.generate({
      model: "command-r-plus-08-2024",
      prompt,
      maxTokens: 300,
    });

    const text = response.generations?.[0]?.text?.trim() || "";
    return text.length ? text : "⚠️ Empty response from Cohere";
  } catch (error: any) {
    console.error("❌ Cohere API Error:", error);
    return "⚠️ Error generating response from Cohere.";
  }
}
