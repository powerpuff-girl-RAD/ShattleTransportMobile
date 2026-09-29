import { apiClient } from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────

/** Type code: 1 = Bus, 2 = Train */
export type VehicleType = 1 | 2;

export type VehicleStatus =
    | "Active"
    | "Delayed"
    | "Short turn"
    | "Upcoming"
    | "In Maintenance";

export interface Vehicle {
    id: number;
    vehicleId: string;
    name: string;
    depot: string;
    type: VehicleType;
    status: VehicleStatus;
    seats: number;
}

export interface CreateVehiclePayload {
    vehicleId: string;
    name: string;
    depot: string;
    type: VehicleType;
    status: VehicleStatus;
    seat: number;
}

export interface UpdateVehiclePayload {
    id: number;
    vehicleId: string;
    name: string;
    depot: string;
    type: VehicleType;
    status: VehicleStatus;
    seats: number;
}

// ─── API calls ────────────────────────────────────────────────────────────

/**
 * GET /api/vehicles
 * Returns every vehicle in the fleet.
 */
export async function getVehicles(): Promise<Vehicle[]> {
    const { data } = await apiClient.get<{ success: boolean; data: Vehicle[] }>("/vehicles");
    return data.data;
}

/**
 * POST /api/vehicles
 * Registers a new vehicle.
 */
export async function createVehicle(payload: CreateVehiclePayload): Promise<Vehicle[]> {
    const { data } = await apiClient.post<{ success: boolean; data: Vehicle[] }>(
        "/vehicles",
        payload,
    );
    return data.data;
}

/**
 * PUT /api/vehicles/:id
 * Updates vehicle details.
 */
export async function updateVehicle(
    id: number,
    payload: Omit<UpdateVehiclePayload, "id">,
): Promise<Vehicle[]> {
    const { data } = await apiClient.put<{ success: boolean; data: Vehicle[] }>(
        `/vehicles/${id}`,
        payload,
    );
    return data.data;
}

/**
 * DELETE /api/vehicles/:id
 * Removes a vehicle from the fleet.
 */
export async function deleteVehicle(id: number): Promise<void> {
    await apiClient.delete(`/vehicles/${id}`);
}
