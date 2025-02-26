"use client";

import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "type"
  > {
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const NumberInput = React.forwardRef<HTMLDivElement, NumberInputProps>(
  (
    { className, onChange, min = 0, max = 100, step = 1, value, ...props },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      onChange?.(newValue);
    };

    const increment = () => {
      if (typeof value === "number" && (max === undefined || value < max)) {
        onChange?.(Math.min(max as number, value + step));
      }
    };

    const decrement = () => {
      if (typeof value === "number" && (min === undefined || value > min)) {
        onChange?.(Math.max(min as number, value - step));
      }
    };

    return (
      <div ref={ref} className={cn("relative", className)}>
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="pr-8"
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex flex-col border-l border-[#2A3045]">
          <button
            type="button"
            onClick={increment}
            className="flex h-[50%] w-6 items-center justify-center border-b border-[#2A3045] bg-[#1A1F2E] text-gray-400 hover:bg-[#2D3344] hover:text-gray-200 focus:outline-none focus:ring-0"
            tabIndex={-1}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={decrement}
            className="flex h-[50%] w-6 items-center justify-center bg-[#1A1F2E] text-gray-400 hover:bg-[#2D3344] hover:text-gray-200 focus:outline-none focus:ring-0"
            tabIndex={-1}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
