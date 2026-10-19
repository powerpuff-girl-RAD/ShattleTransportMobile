import { apiClient } from './apiClient';

export interface JourneyStopInfo {
    stopId?: number;
    stopName: string;
    distanceFromStartKm?: number;
    timestamp?: string;
}

export interface Journey {
    id: number;
    tokenSerial: string;
    routeId: number;
    routeNumber: string;
    routeName: string;
    boardingStop: JourneyStopInfo;
    alightingStop?: JourneyStopInfo | null;
    distanceKm?: number;
    fareAmount?: number;
    status: 'InProgress' | 'Completed' | 'Cancelled';
    createdAt: string;
    completedAt?: string | null;
}

export interface BoardingPayload {
    tokenSerial: string;
    routeId: number;
    boardingStopId?: number;
    boardingStopName?: string;
}

export interface BoardingResult {
    success: boolean;
    status: 'Accepted' | 'Rejected';
    errorCode?: string;
    message: string;
    journey?: Journey;
    tokenSerial: string;
    balance?: number;
    remainingBalance?: number;
}

export interface AlightingPayload {
    tokenSerial: string;
    alightingStopId?: number;
    alightingStopName?: string;
    isPeak?: boolean;
}

export interface AlightingResult {
    success: boolean;
    status: 'Completed';
    journey: Journey;
    fareDeducted: number;
    newBalance: number;
    lowBalanceWarning: boolean;
    message: string;
}

export interface FareEstimatePayload {
    routeId?: number;
    fromStation?: string;
    toStation?: string;
    isPeak?: boolean;
}

export interface FareEstimateResult {
    fromStation: string;
    toStation: string;
    distanceKm: number;
    estimatedFare: number;
    isPeak: boolean;
}

export interface NotificationItem {
    id: number;
    userId: number;
    type: 'BoardingConfirmation' | 'FareDeduction' | 'JourneyCompletion' | 'LowBalanceWarning' | 'InsufficientCredit';
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}

/** Taps in at boarding gate to start a journey */
export async function boardJourney(payload: BoardingPayload): Promise<BoardingResult> {
    const res = await apiClient.post<BoardingResult>('/journey/board', payload);
    return res.data;
}

/** Taps out at alighting gate to finish journey and deduct fare */
export async function alightJourney(payload: AlightingPayload): Promise<AlightingResult> {
    const res = await apiClient.post<AlightingResult>('/journey/alight', payload);
    return res.data;
}

/** Retrieves currently ongoing journey */
export async function getActiveJourney(): Promise<Journey | null> {
    const res = await apiClient.get<{ success: boolean; activeJourney: Journey | null }>('/journey/active');
    return res.data.activeJourney;
}

/** Retrieves passenger journey history */
export async function getJourneyHistory(limit: number = 20): Promise<Journey[]> {
    const res = await apiClient.get<{ success: boolean; history: Journey[] }>(`/journey/history?limit=${limit}`);
    return res.data.history;
}

/** Calculates estimated fare for trip */
export async function getFareEstimate(payload: FareEstimatePayload): Promise<FareEstimateResult> {
    const res = await apiClient.post<{ success: boolean; data: FareEstimateResult }>('/journey/fare-estimate', payload);
    return res.data.data;
}

/** Retrieves notifications */
export async function getNotifications(limit: number = 20): Promise<NotificationItem[]> {
    const res = await apiClient.get<{ success: boolean; notifications: NotificationItem[] }>(`/journey/notifications?limit=${limit}`);
    return res.data.notifications;
}

/** Marks a notification as read */
export async function markNotificationRead(id: number): Promise<void> {
    await apiClient.put(`/journey/notifications/${id}/read`);
}