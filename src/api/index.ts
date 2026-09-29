/**
 * Central barrel export for all API services.
 *
 * Usage:
 *   import { login, getRoutes, getSchedules } from '@/api';
 *   import type { AuthUser, Route, Schedule } from '@/api';
 */

// Core client & token keys
export { apiClient, SECURE_STORE_KEYS } from "./apiClient";

// Auth
export {
    login,
    register,
    logout,
    getMe,
    refreshTokens,
    saveSession,
    readSession,
    clearSession,
} from "./authApi";
export type {
    AuthUser,
    AuthSession,
    LoginPayload,
    RegisterPayload,
    UserRole,
} from "./authApi";

// Routes
export {
    getRoutes,
    createRoute,
    updateRoute,
    updateRouteStatus,
} from "./routesApi";
export type {
    Route,
    RouteStop,
    RouteStatus,
    CreateRoutePayload,
    UpdateRoutePayload,
} from "./routesApi";

// Vehicles
export {
    getVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
} from "./vehiclesApi";
export type {
    Vehicle,
    VehicleType,
    VehicleStatus,
    CreateVehiclePayload,
    UpdateVehiclePayload,
} from "./vehiclesApi";

// Schedules
export {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
} from "./schedulesApi";
export type {
    Schedule,
    ScheduleStatus,
    CreateSchedulePayload,
    UpdateSchedulePayload,
} from "./schedulesApi";

// Users / Employees
export {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} from "./usersApi";
export type {
    Employee,
    UserStatus,
    CreateEmployeePayload,
    UpdateEmployeePayload,
} from "./usersApi";

// Health
export { checkHealth } from "./healthApi";
export type { HealthStatus } from "./healthApi";
