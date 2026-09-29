import { apiClient } from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────

export type RouteStatus = boolean; // true = active, false = inactive

export interface RouteStop {
    id: number;
    name: string;
    order: number;
    distanceFromStartKm: number;
}

export interface Route {
    id: number;
    routeNumber: string;
    routeName: string;
    startLocation: string;
    endLocation: string;
    distanceKm: number;
    currentStatus: RouteStatus;
    stops: RouteStop[];
}

export interface CreateRoutePayload {
    routeNumber: string;
    routeName: string;
    startLocation: string;
    endLocation: string;
    distanceKm: number;
    stops: {
        stopName: string;
        stopOrder: number;
        distanceFromStartKm: number;
    }[];
}

export type UpdateRoutePayload = CreateRoutePayload;

// ─── API calls ────────────────────────────────────────────────────────────

/**
 * GET /api/routes
 * Returns all routes (each with nested stops array).
 */
export async function getRoutes(): Promise<Route[]> {
    const { data } = await apiClient.get<{ success: boolean; data: Route[] }>("/routes");
    return data.data;
}

/**
 * POST /api/routes
 * Creates a new route along with its stops (single transaction on the server).
 */
export async function createRoute(payload: CreateRoutePayload): Promise<Route> {
    const { data } = await apiClient.post<{ success: boolean; data: Route }>("/routes", payload);
    return data.data;
}

/**
 * PUT /api/routes/:id
 * Replaces route fields and syncs stops.
 */
export async function updateRoute(id: number, payload: UpdateRoutePayload): Promise<Route> {
    const { data } = await apiClient.put<{ success: boolean; data: Route }>(
        `/routes/${id}`,
        payload,
    );
    return data.data;
}

/**
 * PUT /api/routes/:id/status
 * Toggles the route active/inactive flag.
 */
export async function updateRouteStatus(id: number, currentStatus: boolean): Promise<Route> {
    const { data } = await apiClient.put<{ success: boolean; data: Route }>(
        `/routes/${id}/status`,
        { currentStatus },
    );
    return data.data;
}
