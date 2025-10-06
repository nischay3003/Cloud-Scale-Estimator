
import { GoogleGenAI, Type } from "@google/genai";
import type { QuestionnaireData, RecommendationResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recommendationSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A brief summary of the overall recommendation and architecture approach.",
    },
    providerRecommendations: {
      type: Type.ARRAY,
      description: "An array of recommendations for each of the three major cloud providers: AWS, GCP, and Azure.",
      items: {
        type: Type.OBJECT,
        properties: {
          providerName: {
            type: Type.STRING,
            enum: ["AWS", "GCP", "Azure"],
            description: "The name of the cloud provider.",
          },
          compute: {
            type: Type.OBJECT,
            description: "Recommended compute service and configuration.",
            properties: {
              service: { type: Type.STRING, description: "e.g., AWS EC2, GCP Compute Engine, Azure Virtual Machines." },
              instance: { type: Type.STRING, description: "e.g., t3.medium, e2-medium, Standard_B2s." },
              count: { type: Type.INTEGER, description: "The recommended number of initial instances." },
            },
            required: ["service", "instance", "count"],
          },
          storage: {
            type: Type.OBJECT,
            description: "Recommended storage service and configuration.",
            properties: {
              service: { type: Type.STRING, description: "e.g., AWS S3, GCP Cloud Storage, Azure Blob Storage." },
              capacity: { type: Type.STRING, description: "e.g., 500 GB, 1 TB." },
            },
            required: ["service", "capacity"],
          },
          scalingStrategy: {
            type: Type.STRING,
            description: "Suggested scaling strategy (e.g., Horizontal Auto-Scaling with Load Balancer, Vertical Scaling).",
          },
          estimatedMonthlyCost: {
            type: Type.NUMBER,
            description: "A rough estimate of the monthly cost in USD for the recommended setup.",
          },
          deploymentSuggestion: {
            type: Type.STRING,
            description: "Recommendation for a managed deployment service for simplicity, e.g., AWS Elastic Beanstalk, GCP App Engine, Azure App Service.",
          },
          ecoFriendlyRegion: {
            type: Type.OBJECT,
            description: "Suggestion for a region with a low carbon footprint.",
            properties: {
              region: { type: Type.STRING, description: "e.g., us-west1 (Oregon), europe-north1 (Finland)." },
              justification: { type: Type.STRING, description: "Briefly explain why this region is a good eco-friendly choice." },
            },
            required: ["region", "justification"],
          },
          pros: {
            type: Type.ARRAY,
            description: "2-3 key advantages of using this provider for the given project requirements.",
            items: { type: Type.STRING },
          },
          cons: {
            type: Type.ARRAY,
            description: "2-3 potential drawbacks or considerations for this provider.",
            items: { type: Type.STRING },
          },
        },
        required: ["providerName", "compute", "storage", "scalingStrategy", "estimatedMonthlyCost", "deploymentSuggestion", "ecoFriendlyRegion", "pros", "cons"],
      },
    },
  },
  required: ["summary", "providerRecommendations"],
};


function buildPrompt(data: QuestionnaireData): string {
  return `
    Act as an expert Cloud Architect and System Design Companion. Your task is to analyze the following project requirements and provide detailed, cost-effective, scalable, and sustainable cloud infrastructure recommendations for AWS, GCP, and Azure.

    Project Requirements:
    - Project Type: ${data.projectType}
    - Deployment Intent: ${data.deploymentIntent}
    - Estimated Concurrent Users / Requests per second: ${data.trafficEstimate}
    - Typical CPU & Memory Usage: ${data.cpuMemoryUsage}
    - Storage Type & Needs: ${data.storageType}
    - Required Storage Size: ${data.storageSize} GB
    - Latency & Uptime Needs: ${data.latencyUptime}
    - Monthly Budget (USD): $${data.budget}
    - Expected Growth: ${data.growthExpectation}
    - Scaling Preference: ${data.scalingPreference}
    - Sustainability is a priority: ${data.sustainabilityPriority ? 'Yes' : 'No'}

    Based on these requirements, generate a JSON object that strictly adheres to the provided schema. For each cloud provider (AWS, GCP, and Azure), provide specific, actionable recommendations. The recommendations should be practical and tailored to the user's input, especially the budget constraints and sustainability preference.
  `;
}


export async function getCloudRecommendation(data: QuestionnaireData): Promise<RecommendationResponse> {
  const prompt = buildPrompt(data);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendationSchema,
      },
    });

    const jsonText = response.text.trim();
    // Although responseMimeType is set to JSON, it's safer to parse it
    const result = JSON.parse(jsonText);
    
    // Basic validation to ensure the structure matches our type
    if (!result.providerRecommendations || !Array.isArray(result.providerRecommendations)) {
        throw new Error("Invalid response structure from API.");
    }
    
    return result as RecommendationResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get recommendations from the AI service.");
  }
}
