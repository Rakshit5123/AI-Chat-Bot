import { OpenAIProvider } from "./openai-provider";
import { CohereProvider } from "./cohere-provider";
import type { ChatProvider } from "./base-provider";

const providers: Record<string, ChatProvider> = {
  openai: new OpenAIProvider(),
  cohere: new CohereProvider(),
};

export function getProvider(providerName: string): ChatProvider {
  const provider = providers[providerName.toLowerCase()];
  if (!provider) {
    console.warn(`Provider "${providerName}" not found, falling back to cohere`);
    return providers.cohere;
  }
  return provider;
}
