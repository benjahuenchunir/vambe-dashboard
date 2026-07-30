"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPipelineStatus } from "@/lib/pipeline";
import { PipelineStatus } from "@/lib/types";

const IDLE_STATUS: PipelineStatus = {
  running: false,
  stopRequested: false,
  totalGlobal: 0,
  totalCsv: 0,
  totalBatch: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  error: null,
};

const POLL_INTERVAL_MS = 3000;
const DATA_UPDATE_INTERVAL_MS = 30000;

export function usePipelineStatus(onDataUpdated?: () => void) {
  const [status, setStatus] = useState<PipelineStatus>(IDLE_STATUS);
  const onDataUpdatedRef = useRef(onDataUpdated);

  // Keep the callback fresh without restarting intervals
  useEffect(() => {
    onDataUpdatedRef.current = onDataUpdated;
  }, [onDataUpdated]);

  const refresh = useCallback(async () => {
    try {
      const data = await getPipelineStatus();
      setStatus(data);

      // Notificar cuando el pipeline acaba de terminar (running -> not running)
      if (!data.running && status.running && onDataUpdatedRef.current) {
        onDataUpdatedRef.current();
      }
    } catch (error) {
      console.error("Error fetching pipeline status:", error);
    }
  }, [status.running]);

  // Poll every 4 s while running + periodic data updates
  useEffect(() => {
    refresh();

    if (!status.running) return;

    const pollInterval = setInterval(refresh, POLL_INTERVAL_MS);
    const dataUpdateInterval = setInterval(() => {
      if (onDataUpdatedRef.current) {
        onDataUpdatedRef.current();
      }
    }, DATA_UPDATE_INTERVAL_MS);

    return () => {
      clearInterval(pollInterval);
      clearInterval(dataUpdateInterval);
    };
  }, [status.running, refresh]);

  return { status, refresh };
}