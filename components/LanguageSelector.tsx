import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Language } from '../types';

interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
  options: Language[];
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, options }) => {
  return (
    <div className="relative inline-block text-left">
      <div className="group relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as Language)}
          className="appearance-none cursor-pointer bg-transparent py-2 pl-3 pr-10 text-sm font-semibold text-gray-700 hover:text-indigo-600 focus:outline-none transition-colors"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 group-hover:text-indigo-600">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
};