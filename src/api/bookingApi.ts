import { apiClient } from './apiClient';

export interface RouteStop {
    Id: number;
    StopName: string;
    StopOrder: number;
    DistanceFromStartKm: number;
}

export interface RouteSchedule {
    Id: number;
    Date: string;
    StartTime: string;
    EndTime: string;
    RouteId: number;
    SlotLabel?: string;
    Status: string;
}

export interface BookingRoute {
    Id: number;
    RouteNumber: string;
    RouteName: string;
    StartLocation: string;
    EndLocation: string;
    DistanceKm?: number;
    CurrentStatus?: boolean;
    stops: RouteStop[];
    schedulesCount: number;
    schedules: RouteSchedule[];
}

export interface BookingItem {
    Id: number;
    BookingRef: string;
    UserId: number;
    RouteId: number;
    RouteNumber: string;
    RouteName: string;
    ScheduleId: number;
    ScheduleDate: string;
    TimeSlot: string;
    SlotLabel?: string;
    BoardingStop: {
        StopId: number;
        StopName: string;
        DistanceFromStartKm: number;
    };
    AlightingStop: {
        StopId: number;
        StopName: string;
        DistanceFromStartKm: number;
    };
    DistanceKm: number;
    AdultCount?: number;
    MinorCount?: number;
    PassengerCount?: number;
    PassengerType?: 'Adult' | 'Minor' | 'Mixed';
    AdultFareUnit?: number;
    MinorFareUnit?: number;
    BaseUnitFare?: number;
    UnitFare?: number;
    FareAmount: number;
    IsPeak: boolean;
    PassType: 'QR' | 'Smartcard' | 'Barcode' | null;
    TokenSerial: string;
    TokenStatus: 'PendingActivation' | 'Active' | 'Used' | 'Cancelled';
    QrPayload?: string | null;
    Status: 'Booked' | 'InProgress' | 'Completed' | 'Cancelled';
    CreatedAt: string;
    UpdatedAt: string;
    CompletedAt?: string | null;
    CancelledAt?: string | null;
}

export interface CreateBookingPayload {
    routeId: number;
    scheduleId: number;
    boardingStopId: number;
    alightingStopId: number;
    isPeak?: boolean;
    adultCount?: number;
    minorCount?: number;
    passengerCount?: number;
    passengerType?: 'Adult' | 'Minor' | 'Mixed';
}

export interface CreateBookingResult {
    success: boolean;
    message: string;
    booking: BookingItem;
    newBalance: number;
}

export interface CalculateBookingFarePayload {
    routeId: number;
    boardingStopId: number;
    alightingStopId: number;
    isPeak?: boolean;
    adultCount?: number;
    minorCount?: number;
    passengerCount?: number;
    passengerType?: 'Adult' | 'Minor' | 'Mixed';
}

export interface CalculateBookingFareResult {
    routeId: number;
    routeNumber: string;
    routeName: string;
    boardingStop: RouteStop;
    alightingStop: RouteStop;
    distanceKm: number;
    adultCount?: number;
    minorCount?: number;
    adultFareUnit?: number;
    minorFareUnit?: number;
    baseUnitFare?: number;
    unitFare?: number;
    passengerCount?: number;
    passengerType?: 'Adult' | 'Minor' | 'Mixed';
    fareAmount: number;
    isPeak: boolean;
}

/**
 * 1. Fetches all routes with schedules for a selected date.
 */
export async function getBookingRoutes(date?: string): Promise<{ date: string; routes: BookingRoute[] }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await apiClient.get<{ success: boolean; date: string; routes: BookingRoute[] }>(`/booking/routes${query}`);
    return { date: res.data.date, routes: res.data.routes };
}

/**
 * 2. Fetches single route details and stops.
 */
export async function getRouteBookingDetails(routeId: number, date?: string): Promise<{ route: BookingRoute; schedules: RouteSchedule[] }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await apiClient.get<{ success: boolean; route: BookingRoute; schedules: RouteSchedule[] }>(`/booking/routes/${routeId}${query}`);
    return { route: res.data.route, schedules: res.data.schedules };
}

/**
 * 3. Pre-calculates journey fare.
 */
export async function calculateBookingFare(payload: CalculateBookingFarePayload): Promise<CalculateBookingFareResult> {
    const res = await apiClient.post<{ success: boolean; data: CalculateBookingFareResult }>('/booking/calculate-fare', payload);
    return res.data.data;
}

/**
 * 4. Books a journey.
 */
export async function createBooking(payload: CreateBookingPayload): Promise<CreateBookingResult> {
    const res = await apiClient.post<CreateBookingResult>('/booking', payload);
    return res.data;
}

/**
 * 5. Activates token & pass method for a specific booking.
 */
export async function activateBookingToken(bookingId: number, passType: 'QR' | 'Smartcard' | 'Barcode'): Promise<{ success: boolean; message: string; booking: BookingItem }> {
    const res = await apiClient.post<{ success: boolean; message: string; booking: BookingItem }>(`/booking/${bookingId}/activate-token`, { passType });
    return res.data;
}

/**
 * 6. Fetches passenger bookings.
 */
export async function getUserBookings(limit: number = 50): Promise<BookingItem[]> {
    const res = await apiClient.get<{ success: boolean; bookings: BookingItem[] }>(`/booking?limit=${limit}`);
    return res.data.bookings;
}

/**
 * 7. Fetches single booking details.
 */
export async function getBookingById(bookingId: number): Promise<BookingItem> {
    const res = await apiClient.get<{ success: boolean; booking: BookingItem }>(`/booking/${bookingId}`);
    return res.data.booking;
}

/**
 * 8. Cancels a booking and refunds fare.
 */
export async function cancelBooking(bookingId: number): Promise<{ success: boolean; message: string; booking: BookingItem; refundedAmount: number; newBalance: number }> {
    const res = await apiClient.post<{ success: boolean; message: string; booking: BookingItem; refundedAmount: number; newBalance: number }>(`/booking/${bookingId}/cancel`);
    return res.data;
}