import React, { useRef, useMemo } from "react";

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

interface SingleDigitInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isInvalid?: boolean; // Add this new prop
}
export const SingleDigitInput: React.FC<SingleDigitInputProps> = ({
  label,
  value,
  onChange,
  isInvalid, // Add this prop
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Add this to generate random colors for each digit
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
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
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
    // Focus the next empty input after paste
    const nextEmptyIndex = pastedValue.length < 6 ? pastedValue.length : 5;
    inputRefs.current[nextEmptyIndex]?.focus();
  };
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-4">
          {label}
        </label>
      )}
      <div className="flex justify-between gap-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="flex-1">
            <input
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={value[index] || ""}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-full text-center text-2xl font-bold py-2
                border-b-2 focus:border-b-4 outline-none transition-all duration-200
                bg-transparent font-mono tracking-wider
                ${
                  value[index]
                    ? `${digitColors[index]} transform scale-110 transition-transform duration-150`
                    : ""
                }
                ${
                  isInvalid
                    ? "border-red-300 focus:border-red-500 text-red-500"
                    : "border-gray-300 focus:border-blue-500 hover:border-gray-400"
                }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
