"use client";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Listbox } from "@headlessui/react";
import { ChevronDownIcon, UserGroupIcon, ClockIcon } from "@heroicons/react/24/outline";
import { fetchTeeTimes, type TeeTime } from "../services/teeTimeService";

export default function Home() {
  // State for filters
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [numOfPlayers, setNumOfPlayers] = useState<number>(4);
  const [holes, setHoles] = useState(18);
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch tee times
  const handleGetTeeTimes = async () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const data = await fetchTeeTimes({
        date: formattedDate,
        numOfPlayers,
        holes
      });
      setTeeTimes(data);
    } catch (err) {
      setError('Failed to fetch tee times. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4 sm:p-10 flex font-[family-name:var(--font-geist-sans)]">
      <main className="w-full flex flex-col lg:flex-row gap-8 lg:h-[calc(100vh-5rem)]">
        {/* Settings Section - Fixed on left for desktop, top for mobile */}
        <section className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl shadow p-4 flex flex-col gap-6 lg:h-fit lg:sticky lg:top-4">
          <div className="flex flex-col items-center gap-2">
            <span className="font-semibold text-lg flex items-center gap-2"><ClockIcon className="w-5 h-5" />Date</span>
            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                fromDate={new Date()}
                className="!p-0"
              />
            </div>
          </div>

          {/* Players Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5" />
              <span className="font-semibold">Players</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumOfPlayers(num)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    numOfPlayers === num
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white hover:bg-blue-50 border-slate-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Holes Dropdown */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Holes</span>
            <Listbox value={holes} onChange={setHoles}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <span>{holes} Holes</span>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg focus:outline-none">
                  {[18, 9].map((option) => (
                    <Listbox.Option
                      key={option}
                      value={option}
                      className={({ active }) =>
                        `px-4 py-2 cursor-pointer ${
                          active ? 'bg-blue-50 text-blue-500' : 'text-slate-700'
                        }`
                      }
                    >
                      {option} Holes
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          {/* Get Tee Times Button */}
          <button
            onClick={handleGetTeeTimes}
            disabled={loading || !selectedDate}
            className={`mt-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              loading || !selectedDate
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Searching...' : 'Get Tee Times'}
          </button>
        </section>

        {/* Tee Times Results Section - Scrollable */}
        <section className="flex-1 flex flex-col gap-4 lg:overflow-y-auto">
          {loading && (
            <div className="text-center py-8 text-slate-600">Loading tee times...</div>
          )}
          {error && (
            <div className="text-center py-8 text-red-500">{error}</div>
          )}
          {!loading && !error && teeTimes.length === 0 && (
            <div className="text-center py-8 text-slate-600">No tee times available for the selected criteria.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {!loading && !error && teeTimes.map((teeTime, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">{teeTime.course_name}</h3>
                  <div className="flex flex-col gap-1 text-slate-600">
                    <p className="text-lg font-medium">
                      {new Date(teeTime.start_datetime).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    <p>{teeTime.holes} holes</p>
                    <p>{teeTime.players_available} spots available</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">
                      ${teeTime.price}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
