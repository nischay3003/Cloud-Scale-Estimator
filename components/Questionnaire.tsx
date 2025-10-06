import React, { useState } from 'react';
import type { QuestionnaireData } from '../types';
import {
  PROJECT_TYPES,
  DEPLOYMENT_INTENTS,
  CPU_MEMORY_USAGE,
  STORAGE_TYPES,
  LATENCY_UPTIME,
  GROWTH_EXPECTATIONS,
  SCALING_PREFERENCES,
} from '../constants';
import { Tooltip } from './Tooltip';
import { InfoIcon, RocketIcon } from './icons';

interface QuestionnaireProps {
  onSubmit: (data: QuestionnaireData) => void;
  isLoading: boolean;
}

const initialData: QuestionnaireData = {
  projectType: PROJECT_TYPES[0],
  deploymentIntent: DEPLOYMENT_INTENTS[0],
  trafficEstimate: 100,
  cpuMemoryUsage: CPU_MEMORY_USAGE[0],
  storageType: STORAGE_TYPES[0],
  storageSize: 10,
  latencyUptime: LATENCY_UPTIME[0],
  budget: 50,
  growthExpectation: GROWTH_EXPECTATIONS[0],
  scalingPreference: SCALING_PREFERENCES[0],
  sustainabilityPriority: false,
};

const ToggleSwitch: React.FC<{
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, checked, onChange }) => (
  <label htmlFor={name} className="flex items-center cursor-pointer">
    <div className="relative">
      <input type="checkbox" id={name} name={name} className="sr-only" checked={checked} onChange={onChange} />
      <div className="block bg-slate-600 w-14 h-8 rounded-full"></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'translate-x-6 bg-primary' : ''}`}></div>
    </div>
    <div className="ml-3 text-slate-300 font-medium">{label}</div>
  </label>
);

const RangeInput: React.FC<{
  label: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string;
  tooltipText: string;
}> = ({ label, name, value, min, max, step, onChange, unit, tooltipText }) => (
  <div>
    <label htmlFor={name} className="flex items-center text-sm font-medium text-slate-300">
      {label}
      <Tooltip text={tooltipText}>
        <InfoIcon className="w-4 h-4 ml-1.5 text-slate-400 hover:text-slate-300" />
      </Tooltip>
    </label>
    <div className="flex items-center space-x-4 mt-2">
      <input
        type="range"
        id={name}
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer range-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
      />
      <span className="font-semibold text-primary w-24 text-center bg-slate-700 border border-slate-600 rounded-md py-1">
        {value.toLocaleString()} {unit}
      </span>
    </div>
  </div>
);


export const Questionnaire: React.FC<QuestionnaireProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<QuestionnaireData>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderSelect = (name: keyof QuestionnaireData, label: string, options: readonly string[]) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <select
        id={name}
        name={name}
        value={formData[name] as string}
        onChange={handleChange}
        className="w-full p-2.5 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
  
  return (
    <section className="bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-700 sticky top-24">
      <h2 className="text-3xl font-bold text-slate-100 mb-6">Cloud Requirement Analyzer</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold text-slate-400 mb-2 border-b border-slate-600 w-full pb-1">Core Details</legend>
          {renderSelect('projectType', 'Project Type', PROJECT_TYPES)}
          {renderSelect('deploymentIntent', 'Deployment Intent', DEPLOYMENT_INTENTS)}
        </fieldset>
        
        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold text-slate-400 mb-2 border-b border-slate-600 w-full pb-1">Resource Estimation</legend>
          <RangeInput label="Traffic Estimate" name="trafficEstimate" value={formData.trafficEstimate} min={10} max={10000} step={10} onChange={handleChange} unit="Users" tooltipText="Estimate the peak number of concurrent users."/>
          <RangeInput label="Monthly Budget" name="budget" value={formData.budget} min={10} max={5000} step={10} onChange={handleChange} unit="USD" tooltipText="Your estimated maximum spend per month."/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {renderSelect('cpuMemoryUsage', 'CPU & Memory', CPU_MEMORY_USAGE)}
            {renderSelect('storageType', 'Storage Type', STORAGE_TYPES)}
          </div>
          <RangeInput label="Storage Size" name="storageSize" value={formData.storageSize} min={1} max={1000} step={1} onChange={handleChange} unit="GB" tooltipText="Required storage capacity in Gigabytes."/>
        </fieldset>

        <fieldset className="space-y-6">
          <legend className="text-lg font-semibold text-slate-400 mb-2 border-b border-slate-600 w-full pb-1">Strategy & Priorities</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {renderSelect('latencyUptime', 'Latency & Uptime', LATENCY_UPTIME)}
            {renderSelect('growthExpectation', 'Growth Expectation', GROWTH_EXPECTATIONS)}
          </div>
          {renderSelect('scalingPreference', 'Scaling Preference', SCALING_PREFERENCES)}
          <ToggleSwitch label="Prioritize Sustainability" name="sustainabilityPriority" checked={formData.sustainabilityPriority} onChange={handleChange} />
        </fieldset>

        <div className="pt-4">
          <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-gradient-to-r from-primary to-violet-600 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg hover:from-primary/90 hover:to-violet-600/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 ease-in-out disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:shadow-none">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
                <>
                    <RocketIcon className="w-5 h-5 mr-2" />
                    Generate Recommendations
                </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};