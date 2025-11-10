import type { ChatProvider, ProviderConfig, ChatCompletionChunk } from "./base-provider";
import type { Message } from "@shared/schema";

export class DialogflowProvider implements ChatProvider {
  async streamCompletion(
    messages: Message[],
    config: ProviderConfig,
    onChunk: (chunk: ChatCompletionChunk) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      throw new Error("No messages provided");
    }

    const response = `[Dialogflow Integration] This is a simulated response to: "${lastMessage.content}". To enable real Dialogflow integration, configure your Dialogflow credentials and update this provider implementation.`;

    const words = response.split(" ");
    let fullContent = "";

    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) {
        throw new Error("Stream aborted");
      }

      const word = words[i] + (i < words.length - 1 ? " " : "");
      fullContent += word;

      onChunk({
        content: word,
        done: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    onChunk({ content: "", done: true });
    return fullContent;
  }
}
