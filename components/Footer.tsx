import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-transparent mt-12">
      <div className="container mx-auto px-4 md:px-8 py-4 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Cloud Smart Estimator. Powered by Gemini.</p>
      </div>
    </footer>
  );
};