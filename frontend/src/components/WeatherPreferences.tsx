"use client";
import { CloudRain, Droplets, Sparkles, Wind } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

export interface WeatherPreferenceSettings {
  enabled: boolean;
  precipitationChance: string; // Human-readable: 'any', 'mostly-dry', 'dry', 'very-dry'
  precipitationAmount: string; // Human-readable: 'any', 'light-ok', 'minimal', 'none'
  windSpeed: string; // Human-readable: 'any', 'moderate', 'light', 'calm'
}

interface WeatherPreferencesProps {
  settings: WeatherPreferenceSettings;
  onChange: (settings: WeatherPreferenceSettings) => void;
  disabled?: boolean;
}

const PRECIPITATION_CHANCE_OPTIONS = [
  { 
    value: 'any', 
    label: 'Any weather', 
    description: 'No restrictions on rain chance',
    icon: '🌤️'
  },
  { 
    value: 'mostly-dry', 
    label: 'Mostly dry', 
    description: 'Less than 40% chance of rain',
    icon: '☁️'
  },
  { 
    value: 'dry', 
    label: 'Dry conditions', 
    description: 'Less than 20% chance of rain',
    icon: '🌥️'
  },
  { 
    value: 'very-dry', 
    label: 'Very dry', 
    description: 'Less than 10% chance of rain',
    icon: '☀️'
  },
];

const PRECIPITATION_AMOUNT_OPTIONS = [
  { 
    value: 'any', 
    label: 'Any amount', 
    description: 'No restrictions on rainfall',
    icon: '💧'
  },
  { 
    value: 'light-ok', 
    label: 'Light rain OK', 
    description: 'Less than 5mm (light drizzle)',
    icon: '🌦️'
  },
  { 
    value: 'minimal', 
    label: 'Minimal rain', 
    description: 'Less than 2mm (barely noticeable)',
    icon: '🌤️'
  },
  { 
    value: 'none', 
    label: 'No rain', 
    description: 'Less than 0.5mm (essentially dry)',
    icon: '☀️'
  },
];

const WIND_SPEED_OPTIONS = [
  { 
    value: 'any', 
    label: 'Any wind', 
    description: 'No restrictions on wind speed',
    icon: '🌬️'
  },
  { 
    value: 'moderate', 
    label: 'Moderate or less', 
    description: 'Less than 25 km/h (playable)',
    icon: '🍃'
  },
  { 
    value: 'light', 
    label: 'Light breeze', 
    description: 'Less than 15 km/h (minimal impact)',
    icon: '🌿'
  },
  { 
    value: 'calm', 
    label: 'Calm conditions', 
    description: 'Less than 10 km/h (barely noticeable)',
    icon: '🪶'
  },
];

export default function WeatherPreferences({ settings, onChange, disabled = false }: WeatherPreferencesProps) {
  const selectedChanceOption = PRECIPITATION_CHANCE_OPTIONS.find(opt => opt.value === settings.precipitationChance) || PRECIPITATION_CHANCE_OPTIONS[0];
  const selectedAmountOption = PRECIPITATION_AMOUNT_OPTIONS.find(opt => opt.value === settings.precipitationAmount) || PRECIPITATION_AMOUNT_OPTIONS[0];
  const selectedWindOption = WIND_SPEED_OPTIONS.find(opt => opt.value === settings.windSpeed) || WIND_SPEED_OPTIONS[0];

  return (
    <div className={`space-y-6 transition-opacity duration-200 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Premium Badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <div>
          <p className="text-sm font-semibold text-purple-900">Weather-Smart Watchlist</p>
          <p className="text-xs text-purple-700">Get notified only when the weather matches your preferences</p>
        </div>
      </div>

      {/* Precipitation Chance */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
            Rain Probability
          </span>
        </div>
        
        <Listbox 
          value={settings.precipitationChance} 
          onChange={(value) => onChange({ ...settings, precipitationChance: value })}
          disabled={disabled}
        >
          <div className="relative">
            <Listbox.Button className="w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-purple-500 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedChanceOption.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{selectedChanceOption.label}</div>
                  <div className="text-xs text-slate-500">{selectedChanceOption.description}</div>
                </div>
              </div>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
            </Listbox.Button>
            
            <Listbox.Options className="absolute z-[60] w-full bottom-full mb-2 bg-white border border-slate-200 rounded-lg shadow-xl focus:outline-none overflow-hidden max-h-80 overflow-y-auto">
              {PRECIPITATION_CHANCE_OPTIONS.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `px-4 py-3 cursor-pointer transition-colors ${
                      active ? 'bg-purple-50' : 'bg-white'
                    } ${settings.precipitationChance === option.value ? 'bg-purple-100' : ''}`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${selected ? 'text-purple-900' : 'text-slate-900'}`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-slate-500">{option.description}</div>
                      </div>
                      {selected && (
                        <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                      )}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      {/* Precipitation Amount */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
            Rainfall Amount
          </span>
        </div>
        
        <Listbox 
          value={settings.precipitationAmount} 
          onChange={(value) => onChange({ ...settings, precipitationAmount: value })}
          disabled={disabled}
        >
          <div className="relative">
            <Listbox.Button className="w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-purple-500 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedAmountOption.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{selectedAmountOption.label}</div>
                  <div className="text-xs text-slate-500">{selectedAmountOption.description}</div>
                </div>
              </div>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
            </Listbox.Button>
            
            <Listbox.Options className="absolute z-[60] w-full bottom-full mb-2 bg-white border border-slate-200 rounded-lg shadow-xl focus:outline-none overflow-hidden max-h-80 overflow-y-auto">
              {PRECIPITATION_AMOUNT_OPTIONS.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `px-4 py-3 cursor-pointer transition-colors ${
                      active ? 'bg-purple-50' : 'bg-white'
                    } ${settings.precipitationAmount === option.value ? 'bg-purple-100' : ''}`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${selected ? 'text-purple-900' : 'text-slate-900'}`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-slate-500">{option.description}</div>
                      </div>
                      {selected && (
                        <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                      )}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      {/* Wind Speed */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
            Wind Speed
          </span>
        </div>
        
        <Listbox 
          value={settings.windSpeed} 
          onChange={(value) => onChange({ ...settings, windSpeed: value })}
          disabled={disabled}
        >
          <div className="relative">
            <Listbox.Button className="w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-purple-500 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedWindOption.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{selectedWindOption.label}</div>
                  <div className="text-xs text-slate-500">{selectedWindOption.description}</div>
                </div>
              </div>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
            </Listbox.Button>
            
            <Listbox.Options className="absolute z-[60] w-full bottom-full mb-2 bg-white border border-slate-200 rounded-lg shadow-xl focus:outline-none overflow-hidden max-h-80 overflow-y-auto">
              {WIND_SPEED_OPTIONS.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `px-4 py-3 cursor-pointer transition-colors ${
                      active ? 'bg-purple-50' : 'bg-white'
                    } ${settings.windSpeed === option.value ? 'bg-purple-100' : ''}`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${selected ? 'text-purple-900' : 'text-slate-900'}`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-slate-500">{option.description}</div>
                      </div>
                      {selected && (
                        <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                      )}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      {/* Helper Text */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-blue-600 mt-0.5">ℹ️</div>
        <p className="text-xs text-blue-900 leading-relaxed">
          Weather-smart watchlists will only notify you when tee times match both your time preferences and weather conditions. 
          Perfect for golfers who prefer ideal playing conditions.
        </p>
      </div>
    </div>
  );
}

// Helper function to convert human-readable preferences to filter values
export function getWeatherFilterValues(settings: WeatherPreferenceSettings): {
  maxPrecipitationChance: number | null;
  maxPrecipitationAmount: number | null;
  maxWindSpeed: number | null;
} {
  if (!settings.enabled) {
    return { 
      maxPrecipitationChance: null, 
      maxPrecipitationAmount: null,
      maxWindSpeed: null
    };
  }

  // Map precipitation chance to percentage
  const chanceMap: Record<string, number | null> = {
    'any': null,
    'mostly-dry': 40,
    'dry': 20,
    'very-dry': 10,
  };

  // Map precipitation amount to mm
  const amountMap: Record<string, number | null> = {
    'any': null,
    'light-ok': 5,
    'minimal': 2,
    'none': 0.5,
  };

  // Map wind speed to km/h
  const windMap: Record<string, number | null> = {
    'any': null,
    'moderate': 25,
    'light': 15,
    'calm': 10,
  };

  return {
    maxPrecipitationChance: chanceMap[settings.precipitationChance] ?? null,
    maxPrecipitationAmount: amountMap[settings.precipitationAmount] ?? null,
    maxWindSpeed: windMap[settings.windSpeed] ?? null,
  };
}

