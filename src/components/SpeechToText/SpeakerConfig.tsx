import { useState } from "react";

interface SpeakerConfigProps {
  onSpeakerConfigChange: (minSpeakers: number, maxSpeakers: number) => void;
}

export function SpeakerConfig({ onSpeakerConfigChange }: SpeakerConfigProps) {
  const [minSpeakers, setMinSpeakers] = useState(1);
  const [maxSpeakers, setMaxSpeakers] = useState(2);

  const handleMinSpeakersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > maxSpeakers) {
      setMaxSpeakers(value);
    }
    setMinSpeakers(value);
    onSpeakerConfigChange(value, Math.max(value, maxSpeakers));
  };

  const handleMaxSpeakersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value < minSpeakers) {
      setMinSpeakers(value);
    }
    setMaxSpeakers(value);
    onSpeakerConfigChange(Math.min(value, minSpeakers), value);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-300">
        Speaker Configuration
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="min-speakers"
            className="block text-sm font-medium text-gray-400"
          >
            Minimum Speakers
          </label>
          <input
            type="number"
            id="min-speakers"
            min="1"
            max="10"
            value={minSpeakers}
            onChange={handleMinSpeakersChange}
            className="mt-1 block w-full rounded-md border-[#2A3045] bg-[#1A1F2E] text-gray-200 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="max-speakers"
            className="block text-sm font-medium text-gray-400"
          >
            Maximum Speakers
          </label>
          <input
            type="number"
            id="max-speakers"
            min="1"
            max="10"
            value={maxSpeakers}
            onChange={handleMaxSpeakersChange}
            className="mt-1 block w-full rounded-md border-[#2A3045] bg-[#1A1F2E] text-gray-200 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Specify the expected number of speakers in your audio. This helps
        improve speaker detection accuracy.
      </p>
    </div>
  );
}
