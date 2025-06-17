import React, { useRef, KeyboardEvent, useMemo } from "react";

const aestheticColors = [
  "text-blue-600",
  "text-blue-500",
  "text-indigo-600",
  "text-indigo-500",
  "text-violet-600",
  "text-violet-500",
  "text-purple-600",
  "text-purple-500",
  "text-cyan-600",
  "text-cyan-500",
  "text-sky-600",
  "text-sky-500",
  "text-fuchsia-600",
  "text-fuchsia-500",
  "text-slate-600",
  "text-slate-500",
  "text-blue-700",
  "text-indigo-700",
  "text-violet-700",
  "text-cyan-700",
];

interface DigitInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const DigitInput: React.FC<DigitInputProps> = ({
  value,
  onChange,
  error,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digitColors = useMemo(() => {
    return Array(6)
      .fill(null)
      .map(
        () =>
          aestheticColors[Math.floor(Math.random() * aestheticColors.length)]
      );
  }, []);

  const handleChange = (index: number, inputValue: string) => {
    const newValue =
      value.slice(0, index) + inputValue + value.slice(index + 1);
    onChange(newValue);

    // Move to next input if value is entered
    if (inputValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    const pastedValue = pastedData.slice(0, 6);
    onChange(pastedValue);
  };

  return (
    <div className="w-full">
      <div className="flex justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) =>
              handleChange(index, e.target.value.replace(/[^0-9]/g, ""))
            }
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200 font-mono tracking-wider
              ${
                value[index]
                  ? `${digitColors[index]} transform scale-110 transition-transform duration-150`
                  : ""
              }
              ${
                error
                  ? "border-red-300 bg-red-50 text-red-500"
                  : "border-gray-200 hover:border-gray-300"
              }`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
};
