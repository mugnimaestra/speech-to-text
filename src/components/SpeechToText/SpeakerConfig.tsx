"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";

interface SpeakerConfigProps {
  onSpeakerConfigChange: (minSpeakers: number, maxSpeakers: number) => void;
}

export function SpeakerConfig({ onSpeakerConfigChange }: SpeakerConfigProps) {
  const [minSpeakers, setMinSpeakers] = useState(1);
  const [maxSpeakers, setMaxSpeakers] = useState(2);

  const handleMinSpeakersChange = (value: number) => {
    if (value > maxSpeakers) {
      setMaxSpeakers(value);
    }
    setMinSpeakers(value);
    onSpeakerConfigChange(value, Math.max(value, maxSpeakers));
  };

  const handleMaxSpeakersChange = (value: number) => {
    if (value < minSpeakers) {
      setMinSpeakers(value);
    }
    setMaxSpeakers(value);
    onSpeakerConfigChange(Math.min(value, minSpeakers), value);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-300">
          Speaker Configuration
        </span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-speakers">Minimum Speakers</Label>
            <NumberInput
              id="min-speakers"
              min={1}
              max={10}
              value={minSpeakers}
              onChange={handleMinSpeakersChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-speakers">Maximum Speakers</Label>
            <NumberInput
              id="max-speakers"
              min={1}
              max={10}
              value={maxSpeakers}
              onChange={handleMaxSpeakersChange}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Specify the expected number of speakers in your audio. This helps
          improve speaker detection accuracy.
        </p>
      </div>
    </div>
  );
}
