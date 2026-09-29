import { apiClient } from "./apiClient";

export interface HealthStatus {
    status: string;
    timestamp?: string;
}

/**
 * GET /api/health
 * Lightweight ping to verify the backend is reachable.
 */
export async function checkHealth(): Promise<HealthStatus> {
    const { data } = await apiClient.get<HealthStatus>("/health");
    return data;
}
