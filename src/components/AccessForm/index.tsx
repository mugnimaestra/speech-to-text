"use client";

import { useState } from "react";
import { validateAccessCode, setAuthenticated } from "@/lib/authUtils";

export default function AccessForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateAccessCode(code)) {
      setAuthenticated(true);
      window.location.reload(); // Reload to update auth state
    } else {
      setError("Invalid access code. Please try again.");
      setCode("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#212C56] to-[#191D40]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#2a365e] rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Protected Content
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Please enter the access code to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="access-code" className="sr-only">
              Access Code
            </label>
            <input
              id="access-code"
              name="code"
              type="password"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-[#4c528c] bg-[#31346e] placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-400 focus:border-indigo-400 focus:z-10 sm:text-sm"
              placeholder="Enter access code"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-[#2a365e]"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
