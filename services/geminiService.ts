
import { GoogleGenAI, Type } from "@google/genai";
import type { QuestionnaireData, RecommendationResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// Shape returned by your Flask backend
type BackendProviderPlan = {
  provider: string;          // "AWS" | "GCP" | "Azure"
  compute: string;           // e.g., "1–2 x t3.micro / t4g.micro instances ..."
  storage: string;           // e.g., "Amazon S3 (~10 GB, ...)"
  scaling: string;           // e.g., "EC2 Auto Scaling Group ..."
  extras?: string[];         // optional: extra hints
};

type BackendRecommendation = {
  summary: {
    projectType: string;
    deploymentIntent: string;
    trafficEstimate: number;
    monthlyBudget: number;
    text: string;
  };
  resourceEstimate: {
    cpuCores: number;
    memoryGb: number;
  };
  providers: BackendProviderPlan[];
};


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

async function fetchBackendPlan(data: QuestionnaireData): Promise<BackendRecommendation> {
  const payload = {
    projectType: data.projectType,
    deploymentIntent: data.deploymentIntent,
    trafficEstimate: data.trafficEstimate,
    monthlyBudget: data.budget,
    cpuMemoryProfile: data.cpuMemoryUsage,  // backend expects low/medium/high mapping
    storageType: data.storageType,
    storageSizeGb: data.storageSize,
    latencyUptime: data.latencyUptime,
    growthExpectation: data.growthExpectation,
    scalingPreference: data.scalingPreference,
    sustainabilityPriority: data.sustainabilityPriority,
  };

  const res = await fetch("https://smart-scaling-backend.onrender.com/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }

  const json = await res.json();
  return json as BackendRecommendation;
}

function buildPrompt(
  data: QuestionnaireData,
  backendPlan: BackendRecommendation
): string {
  return `
Act as an expert Cloud Architect and System Design Companion.

I will give you:
1) The user's project requirements.
2) A base recommendation JSON generated by my own backend (ML + rule-based engine). This JSON already decides which services to use for each provider.

You MUST:
- Use the backend JSON as the source of truth for:
  - provider names (AWS, GCP, Azure),
  - compute recommendation,
  - storage recommendation,
  - scaling approach.
- You MAY:
  - infer estimated monthly cost in USD,
  - infer an eco-friendly region and justification,
  - write clear pros and cons,
  - rephrase text nicely.
- DO NOT contradict or change the core services chosen in the backend JSON (no switching from EC2 to Fargate etc.).

=====================
USER PROJECT REQUIREMENTS
=====================
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
- Sustainability is a priority: ${data.sustainabilityPriority ? "Yes" : "No"}

=====================
BACKEND BASE PLAN (DO NOT CONTRADICT)
=====================
${JSON.stringify(backendPlan, null, 2)}

=====================
YOUR TASK
=====================
Using ONLY the information above, generate a JSON that strictly follows this schema:

- "summary": string
  A brief summary of the overall recommendation and architecture approach, referencing the estimated CPU and RAM from backendPlan.resourceEstimate.

- "providerRecommendations": array of 3 items (AWS, GCP, Azure), each with:
  - providerName: "AWS" | "GCP" | "Azure"
  - compute:
      - service: pick from backend providers[*].compute (rephrase into a clear service name, e.g. "AWS EC2", "Cloud Run", "Azure App Service")
      - instance: a reasonable instance family/name that matches the backend compute string (you may infer this, e.g. "t3.micro", "e2-medium", "B1s").
      - count: initial number of instances, inferred from backendPlan and the scale of the workload.
  - storage:
      - service: based on backend providers[*].storage (e.g. "Amazon S3", "Cloud Storage", "Blob Storage")
      - capacity: string like "10 GB", "100 GB" using the scale in backendPlan.
  - scalingStrategy: natural language summary of backend providers[*].scaling.
  - estimatedMonthlyCost: a reasonable numeric estimate (USD) based on the budget, traffic and complexity.
  - deploymentSuggestion: a managed deployment service suggestion (e.g., Elastic Beanstalk, Cloud Run, App Service) coherent with compute.
  - ecoFriendlyRegion:
      - region: region string (e.g. "us-west-2 (Oregon)")
      - justification: 1–2 lines explaining why this region is eco-friendly or sensible.
  - pros: 2–3 advantages for this provider in this context.
  - cons: 2–3 drawbacks or considerations.

IMPORTANT:
- Do NOT output anything except the JSON object.
- Follow the provided JSON schema exactly (field names and types).
`;
}



// function buildPrompt(data: QuestionnaireData): string {
//   return `
//     Act as an expert Cloud Architect and System Design Companion. Your task is to analyze the following project requirements and provide detailed, cost-effective, scalable, and sustainable cloud infrastructure recommendations for AWS, GCP, and Azure.

//     Project Requirements:
//     - Project Type: ${data.projectType}
//     - Deployment Intent: ${data.deploymentIntent}
//     - Estimated Concurrent Users / Requests per second: ${data.trafficEstimate}
//     - Typical CPU & Memory Usage: ${data.cpuMemoryUsage}
//     - Storage Type & Needs: ${data.storageType}
//     - Required Storage Size: ${data.storageSize} GB
//     - Latency & Uptime Needs: ${data.latencyUptime}
//     - Monthly Budget (USD): $${data.budget}
//     - Expected Growth: ${data.growthExpectation}
//     - Scaling Preference: ${data.scalingPreference}
//     - Sustainability is a priority: ${data.sustainabilityPriority ? 'Yes' : 'No'}

//     Based on these requirements, generate a JSON object that strictly adheres to the provided schema. For each cloud provider (AWS, GCP, and Azure), provide specific, actionable recommendations. The recommendations should be practical and tailored to the user's input, especially the budget constraints and sustainability preference.
//   `;
// }


// export async function getCloudRecommendation(data: QuestionnaireData): Promise<RecommendationResponse> {
//   const prompt = buildPrompt(data);

//   try {
//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: prompt,
//       config: {
//         responseMimeType: "application/json",
//         responseSchema: recommendationSchema,
//       },
//     });

//     const jsonText = response.text.trim();
//     // Although responseMimeType is set to JSON, it's safer to parse it
//     const result = JSON.parse(jsonText);
    
//     // Basic validation to ensure the structure matches our type
//     if (!result.providerRecommendations || !Array.isArray(result.providerRecommendations)) {
//         throw new Error("Invalid response structure from API.");
//     }
    
//     return result as RecommendationResponse;
//   } catch (error) {
//     console.error("Error calling Gemini API:", error);
//     throw new Error("Failed to get recommendations from the AI service.");
//   }
// }
async function callWithRetry(payload, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(payload);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, 1000 * (i + 1))); // exponential backoff
    }
  }
}

export async function getCloudRecommendation(
  data: QuestionnaireData
): Promise<RecommendationResponse> {
  try {
    // 1) First call your Python backend
    const backendPlan = await fetchBackendPlan(data);

    // 2) Build prompt using user input + backend plan
    const prompt = buildPrompt(data, backendPlan);

    // 3) Call Gemini as before, but now it's guided by your backend
    const response = await callWithRetry({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recommendationSchema,
      }
    });


    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (!result.providerRecommendations || !Array.isArray(result.providerRecommendations)) {
      throw new Error("Invalid response structure from API.");
    }
    console.log("Result:",result)

    return result as RecommendationResponse;
  } catch (error) {
    console.error("Error in getCloudRecommendation:", error);
    throw new Error("Failed to get recommendations from the AI service.");
  }
}

