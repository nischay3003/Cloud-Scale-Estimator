import React from 'react';
import type { RecommendationResponse, ProviderRecommendation } from '../types';
import { AWSIcon, AzureIcon, CheckCircleIcon, GCPIcon, XCircleIcon, CpuChipIcon, ServerStackIcon, CircleStackIcon, PaperAirplaneIcon, GlobeAltIcon, DocumentMagnifyingGlassIcon } from './icons';

interface ResultsDisplayProps {
  recommendations: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
}

const ProviderIcon: React.FC<{ provider: string }> = ({ provider }) => {
    switch(provider) {
        case 'AWS': return <AWSIcon className="w-8 h-8" />;
        case 'GCP': return <GCPIcon className="w-8 h-8" />;
        case 'Azure': return <AzureIcon className="w-8 h-8" />;
        default: return null;
    }
};

const SkeletonCard: React.FC = () => (
    <div className="bg-slate-800 rounded-2xl shadow-md p-6 border border-slate-700 animate-pulse">
        <div className="flex justify-between items-center mb-4">
            <div className="h-8 w-32 bg-slate-700 rounded"></div>
            <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
        </div>
        <div className="space-y-4">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            <div className="mt-8 h-10 bg-slate-700 rounded-lg w-1/3 mx-auto"></div>
            <div className="mt-6 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
                <div>
                  <div className="h-5 bg-slate-700 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-full"></div>
                </div>
                <div>
                  <div className="h-5 bg-slate-700 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-full"></div>
                </div>
            </div>
        </div>
    </div>
);

const getProviderStyles = (provider: string) => {
    switch(provider) {
        case 'AWS': return 'border-aws text-aws';
        case 'GCP': return 'border-gcp text-gcp';
        case 'Azure': return 'border-azure text-azure';
        default: return 'border-slate-600 text-slate-300';
    }
}

const RecommendationCard: React.FC<{ rec: ProviderRecommendation }> = ({ rec }) => {
    const providerStyles = getProviderStyles(rec.providerName);

    return (
    <div className={`bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 border-t-4 ${providerStyles.split(' ')[0]} flex flex-col`}>
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-2xl font-bold ${providerStyles.split(' ')[1]}`}>{rec.providerName}</h3>
                <ProviderIcon provider={rec.providerName} />
            </div>
            
            <div className="space-y-4 text-slate-400 flex-grow">
                {[
                    { icon: CpuChipIcon, label: 'Compute', value: `${rec.compute.service} - ${rec.compute.instance} (x${rec.compute.count})` },
                    { icon: CircleStackIcon, label: 'Storage', value: `${rec.storage.service} - ${rec.storage.capacity}` },
                    { icon: ServerStackIcon, label: 'Scaling', value: rec.scalingStrategy },
                    { icon: PaperAirplaneIcon, label: 'Deployment', value: rec.deploymentSuggestion },
                    { icon: GlobeAltIcon, label: 'Eco-Region', value: `${rec.ecoFriendlyRegion.region}`, special: true },
                ].map(({ icon: Icon, label, value, special }) => (
                    <div key={label} className="flex items-start text-sm">
                        <Icon className={`w-5 h-5 mr-3 mt-0.5 ${special ? 'text-success' : 'text-primary'} flex-shrink-0`} />
                        <div>
                            <span className="font-semibold text-slate-200">{label}:</span> {value}
                            {label === 'Eco-Region' && <span className="text-xs italic text-slate-500 block">({rec.ecoFriendlyRegion.justification})</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="mt-auto bg-slate-700/50 p-6 rounded-b-2xl">
            <div className="text-center mb-6">
                <p className="text-sm text-slate-400">Estimated Monthly Cost</p>
                <p className="text-4xl font-extrabold text-success tracking-tight">${rec.estimatedMonthlyCost.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div>
                    <h4 className="font-semibold mb-2 text-slate-100">Pros</h4>
                    <ul className="space-y-1.5">
                        {rec.pros.map((pro, i) => <li key={i} className="flex items-start"><CheckCircleIcon className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />{pro}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-2 text-slate-100">Cons</h4>
                    <ul className="space-y-1.5">
                        {rec.cons.map((con, i) => <li key={i} className="flex items-start"><XCircleIcon className="w-4 h-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" />{con}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    </div>
)};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ recommendations, isLoading, error }) => {
  if (isLoading) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Crafting your cloud architecture...</h2>
            <p className="text-slate-400 mb-8">This may take a moment.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/40 border-l-4 border-red-500 text-red-400 p-4 rounded-r-lg" role="alert">
        <p className="font-bold">An Error Occurred</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!recommendations) {
    return (
        <div className="text-center text-slate-400 p-10 border-2 border-dashed border-slate-700 rounded-2xl h-full flex flex-col justify-center items-center">
            <DocumentMagnifyingGlassIcon className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-200">Ready for your recommendation?</h3>
            <p>Fill out the form on the left to generate a personalized cloud architecture plan.</p>
        </div>
    );
  }

  return (
    <section>
        <div className="bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-700 mb-10">
            <h2 className="text-3xl font-extrabold text-slate-100">Your Custom Cloud Blueprint</h2>
            <p className="mt-4 text-lg text-slate-300">{recommendations.summary}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-stretch">
            {recommendations.providerRecommendations.map((rec) => (
                <RecommendationCard key={rec.providerName} rec={rec} />
            ))}
        </div>
    </section>
  );
};