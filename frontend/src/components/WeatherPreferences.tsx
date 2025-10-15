"use client";
import { CloudRain, Sparkles, Wind, Calendar, Save, Thermometer } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

export interface WeatherPreferenceSettings {
  enabled: boolean;
  temperaturePreference: string; // Human-readable: 'any', 'warm', 'mild', 'cool'
  rainPreference: string; // Human-readable: 'any', 'light-rain', 'minimal-rain', 'no-rain'
  windSpeed: string; // Human-readable: 'any', 'moderate', 'light', 'calm'
  forecastDays: string; // Human-readable: 'day-of', '1-day', '2-days', '3-days', '5-days', '7-days'
}

interface WeatherPreferencesProps {
  settings: WeatherPreferenceSettings;
  onChange: (settings: WeatherPreferenceSettings) => void;
  disabled?: boolean;
  saveAsDefault?: boolean;
  onSaveAsDefaultChange?: (value: boolean) => void;
}

const TEMPERATURE_OPTIONS = [
  { 
    value: 'any', 
    label: 'Any temperature', 
    description: 'No restrictions on temperature',
    icon: '🌡️'
  },
  { 
    value: 'warm', 
    label: 'Warm', 
    description: '18°C or warmer (pleasant golfing)',
    icon: '☀️'
  },
  { 
    value: 'mild', 
    label: 'Mild', 
    description: '12-18°C (comfortable conditions)',
    icon: '🌤️'
  },
  { 
    value: 'cool', 
    label: 'Cool or better', 
    description: 'Above 8°C (playable)',
    icon: '🌥️'
  },
];

const RAIN_PREFERENCE_OPTIONS = [
  { 
    value: 'any', 
    label: 'Rain or shine', 
    description: 'No restrictions on weather',
    icon: '☔'
  },
  { 
    value: 'light-rain', 
    label: 'Light rain', 
    description: 'Some chance or some amount OK',
    icon: '🌦️'
  },
  { 
    value: 'minimal-rain', 
    label: 'Minimal rain', 
    description: 'Low chance or low amount',
    icon: '☁️'
  },
  { 
    value: 'no-rain', 
    label: 'No rain', 
    description: 'Very low chance or very low amount',
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

const FORECAST_DAYS_OPTIONS = [
  { 
    value: '1-day', 
    label: 'Day before', 
    description: 'Check weather 1 day in advance',
    icon: '🗓️'
  },
  { 
    value: '2-days', 
    label: '2 days before', 
    description: 'Check weather 2 days in advance',
    icon: '📆'
  },
  { 
    value: '3-days', 
    label: '3 days before', 
    description: 'Check weather 3 days in advance',
    icon: '🗓️'
  },
  { 
    value: '5-days', 
    label: '5 days before', 
    description: 'Check weather 5 days in advance',
    icon: '📅'
  },
  { 
    value: '7-days', 
    label: 'Week before', 
    description: 'Check weather 7 days in advance',
    icon: '📆'
  },
];

export default function WeatherPreferences({ 
  settings, 
  onChange, 
  disabled = false,
  saveAsDefault,
  onSaveAsDefaultChange
}: WeatherPreferencesProps) {
  const selectedTemperatureOption = TEMPERATURE_OPTIONS.find(opt => opt.value === settings.temperaturePreference) || TEMPERATURE_OPTIONS[0];
  const selectedRainOption = RAIN_PREFERENCE_OPTIONS.find(opt => opt.value === settings.rainPreference) || RAIN_PREFERENCE_OPTIONS[0];
  const selectedWindOption = WIND_SPEED_OPTIONS.find(opt => opt.value === settings.windSpeed) || WIND_SPEED_OPTIONS[0];
  const selectedForecastOption = FORECAST_DAYS_OPTIONS.find(opt => opt.value === settings.forecastDays) || FORECAST_DAYS_OPTIONS[0];

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

      {/* Weather Preferences Grid - 2 columns on web, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temperature Preference */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
              Temperature
            </span>
          </div>
          
          <Listbox 
            value={settings.temperaturePreference} 
            onChange={(value) => onChange({ ...settings, temperaturePreference: value })}
            disabled={disabled}
          >
            <div className="relative">
              <Listbox.Button className="w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-purple-500 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedTemperatureOption.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{selectedTemperatureOption.label}</div>
                    <div className="text-xs text-slate-500">{selectedTemperatureOption.description}</div>
                  </div>
                </div>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
              </Listbox.Button>
              
              <Listbox.Options className="absolute z-[60] w-full bottom-full mb-2 bg-white border border-slate-200 rounded-lg shadow-xl focus:outline-none overflow-hidden max-h-80 overflow-y-auto">
                {TEMPERATURE_OPTIONS.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `px-4 py-3 cursor-pointer transition-colors ${
                        active ? 'bg-purple-50' : 'bg-white'
                      } ${settings.temperaturePreference === option.value ? 'bg-purple-100' : ''}`
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

        {/* Rain Preference */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
              Rain Preference
            </span>
          </div>
          
          <Listbox 
            value={settings.rainPreference} 
            onChange={(value) => onChange({ ...settings, rainPreference: value })}
            disabled={disabled}
          >
            <div className="relative">
              <Listbox.Button className="w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-purple-500 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedRainOption.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{selectedRainOption.label}</div>
                    <div className="text-xs text-slate-500">{selectedRainOption.description}</div>
                  </div>
                </div>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
              </Listbox.Button>
              
              <Listbox.Options className="absolute z-[60] w-full bottom-full mb-2 bg-white border border-slate-200 rounded-lg shadow-xl focus:outline-none overflow-hidden max-h-80 overflow-y-auto">
                {RAIN_PREFERENCE_OPTIONS.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `px-4 py-3 cursor-pointer transition-colors ${
                        active ? 'bg-purple-50' : 'bg-white'
                      } ${settings.rainPreference === option.value ? 'bg-purple-100' : ''}`
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

        {/* Forecast Timing */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
              Forecast Timing
            </span>
          </div>
          
          <Listbox 
            value={settings.forecastDays} 
            onChange={(value) => onChange({ ...settings, forecastDays: value })}
            disabled={disabled}
          >
            <div className="relative">
              <Listbox.Button className="w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-purple-500 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedForecastOption.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{selectedForecastOption.label}</div>
                    <div className="text-xs text-slate-500">{selectedForecastOption.description}</div>
                  </div>
                </div>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
              </Listbox.Button>
              
              <Listbox.Options className="absolute z-[60] w-full bottom-full mb-2 bg-white border border-slate-200 rounded-lg shadow-xl focus:outline-none overflow-hidden max-h-80 overflow-y-auto">
                {FORECAST_DAYS_OPTIONS.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) =>
                      `px-4 py-3 cursor-pointer transition-colors ${
                        active ? 'bg-purple-50' : 'bg-white'
                      } ${settings.forecastDays === option.value ? 'bg-purple-100' : ''}`
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
      </div>

      {/* Save as Default Switch */}
      {saveAsDefault !== undefined && onSaveAsDefaultChange && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">Save as default</p>
              <p className="text-xs text-green-700">Use these settings for future watchlists</p>
            </div>
          </div>
          <button
            onClick={() => onSaveAsDefaultChange(!saveAsDefault)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              saveAsDefault
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-slate-300 hover:bg-slate-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={saveAsDefault}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                saveAsDefault ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            <span className="sr-only">{saveAsDefault ? 'On' : 'Off'}</span>
          </button>
        </div>
      )}

      {/* Helper Text */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-blue-600 mt-0.5">ℹ️</div>
        <p className="text-xs text-blue-900 leading-relaxed">
          Weather-smart watchlists will only notify you when tee times match both your time preferences and weather conditions. 
          The forecast timing determines how far in advance we check the weather before your tee time.
        </p>
      </div>
    </div>
  );
}

// Helper function to convert human-readable preferences to filter values
export function getWeatherFilterValues(settings: WeatherPreferenceSettings): {
  minTemperature: number | null;
  maxPrecipitationChance: number | null;
  maxPrecipitationAmount: number | null;
  maxWindSpeed: number | null;
  forecastDaysInAdvance: number;
} {
  if (!settings.enabled) {
    return { 
      minTemperature: null,
      maxPrecipitationChance: null, 
      maxPrecipitationAmount: null,
      maxWindSpeed: null,
      forecastDaysInAdvance: 7
    };
  }

  // Map temperature preference to minimum temperature in Celsius
  const temperatureMap: Record<string, number | null> = {
    'any': null, // No temperature restrictions
    'warm': 18, // 18°C or warmer
    'mild': 12, // 12°C or warmer
    'cool': 8, // 8°C or warmer
  };

  // Map unified rain preference to both chance (%) and amount (mm)
  const rainPreferenceMap: Record<string, { chance: number | null; amount: number | null }> = {
    'any': { chance: null, amount: null }, // Rain or shine - no restrictions
    'light-rain': { chance: 40, amount: 5 }, // Some chance or some amount OK
    'minimal-rain': { chance: 20, amount: 2 }, // Low chance or low amount
    'no-rain': { chance: 10, amount: 0.5 }, // Very low chance or very low amount
  };

  // Map wind speed to km/h
  const windMap: Record<string, number | null> = {
    'any': null,
    'moderate': 25,
    'light': 15,
    'calm': 10,
  };

  // Map forecast timing to days
  const forecastDaysMap: Record<string, number> = {
    '1-day': 1,
    '2-days': 2,
    '3-days': 3,
    '5-days': 5,
    '7-days': 7,
  };

  const rainPreference = rainPreferenceMap[settings.rainPreference] ?? rainPreferenceMap['any'];

  return {
    minTemperature: temperatureMap[settings.temperaturePreference] ?? null,
    maxPrecipitationChance: rainPreference.chance,
    maxPrecipitationAmount: rainPreference.amount,
    maxWindSpeed: windMap[settings.windSpeed] ?? null,
    forecastDaysInAdvance: forecastDaysMap[settings.forecastDays] ?? 7,
  };
}

