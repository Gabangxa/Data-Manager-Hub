import { useQuery } from "@tanstack/react-query";
import {
  getHealthCheckQueryOptions,
  getListMarketsQueryOptions,
  getListSnapshotsQueryOptions,
  getGetMarketSnapshotsQueryOptions,
  getListSignalsQueryOptions,
  getGetSignalCountsQueryOptions,
} from "@workspace/api-client-react";
import type { ListSnapshotsParams, GetMarketSnapshotsParams, ListSignalsParams } from "@workspace/api-client-react";

const POLLING_INTERVAL = 30000;

export function useLiveHealth() {
  return useQuery({
    ...getHealthCheckQueryOptions(),
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useLiveMarkets() {
  return useQuery({
    ...getListMarketsQueryOptions(),
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useLiveSnapshots(params?: ListSnapshotsParams) {
  return useQuery({
    ...getListSnapshotsQueryOptions(params),
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useLiveMarketHistory(marketId: string, params?: GetMarketSnapshotsParams) {
  return useQuery({
    ...getGetMarketSnapshotsQueryOptions(marketId, params),
    refetchInterval: POLLING_INTERVAL,
    enabled: !!marketId,
  });
}

export function useLiveSignals(params?: ListSignalsParams) {
  return useQuery({
    ...getListSignalsQueryOptions(params),
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useLiveSignalCounts() {
  return useQuery({
    ...getGetSignalCountsQueryOptions(),
    refetchInterval: POLLING_INTERVAL,
  });
}
