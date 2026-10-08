import { apiClient } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────
// These match the JSON the backend sends (see the mappers in
// ShattleTransportBackend/src/service/inspector.service.js).

export type InspectionResult = 'Valid' | 'Invalid';

export type ViolationType =
    | 'No Boarding Scan'
    | 'Expired Token'
    | 'Insufficient Credit'
    | 'Invalid Token'
    | 'Invalid Journey'
    | 'Other';

export type InspectionLocation = 'En Route' | 'At Stop' | 'Terminal';

export interface InspectorProfile {
    id: number;
    name: string;
    email: string;
    badge: string;             // e.g. "INS-0003"
}

export interface InspectorShift {
    scheduleId: number;
    routeNumber: string;       // "177"
    routeName: string;         // "Kaduwela - Kolpity"
    vehicleNumber: string;     // "NB-1234"
    startTime: string;         // "08:00"
    endTime: string;           // "20:00"
    onDuty: boolean;
    startedAt: string | null;  // ISO timestamp when the shift was started
}

export interface TodayStats {
    total: number;
    valid: number;
    violations: number;
}

export interface Inspection {
    id: number;
    tokenSerial: string;       // "TK-88214"
    routeNumber: string;
    routeName: string;
    busNumber: string;
    result: InspectionResult;
    /** Violation type when result is Invalid. */
    reason: ViolationType | null;
    inspectedAt: string;       // ISO timestamp
    hasViolation: boolean;     // true once a violation has been recorded for it
}

/** One inspection with everything the detail screen shows. */
export interface InspectionDetail extends Inspection {
    method: 'QR' | 'Manual';
    message: string;
    violation: Violation | null;
}

/** Everything the Dashboard screen needs, returned by one API call. */
export interface InspectorDashboard {
    profile: InspectorProfile;
    shift: InspectorShift | null;   // null = no shift scheduled today
    todayStats: TodayStats;
    recentInspections: Inspection[];
}

export interface Violation {
    id: number;
    inspectionId: number;
    tokenSerial: string;
    violationType: ViolationType;
    location: InspectionLocation;
    notes: string;
    routeNumber: string;
    routeName: string;
    busNumber: string;
    recordedAt: string;        // ISO timestamp
}

/** Token, route, bus and time are copied from the inspection by the backend. */
export interface RecordViolationPayload {
    inspectionId: number;
    violationType: ViolationType;
    location: InspectionLocation;
    notes: string;
}

/** History filters — every field is optional. */
export interface InspectionQuery {
    date?: string;             // "YYYY-MM-DD"
    route?: string;            // route number, e.g. "177"
    bus?: string;              // vehicle number, e.g. "NB-1234"
    result?: InspectionResult;
}

export interface InspectionList {
    inspections: Inspection[];
    /** Routes and buses this inspector has worked on — the filter chip options. */
    filters: { routes: string[]; buses: string[] };
}

export type StatsPeriod = 1 | 7 | 30;

export interface InspectorStats {
    days: StatsPeriod;
    totals: { total: number; valid: number; invalid: number; validRate: number };
    byReason: { reason: ViolationType; count: number }[];
    byRoute: { routeNumber: string; routeName: string; total: number; invalid: number }[];
    byDay: { date: string; total: number; invalid: number }[];
}

export interface ScheduledShift {
    scheduleId: number;
    date: string;              // "YYYY-MM-DD"
    routeNumber: string;
    routeName: string;
    vehicleNumber: string;
    startTime: string;
    endTime: string;
    status: string;
}

/** One rule from the backend's inspection pipeline (inspection.checks.js). */
export interface InspectionCheck {
    name: string;              // e.g. "Boarding scan recorded"
    passed: boolean;
}

/** What POST /api/inspector/inspect returns. */
export interface InspectionOutcome {
    inspection: Inspection;
    message: string;           // human-readable reason, e.g. "The passenger did not scan their token when boarding"
    checks: InspectionCheck[];
    passenger: { name: string | null; balance: number } | null;
    journey: { routeNumber: string; boardingStop: string | null; boardedAt: string } | null;
}

/** Send EITHER a scanned QR payload OR a serial typed in for a smartcard / barcode. */
export type InspectInput = { qrPayload: string } | { tokenSerial: string };

/** Result of validating a scanned passenger QR against the backend. */
export type QRValidationResult =
    | {
        valid: true;
        token: {
            serial: string;
            type: string;
            status: string;
            passengerName: string | null;
            passengerEmail: string | null;
            balance: number;
        };
    }
    | { valid: false; reason: string };

// ─── Dashboard & shift (live backend) ─────────────────────────────────────

/** GET /api/inspector/dashboard */
export async function getDashboard(): Promise<InspectorDashboard> {
    const res = await apiClient.get<{ success: boolean } & InspectorDashboard>('/inspector/dashboard');
    const { profile, shift, todayStats, recentInspections } = res.data;
    return { profile, shift, todayStats, recentInspections };
}

/** POST /api/inspector/shift/start — fails with 404 (no shift today) or 409 (already started) */
export async function startShift(): Promise<InspectorShift> {
    const res = await apiClient.post<{ success: boolean; shift: InspectorShift }>('/inspector/shift/start');
    return res.data.shift;
}

/** POST /api/inspector/shift/end — fails with 409 if no shift is active */
export async function endShift(): Promise<InspectorShift> {
    const res = await apiClient.post<{ success: boolean; shift: InspectorShift }>('/inspector/shift/end');
    return res.data.shift;
}

// ─── Inspection (live backend, used by the Scan screen) ───────────────────

/** POST /api/inspector/inspect — fails with 409 if the inspector's shift has not started */
export async function inspect(input: InspectInput): Promise<InspectionOutcome> {
    const res = await apiClient.post<{ success: boolean } & InspectionOutcome>('/inspector/inspect', input);
    const { inspection, message, checks, passenger, journey } = res.data;
    return { inspection, message, checks, passenger, journey };
}

// ─── QR validation (live backend, used by the Scan screen) ────────────────

/**
 * Sends a scanned QR payload (short-lived passenger JWT) to the backend.
 * The backend replies 200 with `valid: false` for expired/blocked/unknown
 * tokens, so callers only need to handle network errors in the catch block.
 */
export async function validateQR(qrPayload: string): Promise<QRValidationResult> {
    const res = await apiClient.post<QRValidationResult>('/passenger/token/validate', { qrPayload });
    return res.data;
}

// ─── History (live backend) ───────────────────────────────────────────────

/** GET /api/inspector/inspections?date=&route=&bus=&result= */
export async function getInspections(query: InspectionQuery = {}): Promise<InspectionList> {
    const res = await apiClient.get<{ success: boolean } & InspectionList>('/inspector/inspections', { params: query });
    const { inspections, filters } = res.data;
    return { inspections, filters };
}

/** GET /api/inspector/inspections/:id — 404 if it is not one of yours */
export async function getInspection(id: number): Promise<InspectionDetail> {
    const res = await apiClient.get<{ success: boolean; inspection: InspectionDetail }>(`/inspector/inspections/${id}`);
    return res.data.inspection;
}

// ─── Violations (live backend) ────────────────────────────────────────────

/** POST /api/inspector/violations — 409 if the inspection is valid or already has a violation */
export async function recordViolation(payload: RecordViolationPayload): Promise<Violation> {
    const res = await apiClient.post<{ success: boolean; violation: Violation }>('/inspector/violations', payload);
    return res.data.violation;
}

/** GET /api/inspector/violations */
export async function getViolations(): Promise<Violation[]> {
    const res = await apiClient.get<{ success: boolean; violations: Violation[] }>('/inspector/violations');
    return res.data.violations;
}

// ─── Statistics, schedule and account (live backend) ──────────────────────

/** GET /api/inspector/stats?days=1|7|30 */
export async function getStats(days: StatsPeriod): Promise<InspectorStats> {
    const res = await apiClient.get<{ success: boolean } & InspectorStats>('/inspector/stats', { params: { days } });
    const { totals, byReason, byRoute, byDay } = res.data;
    return { days: res.data.days, totals, byReason, byRoute, byDay };
}

/** GET /api/inspector/schedule — today's and upcoming shifts */
export async function getSchedule(): Promise<ScheduledShift[]> {
    const res = await apiClient.get<{ success: boolean; schedule: ScheduledShift[] }>('/inspector/schedule');
    return res.data.schedule;
}

/** PUT /api/inspector/password — 400 if the current password is wrong */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/inspector/password', { currentPassword, newPassword });
}
