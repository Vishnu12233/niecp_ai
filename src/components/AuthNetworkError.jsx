import React from "react";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

// Branded connectivity screen — shown instead of the login page when the
// auth check fails due to a network problem. The stored session is kept,
// so the user returns exactly where they left off after retrying.
export default function AuthNetworkError({ onRetry }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Unable to reach NIECP-AI</h1>
        <p className="text-sm text-slate-500 mt-2">
          Please check your internet connection and try again. Your session is
          preserved and you'll pick up right where you left off.
        </p>
        <Button className="mt-6 bg-blue-600 hover:bg-blue-700" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    </div>
  );
}