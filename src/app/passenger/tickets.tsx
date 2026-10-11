import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button, Text } from '@/components/ui';
import {
    Colors,
    FontSize,
    FontWeight,
    Radius,
    Shadow,
    Spacing,
} from '@/constants/theme';
import { usePassenger } from '@/store/passengerStore';
import { useAuth } from '@/store/authStore';

/** Seconds remaining until the QR expires (counts down from expiresIn). */
function useQRCountdown(expiresIn: number | null): number {
    const [secs, setSecs] = useState(expiresIn ?? 0);
    const ref = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!expiresIn) return;
        setSecs(expiresIn);
        if (ref.current) clearInterval(ref.current);
        ref.current = setInterval(() => {
            setSecs((s) => Math.max(0, s - 1));
        }, 1000);
        return () => { if (ref.current) clearInterval(ref.current); };
    }, [expiresIn]);

    return secs;
}

export default function TicketsScreen() {
    const { user } = useAuth();
    const {
        profile,
        token,
        qr,
        bookings,
        loadBookings,
        tokenLoading,
        error,
        loadToken,
        refreshQR,
        clearError,
    } = usePassenger();

    const countdown = useQRCountdown(qr?.expiresIn ?? null);

    // Active scheduled bookings that have a QR or can be scanned
    const todayIso = new Date().toISOString().split('T')[0];
    const activeBookings = (bookings || []).filter(
        (b) => b.Status === 'Booked' || b.Status === 'InProgress'
    );

    // Sort: today first, then upcoming dates
    const sortedBookings = [...activeBookings].sort((a, b) => {
        if (a.ScheduleDate !== b.ScheduleDate) {
            return a.ScheduleDate.localeCompare(b.ScheduleDate);
        }
        return a.TimeSlot.localeCompare(b.TimeSlot);
    });

    // Selected QR view: 'default' (wallet token) or bookingId
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
        sortedBookings.length > 0 ? sortedBookings[0].Id : null
    );

    /** Load token & bookings on mount */
    useEffect(() => {
        (async () => {
            await loadToken();
            await loadBookings();
        })();
    }, []);

    useEffect(() => {
        if (sortedBookings.length > 0 && selectedBookingId === null) {
            setSelectedBookingId(sortedBookings[0].Id);
        }
    }, [bookings]);

    useEffect(() => {
        if (token?.status === 'Active' && !qr) {
            refreshQR();
        }
    }, [token]);

    const handleRefresh = useCallback(() => {
        clearError();
        refreshQR();
        loadBookings();
    }, []);

    const displayName = profile?.fullName || user?.email || 'Passenger';
    const balance = profile?.account.balance ?? 0;

    const currentSelectedBooking = sortedBookings.find((b) => b.Id === selectedBookingId);

    // If viewing a booking QR, build its payload
    const bookingQrValue = currentSelectedBooking
        ? currentSelectedBooking.QrPayload ||
          JSON.stringify({
              bookingId: currentSelectedBooking.Id,
              bookingRef: currentSelectedBooking.BookingRef,
              tokenSerial: currentSelectedBooking.TokenSerial,
              routeNumber: currentSelectedBooking.RouteNumber,
              boarding: currentSelectedBooking.BoardingStop.StopName,
              alighting: currentSelectedBooking.AlightingStop.StopName,
              date: currentSelectedBooking.ScheduleDate,
              timeSlot: currentSelectedBooking.TimeSlot,
              passengerCount: currentSelectedBooking.PassengerCount || 1,
              passengerType: currentSelectedBooking.PassengerType || 'Adult',
              fare: currentSelectedBooking.FareAmount,
          })
        : null;

    // ── No token or booking state ─────────────────────────────────────────
    if (!tokenLoading && !token && sortedBookings.length === 0) {
        return (
            <View style={styles.root}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Your Transit Pass QR</Text>
                </View>
                <View style={styles.noTokenContainer}>
                    <Text style={styles.noTokenEmoji}>🎫</Text>
                    <Text style={styles.noTokenTitle}>No Active Booking or Token</Text>
                    <Text style={styles.noTokenSubtitle}>
                        Book a scheduled bus journey to generate your dedicated booking QR code.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.passengerName}>{displayName}</Text>
                    <Text style={styles.balanceLabel}>Account Balance</Text>
                </View>
                <Text style={styles.balanceAmount}>LKR {balance.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Ticket Tabs: Booked Journeys vs General Wallet Token ── */}
                {sortedBookings.length > 0 && (
                    <View style={styles.ticketTabsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ticketTabsScroll}>
                            {sortedBookings.map((b) => {
                                const isSelected = selectedBookingId === b.Id;
                                const isToday = b.ScheduleDate === todayIso;
                                return (
                                    <Pressable
                                        key={b.Id}
                                        style={[styles.ticketTabPill, isSelected ? styles.ticketTabPillActive : undefined]}
                                        onPress={() => setSelectedBookingId(b.Id)}
                                    >
                                        <Text style={[styles.ticketTabTitle, isSelected ? styles.ticketTabTitleActive : undefined]}>
                                            {isToday ? 'Today' : b.ScheduleDate} · Route {b.RouteNumber}
                                        </Text>
                                        <Text style={[styles.ticketTabSub, isSelected ? styles.ticketTabSubActive : undefined]}>
                                            {b.TimeSlot} ({b.PassengerCount || 1} {b.PassengerType || 'Adult'})
                                        </Text>
                                    </Pressable>
                                );
                            })}

                            {token && (
                                <Pressable
                                    style={[styles.ticketTabPill, selectedBookingId === null ? styles.ticketTabPillActive : undefined]}
                                    onPress={() => setSelectedBookingId(null)}
                                >
                                    <Text style={[styles.ticketTabTitle, selectedBookingId === null ? styles.ticketTabTitleActive : undefined]}>
                                        Wallet Token
                                    </Text>
                                    <Text style={[styles.ticketTabSub, selectedBookingId === null ? styles.ticketTabSubActive : undefined]}>
                                        #{token.serial}
                                    </Text>
                                </Pressable>
                            )}
                        </ScrollView>
                    </View>
                )}

                {/* ── QR Card ─────────────────────────────────────────── */}
                <View style={styles.qrCard}>
                    {/* Active badge */}
                    <View style={styles.cardTopRow}>
                        <View style={[styles.statusBadge, styles.statusBadgeActive]}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>
                                {currentSelectedBooking
                                    ? currentSelectedBooking.Status.toUpperCase()
                                    : (token?.status?.toUpperCase() ?? 'ACTIVE')}
                            </Text>
                        </View>
                        <Text style={styles.refreshHint}>
                            {currentSelectedBooking
                                ? `Valid on ${currentSelectedBooking.ScheduleDate}`
                                : qr
                                ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                                : '--:--'}
                        </Text>
                    </View>

                    {/* Booking metadata banner if showing booking QR */}
                    {currentSelectedBooking && (
                        <View style={styles.bookingBadgeBanner}>
                            <Text style={styles.bookingBannerRoute}>
                                Route {currentSelectedBooking.RouteNumber} · {currentSelectedBooking.RouteName}
                            </Text>
                            <Text style={styles.bookingBannerStops}>
                                {currentSelectedBooking.BoardingStop.StopName} → {currentSelectedBooking.AlightingStop.StopName}
                            </Text>
                            <Text style={styles.bookingBannerMeta}>
                                📅 {currentSelectedBooking.ScheduleDate} · ⏰ {currentSelectedBooking.TimeSlot} · 🧑 {currentSelectedBooking.PassengerCount || 1} {currentSelectedBooking.PassengerType || 'Adult'}
                            </Text>
                        </View>
                    )}

                    {/* QR code */}
                    <View style={styles.qrWrapper}>
                        {currentSelectedBooking ? (
                            <QRCode
                                value={bookingQrValue || 'BOOKING-TOKEN'}
                                size={210}
                                color="#083C2F"
                                backgroundColor={Colors.white}
                            />
                        ) : tokenLoading || !qr ? (
                            <ActivityIndicator size="large" color={Colors.primaryDark} />
                        ) : (
                            <QRCode
                                value={qr.qrPayload}
                                size={210}
                                color={Colors.black}
                                backgroundColor={Colors.white}
                            />
                        )}
                    </View>

                    <Text style={styles.tokenSerial}>
                        {currentSelectedBooking
                            ? `Token #${currentSelectedBooking.TokenSerial}`
                            : `Token #${token?.serial}`}
                    </Text>
                    <Text style={styles.tokenHint}>
                        {currentSelectedBooking
                            ? `Dedicated pass for ${currentSelectedBooking.PassengerCount || 1} ${currentSelectedBooking.PassengerType || 'Adult'}(s)`
                            : 'Tap in and tap out with this QR'}
                    </Text>

                    {/* Error state */}
                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                </View>

                {/* ── Refresh button ──────────────────────────────────── */}
                <Button
                    variant="outline"
                    label="⟳  Refresh QR Code"
                    onPress={handleRefresh}
                />

                {/* ── Instruction ─────────────────────────────────────── */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>ℹ</Text>
                    <Text style={styles.infoText}>
                        Present this QR code to the reader device when boarding and leaving
                        Shattle Transport vehicles. Keep screen brightness high.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.surfaceLight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        backgroundColor: Colors.gradientTop,
        paddingTop: 56,
        paddingBottom: Spacing.five,
        paddingHorizontal: Spacing.five,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    passengerName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    balanceLabel: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
    },
    balanceAmount: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.black,
        color: Colors.orange,
    },
    scroll: {
        padding: Spacing.five,
        gap: Spacing.four,
        paddingBottom: Spacing.twelve,
    },
    ticketTabsContainer: {
        marginBottom: Spacing.xs,
    },
    ticketTabsScroll: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingBottom: 4,
    },
    ticketTabPill: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        minWidth: 120,
    },
    ticketTabPillActive: {
        backgroundColor: '#E6FAF2',
        borderColor: '#0F6B56',
    },
    ticketTabTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#64748B',
    },
    ticketTabTitleActive: {
        color: '#0F6B56',
    },
    ticketTabSub: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 2,
    },
    ticketTabSubActive: {
        color: '#0F6B56',
        fontWeight: FontWeight.semibold,
    },
    bookingBadgeBanner: {
        backgroundColor: '#F0FDF4',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        padding: Spacing.sm,
        alignSelf: 'stretch',
        alignItems: 'center',
        gap: 2,
    },
    bookingBannerRoute: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#166534',
    },
    bookingBannerStops: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: '#15803D',
    },
    bookingBannerMeta: {
        fontSize: 10,
        color: '#14532D',
        marginTop: 2,
    },
    qrCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius['2xl'],
        padding: Spacing.five,
        alignItems: 'center',
        gap: Spacing.three,
        ...Shadow.md,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surfaceLight,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.three,
        paddingVertical: 4,
    },
    statusBadgeActive: {
        backgroundColor: '#E6FAF2',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
    },
    statusText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.primaryDark,
    },
    refreshHint: {
        fontSize: FontSize.xs,
        color: Colors.inputLightPlaceholder,
    },
    qrWrapper: {
        width: 220,
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.inputLightBorder,
    },
    tokenSerial: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    tokenHint: {
        fontSize: FontSize.sm,
        color: Colors.inputLightPlaceholder,
    },
    errorBox: {
        backgroundColor: '#FFF0F0',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.error,
        padding: Spacing.three,
        alignSelf: 'stretch',
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.sm,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EBF6FF',
        borderRadius: Radius.lg,
        padding: Spacing.four,
        gap: Spacing.two,
        alignItems: 'flex-start',
    },
    infoIcon: {
        fontSize: FontSize.base,
        color: '#1A73E8',
    },
    infoText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textDark,
    },
    noTokenContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.three,
        padding: Spacing.eight,
    },
    noTokenEmoji: { fontSize: FontSize['3xl'] },
    noTokenTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textDark },
    noTokenSubtitle: { fontSize: FontSize.base, color: Colors.textDarkSecondary, textAlign: 'center' },
});

