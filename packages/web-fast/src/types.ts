export interface SiteRow {
  providerName: string;
  providerId: string;
  modelName: string;
  modelId: string;
  family: string | null;
  toolCall: boolean;
  reasoning: boolean;
  input: string[];
  output: string[];
  cost: {
    input: number | null;
    output: number | null;
    reasoning: number | null;
    cacheRead: number | null;
    cacheWrite: number | null;
    inputAudio: number | null;
    outputAudio: number | null;
  } | null;
  limit: {
    context: number;
    input: number | null;
    output: number;
  };
  structuredOutput: boolean | null;
  temperature: boolean;
  openWeights: boolean;
  knowledge: string | null;
  releaseDate: string;
  lastUpdated: string;
  searchText: string;
}

export interface SiteData {
  generatedAt: string;
  rowCount: number;
  rows: SiteRow[];
}
