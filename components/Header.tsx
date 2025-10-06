import React from 'react';
import { CloudIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-700">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center">
        <CloudIcon className="w-10 h-10 text-primary" />
        <h1 className="ml-3 text-2xl md:text-3xl font-bold text-slate-100">
          Cloud Smart Estimator
        </h1>
      </div>
    </header>
  );
};