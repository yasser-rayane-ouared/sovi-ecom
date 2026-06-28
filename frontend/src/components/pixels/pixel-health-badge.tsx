"use client";

import React from "react";
import { Button } from "../ui/button";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import type { PixelHealthStatus } from "./types";

interface PixelHealthBadgeProps {
  pixelId: string;
  status?: PixelHealthStatus;
  message?: string;
  onTest: () => void;
}

export function PixelHealthBadge({ pixelId, status, message, onTest }: PixelHealthBadgeProps) {
  return (
    <>
      <Button
        onClick={onTest}
        variant="ghost"
        size="sm"
        disabled={status === 'loading'}
        title="التحقق من صحة Pixel ID"
        className={`h-8 w-8 p-0 hover:bg-white/5 ${
          status === 'valid' ? 'text-emerald-400' :
          status === 'invalid' ? 'text-red-400' :
          'text-blue-400 hover:text-blue-300'
        }`}
      >
        {status === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'valid' ? (
          <Wifi className="h-4 w-4" />
        ) : status === 'invalid' ? (
          <WifiOff className="h-4 w-4" />
        ) : (
          <Wifi className="h-4 w-4" />
        )}
      </Button>
      {message && (
        <span className={`text-[10px] font-medium ${
          status === 'valid' ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {message}
        </span>
      )}
    </>
  );
}
