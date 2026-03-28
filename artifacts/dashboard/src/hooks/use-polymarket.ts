import { 
  useHealthCheck,
  useListMarkets,
  useListSnapshots,
  useGetMarketSnapshots,
  useListSignals,
  useGetSignalCounts,
  type ListSnapshotsParams,
  type GetMarketSnapshotsParams,
  type ListSignalsParams
} from "@workspace/api-client-react";

// Standard polling interval for the trading terminal feel (30 seconds)
const POLLING_INTERVAL = 30000;

export function useLiveHealth() {
  return useHealthCheck({
    query: { refetchInterval: POLLING_INTERVAL }
  });
}

export function useLiveMarkets() {
  return useListMarkets({
    query: { refetchInterval: POLLING_INTERVAL }
  });
}

export function useLiveSnapshots(params?: ListSnapshotsParams) {
  return useListSnapshots(params, {
    query: { refetchInterval: POLLING_INTERVAL }
  });
}

export function useLiveMarketHistory(marketId: string, params?: GetMarketSnapshotsParams) {
  return useGetMarketSnapshots(marketId, params, {
    query: { 
      refetchInterval: POLLING_INTERVAL,
      enabled: !!marketId 
    }
  });
}

export function useLiveSignals(params?: ListSignalsParams) {
  return useListSignals(params, {
    query: { refetchInterval: POLLING_INTERVAL }
  });
}

export function useLiveSignalCounts() {
  return useGetSignalCounts({
    query: { refetchInterval: POLLING_INTERVAL }
  });
}
