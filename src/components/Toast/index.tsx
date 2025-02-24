import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose: () => void;
}

export function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white
        ${type === "success" ? "bg-indigo-600" : "bg-red-600"}
        transition-opacity duration-300 flex items-center gap-2`}
    >
      <span aria-hidden="true">{type === "success" ? "✅" : "❌"}</span>
      {message}
    </div>
  );
}
