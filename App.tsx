import React, { useState, useCallback } from 'react';
import { Questionnaire } from './components/Questionnaire';
import { ResultsDisplay } from './components/ResultsDisplay';
import type { QuestionnaireData, RecommendationResponse } from './types';
import { getCloudRecommendation } from './services/geminiService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = useCallback(async (data: QuestionnaireData) => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const result = await getCloudRecommendation(data);
      setRecommendations(result);
    } catch (e) {
      console.error(e);
      setError('An error occurred while generating recommendations. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
             <Questionnaire onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <ResultsDisplay
              recommendations={recommendations}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;