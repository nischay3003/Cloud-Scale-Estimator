
export interface QuestionnaireData {
  projectType: string;
  deploymentIntent: string;
  trafficEstimate: number;
  cpuMemoryUsage: string;
  storageType: string;
  storageSize: number;
  latencyUptime: string;
  budget: number;
  growthExpectation: string;
  scalingPreference: string;
  sustainabilityPriority: boolean;
}

export interface ProviderRecommendation {
  providerName: 'AWS' | 'GCP' | 'Azure';
  compute: {
    service: string;
    instance: string;
    count: number;
  };
  storage: {
    service: string;
    capacity: string;
  };
  scalingStrategy: string;
  estimatedMonthlyCost: number;
  deploymentSuggestion: string;
  ecoFriendlyRegion: {
    region: string;
    justification: string;
  };
  pros: string[];
  cons: string[];
}

export interface RecommendationResponse {
  providerRecommendations: ProviderRecommendation[];
  summary: string;
}
