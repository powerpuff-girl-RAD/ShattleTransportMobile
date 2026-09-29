import { apiClient } from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────

export type ScheduleStatus =
    | "Confirmed"
    | "In progress"
    | "Needs cover"
    | "Conflict"
    | "Pending";

export interface Schedule {
    id: number;
    /** ISO date string, e.g. "2026-09-29" */
    date: string;
    /** Time value from the DB — may be "HH:MM:SS" or an ISO string */
    startTime: string;
    endTime: string;
    routeId: number;
    vehicleId: number;
    inspectorId: number;
    status: ScheduleStatus;
}

export interface CreateSchedulePayload {
    /** ISO date string, e.g. "2026-09-29" */
    date: string;
    /** "HH:MM" format */
    startTime: string;
    /** "HH:MM" format */
    endTime: string;
    routeId: number;
    vehicleId: number;
    inspectorId: number;
    status: ScheduleStatus;
}

export type UpdateSchedulePayload = CreateSchedulePayload & { id: number };

// ─── API calls ────────────────────────────────────────────────────────────

/**
 * GET /api/schedules
 * Returns all trip schedules across all dates.
 */
export async function getSchedules(): Promise<Schedule[]> {
    const { data } = await apiClient.get<{ success: boolean; data: Schedule[] }>("/schedules");
    return data.data;
}

/**
 * POST /api/schedules
 * Creates a new trip assignment (vehicle + inspector + route + time slot).
 */
export async function createSchedule(payload: CreateSchedulePayload): Promise<Schedule[]> {
    const { data } = await apiClient.post<{ success: boolean; data: Schedule[] }>(
        "/schedules",
        payload,
    );
    return data.data;
}

/**
 * PUT /api/schedules/:id
 * Updates an existing trip assignment.
 */
export async function updateSchedule(
    id: number,
    payload: Omit<UpdateSchedulePayload, "id">,
): Promise<Schedule[]> {
    const { data } = await apiClient.put<{ success: boolean; data: Schedule[] }>(
        `/schedules/${id}`,
        payload,
    );
    return data.data;
}

/**
 * DELETE /api/schedules/:id
 * Removes a trip assignment.
 */
export async function deleteSchedule(id: number): Promise<void> {
    await apiClient.delete(`/schedules/${id}`);
}
