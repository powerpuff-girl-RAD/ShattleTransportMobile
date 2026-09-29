import { apiClient } from "./apiClient";
import type { UserRole } from "./authApi";

// ─── Types ────────────────────────────────────────────────────────────────

export type UserStatus = "Active" | "Suspended" | "Inactive";

export interface Employee {
    id: number;
    email: string;
    fullName: string;
    role: UserRole;
    status: number;       // 1 = Active, 0 = Inactive, 2 = Suspended (from DB)
    statusName: string;   // Human-readable status label
    createdAt: string;    // ISO date string
}

export interface CreateEmployeePayload {
    email: string;
    password: string;
    fullName?: string;
    role: UserRole;
}

export interface UpdateEmployeePayload {
    email: string;
    fullName?: string;
    role: UserRole;
    status?: UserStatus;
}

// ─── API calls ────────────────────────────────────────────────────────────

/**
 * GET /api/users
 * Returns all employees (managers, admins, inspectors) and passengers.
 */
export async function getEmployees(): Promise<Employee[]> {
    const { data } = await apiClient.get<{ success: boolean; data: Employee[] }>("/users");
    return data.data;
}

/**
 * POST /api/users
 * Creates a new employee account and emails them their credentials.
 * Only managers should call this.
 */
export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
    const { data } = await apiClient.post<{ success: boolean; data: Employee }>(
        "/users",
        payload,
    );
    return data.data;
}

/**
 * PUT /api/users/:id
 * Updates an employee's details (email, fullName, role, status).
 */
export async function updateEmployee(
    id: number,
    payload: UpdateEmployeePayload,
): Promise<Employee> {
    const { data } = await apiClient.put<{ success: boolean; data: Employee }>(
        `/users/${id}`,
        payload,
    );
    return data.data;
}

/**
 * DELETE /api/users/:id
 * Permanently removes an employee account.
 */
export async function deleteEmployee(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
}
