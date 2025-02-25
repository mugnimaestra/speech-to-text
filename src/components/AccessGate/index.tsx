"use client";

import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/authUtils";
import AccessForm from "@/components/AccessForm";

interface AccessGateProps {
  children: React.ReactNode;
}

export default function AccessGate({ children }: AccessGateProps) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthorized(isAuthenticated());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#10121C]">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return <AccessForm />;
  }

  return <>{children}</>;
}
