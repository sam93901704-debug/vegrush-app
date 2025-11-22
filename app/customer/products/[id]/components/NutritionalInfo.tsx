'use client';

import { motion } from 'framer-motion';

interface NutritionalInfoProps {
  category: string;
}

// Mock nutritional data - replace with real data when available
const NUTRITIONAL_DATA: Record<string, {
  calories?: string;
  protein?: string;
  carbs?: string;
  fiber?: string;
  vitamins?: string[];
}> = {
  'Vegetables': {
    calories: '~25 kcal',
    protein: '~2g',
    carbs: '~5g',
    fiber: '~2g',
    vitamins: ['Vitamin C', 'Vitamin K', 'Folate'],
  },
  'Fruits': {
    calories: '~50 kcal',
    protein: '~1g',
    carbs: '~12g',
    fiber: '~2.5g',
    vitamins: ['Vitamin C', 'Potassium', 'Antioxidants'],
  },
  'Greens': {
    calories: '~15 kcal',
    protein: '~1.5g',
    carbs: '~3g',
    fiber: '~1.5g',
    vitamins: ['Vitamin A', 'Vitamin K', 'Iron'],
  },
};

export default function NutritionalInfo({ category }: NutritionalInfoProps) {
  const nutrition = NUTRITIONAL_DATA[category] || {
    calories: 'Varies',
    protein: 'Varies',
    carbs: 'Varies',
    fiber: 'Varies',
    vitamins: ['Rich in nutrients'],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg
          className="w-6 h-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Nutritional Information
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Per 100g (approximate values for {category.toLowerCase()})
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {nutrition.calories && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Calories</p>
            <p className="text-lg font-bold text-gray-900">{nutrition.calories}</p>
          </div>
        )}
        {nutrition.protein && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Protein</p>
            <p className="text-lg font-bold text-gray-900">{nutrition.protein}</p>
          </div>
        )}
        {nutrition.carbs && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Carbs</p>
            <p className="text-lg font-bold text-gray-900">{nutrition.carbs}</p>
          </div>
        )}
        {nutrition.fiber && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Fiber</p>
            <p className="text-lg font-bold text-gray-900">{nutrition.fiber}</p>
          </div>
        )}
      </div>

      {nutrition.vitamins && nutrition.vitamins.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Rich in:</p>
          <div className="flex flex-wrap gap-2">
            {nutrition.vitamins.map((vitamin, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
              >
                {vitamin}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 italic">
        * Nutritional values are approximate and may vary
      </p>
    </motion.div>
  );
}

