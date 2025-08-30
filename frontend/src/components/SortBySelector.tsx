"use client";

import { Listbox } from "@headlessui/react";
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { checkLocationPermission } from "@/utils/Geo";

export type SortOption = 'startTime' | 'closest' | 'priceAsc' | 'priceDesc' | 'rating';

interface SortBySelectorProps {
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  className?: string;
}

const SortBySelector = ({ sortBy, setSortBy, className = "" }: SortBySelectorProps) => {
  const handleSortChange = async (newSortBy: SortOption) => {
    // If user selects "closest", check for location permission first
    if (newSortBy === 'closest') {
      try {
        const hasPermission = await checkLocationPermission();
        if (!hasPermission) {
          // Permission denied - don't change the sort option
          alert('Location access is required to sort by closest golf courses. Please enable location permissions in your browser settings and reload the page.');
          return;
        }
      } catch (error) {
        console.error('Failed to check location permission:', error);
        alert('Unable to access location. Please ensure location services are enabled and reload the page.');
        return;
      }
    }
    
    // Permission granted or not needed for this sort option
    setSortBy(newSortBy);
  };

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case 'startTime':
        return 'Start Time';
      case 'closest':
        return 'Closest';
      case 'priceAsc':
        return 'Price (Low to High)';
      case 'priceDesc':
        return 'Price (High to Low)';
      case 'rating':
        return 'Rating';
      default:
        return '';
    }
  };

  const getSortIcon = (option: SortOption) => {
    switch (option) {
      case 'startTime':
      case 'closest':
      case 'priceAsc':
        return <ArrowUp className="w-3 h-3 text-slate-500" />;
      case 'priceDesc':
      case 'rating':
        return <ArrowDown className="w-3 h-3 text-slate-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-3 flex-shrink-0 w-full sm:w-auto ${className}`}>
      <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
            Sort By
          </span>
          <span className="px-1 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded tracking-wide">
            NEW
          </span>
        </div>
        <Listbox value={sortBy} onChange={handleSortChange}>
          <div className="relative flex-shrink-0">
            <Listbox.Button className="px-3 sm:px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors w-full sm:min-w-[180px] max-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 text-xs sm:text-sm truncate">
                  {getSortLabel(sortBy)}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {getSortIcon(sortBy)}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-auto focus:outline-none max-h-60 w-full sm:min-w-[200px] max-w-[250px]">
              <Listbox.Option
                value="startTime"
                className={({ active }) =>
                  `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                    active ? 'bg-primary text-primary-foreground' : 'text-slate-700'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span className="font-medium">Start Time</span>
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </>
                )}
              </Listbox.Option>
              <Listbox.Option
                value="closest"
                className={({ active }) =>
                  `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                    active ? 'bg-primary text-primary-foreground' : 'text-slate-700'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Closest</span>
                      <span className="px-1 py-0.5 text-[9px] font-bold bg-orange-500 text-white rounded tracking-wide">
                        NEW
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </>
                )}
              </Listbox.Option>
              <Listbox.Option
                value="priceAsc"
                className={({ active }) =>
                  `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                    active ? 'bg-primary text-primary-foreground' : 'text-slate-700'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span className="font-medium">Price (Low to High)</span>
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />
                      {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </>
                )}
              </Listbox.Option>
              <Listbox.Option
                value="priceDesc"
                className={({ active }) =>
                  `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                    active ? 'bg-primary text-primary-foreground' : 'text-slate-700'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span className="font-medium">Price (High to Low)</span>
                    <div className="flex items-center gap-1">
                      <ArrowDown className="w-3 h-3" />
                      {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </>
                )}
              </Listbox.Option>
              <Listbox.Option
                value="rating"
                className={({ active }) =>
                  `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                    active ? 'bg-primary text-primary-foreground' : 'text-slate-700'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span className="font-medium">Rating</span>
                    <div className="flex items-center gap-1">
                      <ArrowDown className="w-3 h-3" />
                      {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </>
                )}
              </Listbox.Option>
            </Listbox.Options>
          </div>
        </Listbox>
      </div>
    </div>
  );
};

export default SortBySelector;
