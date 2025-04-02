import React from 'react';
import { useBudget } from '@/contexts/BudgetContext';

const BudgetCategoriesTabs: React.FC = () => {
  const { categories, activeCategory, setActiveCategory, loading, isInitialized } = useBudget();

  // Show loading skeleton
  if (loading) {
    return (
      <div className="relative border-b border-gray-200 pb-4">
        <div className="sm:flex sm:items-baseline">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="mt-4 sm:mt-0 sm:ml-10 flex space-x-8">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show placeholder with just "All Categories" when initializing
  if (!isInitialized || categories.length === 0) {
    return (
      <div className="relative border-b border-gray-200">
        <div className="sm:flex sm:items-baseline">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Budget Categories
          </h3>
          <div className="mt-4 sm:mt-0 sm:ml-10">
            <nav className="-mb-px flex space-x-8">
              <a 
                href="#" 
                className="whitespace-nowrap pb-4 px-1 border-b-2 border-blue-600 font-medium text-sm text-blue-600"
                onClick={(e) => e.preventDefault()}
              >
                All Categories
              </a>
            </nav>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border-b border-gray-200">
      <div className="sm:flex sm:items-baseline">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Budget Categories
        </h3>
        <div className="mt-4 sm:mt-0 sm:ml-10">
          <nav className="-mb-px flex space-x-8">
            <a 
              href="#" 
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${activeCategory === null 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveCategory(null);
              }}
            >
              All Categories
            </a>

            {categories.map((category) => (
              <a 
                key={category.id}
                href="#" 
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${activeCategory === category.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveCategory(category.id);
                }}
              >
                {category.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default BudgetCategoriesTabs;
