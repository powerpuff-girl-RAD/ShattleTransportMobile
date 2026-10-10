/**
 * Central barrel export for all API services.
 *
 * Usage:
 *   import { login, getRoutes, getSchedules, topUpAccount } from '@/api';
 *   import type { AuthUser, Route, Schedule, TopUpResponse } from '@/api';
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

// Passenger profile & wallet
export {
    getMyProfile,
    updateMyProfile,
    changePassword,
    topUpAccount,
    getTopUpHistory,
    getTopUpReceipt,
} from "./passengerApi";
export type {
    PassengerProfileData,
    PassengerAccount,
    UpdateProfilePayload,
    TopUpPayload,
    TopUpTransaction,
    TopUpResponse,
} from "./passengerApi";

// Digital token
export {
    activateToken,
    getActiveToken,
    generateQR,
    deactivateToken,
} from "./tokenApi";
export type {
    DigitalToken,
    TokenType,
    TokenStatus,
    QRGenerationResult,
    ActivateTokenPayload,
} from "./tokenApi";
// Journey & Ticketing
export {
    boardJourney,
    alightJourney,
    getActiveJourney,
    getJourneyHistory,
    getFareEstimate,
    getNotifications,
    markNotificationRead,
} from "./journeyApi";
export type {
    Journey,
    JourneyStopInfo,
    BoardingPayload,
    BoardingResult,
    AlightingPayload,
    AlightingResult,
    FareEstimatePayload,
    FareEstimateResult,
    NotificationItem,
} from "./journeyApi";

// Inspector (all live backend endpoints)
export {
    getDashboard,
    startShift,
    endShift,
    validateQR,
    inspect,
    getInspections,
    getInspection,
    recordViolation,
    getViolations,
    getStats,
    getSchedule,
    changePassword as changeInspectorPassword,
} from "./inspectorApi";
export type {
    Inspection,
    InspectionCheck,
    InspectionDetail,
    InspectionList,
    InspectionOutcome,
    InspectionQuery,
    InspectionResult,
    InspectInput,
    InspectionLocation,
    InspectorDashboard,
    InspectorProfile,
    InspectorShift,
    InspectorStats,
    QRValidationResult,
    RecordViolationPayload,
    ScheduledShift,
    StatsPeriod,
    TodayStats,
    Violation,
    ViolationType,
} from "./inspectorApi";

// Journey Bookings
export {
    getBookingRoutes,
    getRouteBookingDetails,
    calculateBookingFare,
    createBooking,
    activateBookingToken,
    getUserBookings,
    getBookingById,
    cancelBooking,
} from "./bookingApi";
export type {
    BookingRoute,
    RouteSchedule,
    BookingItem,
    CreateBookingPayload,
    CreateBookingResult,
    CalculateBookingFarePayload,
    CalculateBookingFareResult,
} from "./bookingApi";
