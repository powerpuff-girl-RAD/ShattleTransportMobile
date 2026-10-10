import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Button, ConfirmationModal, Text } from '@/components/ui';
import {
    Colors,
    FontSize,
    FontWeight,
    Radius,
    Shadow,
    Spacing,
} from '@/constants/theme';
import { usePassenger } from '@/store/passengerStore';
import { getBookingById, type BookingItem } from '@/api/bookingApi';

export default function BookingDetailsScreen() {
    const params = useLocalSearchParams<{ id?: string }>();
    const bookingId = Number(params.id);

    const { cancelJourneyBooking, bookingsLoading } = usePassenger();

    const [booking, setBooking] = useState<BookingItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);

    const fetchBooking = useCallback(async () => {
        if (!bookingId) return;
        setLoading(true);
        try {
            const data = await getBookingById(bookingId);
            setBooking(data);
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to load booking details');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    const handleConfirmCancel = async () => {
        if (!booking) return;
        try {
            await cancelJourneyBooking(booking.Id);
            setShowCancelModal(false);
            Alert.alert(
                'Booking Cancelled',
                `Your booking #${booking.BookingRef} has been cancelled and LKR ${booking.FareAmount.toFixed(2)} has been refunded to your wallet balance.`,
                [{ text: 'OK', onPress: () => fetchBooking() }]
            );
        } catch (err: any) {
            Alert.alert('Cancellation Error', err?.response?.data?.message || 'Failed to cancel booking');
        }
    };

    if (loading) {
        return (
            <View style={[styles.root, styles.center]}>
                <ActivityIndicator size="large" color="#0F6B56" />
                <Text style={styles.loadingText}>Loading booking details...</Text>
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={[styles.root, styles.center]}>
                <Text style={styles.errorTitle}>Booking Not Found</Text>
                <Button label="Back to Home" onPress={() => router.replace('/passenger')} style={styles.backHomeBtn} />
            </View>
        );
    }

    const isCancellable = booking.Status === 'Booked';
    const isCompleted = booking.Status === 'Completed';
    const isCancelled = booking.Status === 'Cancelled';
    const isInProgress = booking.Status === 'InProgress';

    const statusBadgeColor = isCompleted
        ? '#10B981'
        : isInProgress
        ? '#2563EB'
        : isCancelled
        ? '#EF4444'
        : '#E67E22';

    const passengerSummaryText = (booking.MinorCount && booking.MinorCount > 0)
        ? `${booking.AdultCount || 1} Adult${(booking.AdultCount || 1) > 1 ? 's' : ''}, ${booking.MinorCount} Minor${booking.MinorCount > 1 ? 's' : ''}`
        : `${booking.AdultCount || booking.PassengerCount || 1} Adult${(booking.AdultCount || booking.PassengerCount || 1) > 1 ? 's' : ''} (Standard)`;

    const qrValue = booking.QrPayload || JSON.stringify({
        bookingId: booking.Id,
        bookingRef: booking.BookingRef,
        tokenSerial: booking.TokenSerial,
        routeNumber: booking.RouteNumber,
        boarding: booking.BoardingStop.StopName,
        alighting: booking.AlightingStop.StopName,
        date: booking.ScheduleDate,
        timeSlot: booking.TimeSlot,
        adultCount: booking.AdultCount ?? 1,
        minorCount: booking.MinorCount ?? 0,
        passengerCount: booking.PassengerCount || 1,
        passengerType: booking.PassengerType || 'Adult',
        fare: booking.FareAmount,
    });

    return (
        <View style={styles.root}>
            {/* ── Top Header ──────────────────────────────────────────── */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backBtn}
                    onPress={() => router.replace('/passenger')}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backBtnText}>←</Text>
                </Pressable>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <Text style={styles.headerSubtitle}>Ref #{booking.BookingRef}</Text>
                </View>
                <View style={[styles.headerStatusBadge, { backgroundColor: statusBadgeColor }]}>
                    <Text style={styles.headerStatusText}>{booking.Status.toUpperCase()}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Status Notice Banner ──────────────────────────────── */}
                <View style={[styles.statusNotice, isCancelled ? styles.statusNoticeCancel : styles.statusNoticeOk]}>
                    <Text style={styles.noticeIcon}>{isCancelled ? '❌' : isCompleted ? '🏁' : isInProgress ? '🚌' : '🎫'}</Text>
                    <View style={styles.noticeTextWrap}>
                        <Text style={styles.noticeTitle}>
                            {isCancelled
                                ? 'Booking Cancelled & Refunded'
                                : isCompleted
                                ? 'Journey Completed'
                                : isInProgress
                                ? 'Journey In Progress'
                                : 'Scheduled Journey Confirmed'}
                        </Text>
                        <Text style={styles.noticeSub}>
                            {isCancelled
                                ? `Cancelled on ${new Date(booking.CancelledAt || booking.UpdatedAt).toLocaleDateString()}. Fare was refunded.`
                                : isCompleted
                                ? 'Passenger safely alighted at destination terminal.'
                                : isInProgress
                                ? 'Passenger boarded. Present token at destination gate to tap out.'
                                : `Departure on ${booking.ScheduleDate} (${booking.TimeSlot}).`}
                        </Text>
                    </View>
                </View>

                {/* ── Route & Stops Card ────────────────────────────────── */}
                <View style={styles.card}>
                    <View style={styles.routeHeaderRow}>
                        <View style={styles.routeBadge}>
                            <Text style={styles.routeBadgeText}>{booking.RouteNumber}</Text>
                        </View>
                        <View style={styles.routeHeaderInfo}>
                            <Text style={styles.routeName}>{booking.RouteName}</Text>
                            <Text style={styles.routeTimeSlot}>
                                ⏰ {booking.TimeSlot} · {booking.SlotLabel || 'Standard Departure'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Travel Date</Text>
                        <Text style={styles.detailValueBold}>{booking.ScheduleDate}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Boarding Stop</Text>
                        <Text style={styles.detailValueGreen}>{booking.BoardingStop.StopName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Alighting Stop</Text>
                        <Text style={styles.detailValueGreen}>{booking.AlightingStop.StopName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Passengers</Text>
                        <Text style={styles.detailValue}>
                            {passengerSummaryText}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Distance</Text>
                        <Text style={styles.detailValue}>{booking.DistanceKm} km</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Fare Paid</Text>
                        <Text style={styles.fareAmountText}>LKR {booking.FareAmount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* ── Token & QR Card ───────────────────────────────────── */}
                <View style={styles.card}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>DIGITAL TOKEN & PASS</Text>
                        <View style={styles.tokenStatusBadge}>
                            <Text style={styles.tokenStatusBadgeText}>{booking.TokenStatus}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Token Serial</Text>
                        <Text style={styles.tokenSerialText}>#{booking.TokenSerial}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Pass Method</Text>
                        <Text style={styles.detailValue}>{booking.PassType || 'QR Code'} Pass</Text>
                    </View>

                    {/* QR Code Preview */}
                    {booking.TokenStatus === 'Active' && (
                        <View style={styles.qrContainer}>
                            <View style={styles.qrBox}>
                                <QRCode value={qrValue} size={150} color="#083C2F" backgroundColor="#FFFFFF" />
                            </View>
                            <Text style={styles.qrCaption}>Scan at gate sensor when boarding & alighting</Text>
                            <Text style={styles.qrIsolatedTag}>Dedicated Token · Valid for this booking only</Text>
                        </View>
                    )}

                    {booking.TokenStatus === 'PendingActivation' && (
                        <View style={styles.activateNoticeWrap}>
                            <Text style={styles.activateNoticeText}>
                                Token pending pass selection. Click below to activate your digital pass.
                            </Text>
                            <Button
                                label="Activate Digital Pass"
                                onPress={() => router.push({
                                    pathname: '/passenger/booking-token',
                                    params: { bookingId: booking.Id.toString() },
                                })}
                                style={styles.activatePassBtn}
                            />
                        </View>
                    )}
                </View>

                {/* ── Actions: Simulate Gate / Cancel Booking ───────────── */}
                <View style={styles.actionsWrap}>
                    {!isCancelled && !isCompleted && (
                        <Button
                            label="Open Gate Scanner Simulation"
                            onPress={() => router.push('/passenger/gate-scanner')}
                            style={styles.gateScannerBtn}
                        />
                    )}

                    {isCancellable && (
                        <Button
                            label="Cancel Booking & Refund Fare"
                            onPress={() => setShowCancelModal(true)}
                            loading={bookingsLoading}
                            style={styles.cancelBtn}
                        />
                    )}
                </View>
            </ScrollView>

            {/* ── Cancel Confirmation Modal ──────────────────────────── */}
            <ConfirmationModal
                visible={showCancelModal}
                title="Cancel Journey Booking"
                message={`Are you sure you want to cancel your booking on Route ${booking.RouteNumber}? LKR ${booking.FareAmount.toFixed(2)} will be immediately refunded to your wallet.`}
                confirmLabel="Yes, Cancel & Refund"
                cancelLabel="Keep Booking"
                isDestructive={true}
                isLoading={bookingsLoading}
                onConfirm={handleConfirmCancel}
                onCancel={() => setShowCancelModal(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F3F6F8',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    loadingText: {
        fontSize: FontSize.sm,
        color: Colors.gray500,
        marginTop: Spacing.md,
    },
    errorTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    backHomeBtn: {
        backgroundColor: '#0F6B56',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F6B56',
        paddingHorizontal: Spacing.md,
        paddingTop: Platform.OS === 'ios' ? 54 : 36,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    backBtnText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        marginTop: -2,
    },
    headerTitleWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.78)',
        marginTop: 2,
    },
    headerStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.sm,
    },
    headerStatusText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    scroll: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    statusNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    statusNoticeOk: {
        backgroundColor: '#F0FDF4',
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    statusNoticeCancel: {
        backgroundColor: '#FEF2F2',
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    noticeIcon: {
        fontSize: 28,
        marginRight: Spacing.md,
    },
    noticeTextWrap: {
        flex: 1,
    },
    noticeTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    noticeSub: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        marginTop: 2,
        lineHeight: 16,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    routeHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeBadge: {
        backgroundColor: '#E67E22',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radius.sm,
        marginRight: Spacing.sm,
    },
    routeBadgeText: {
        color: Colors.white,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    routeHeaderInfo: {
        flex: 1,
    },
    routeName: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    routeTimeSlot: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: Spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    detailLabel: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
    },
    detailValue: {
        fontSize: FontSize.xs,
        color: Colors.text,
        fontWeight: FontWeight.medium,
    },
    detailValueBold: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    detailValueGreen: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
    },
    fareAmountText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: '#0A9A5F',
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    cardTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#334155',
        letterSpacing: 0.6,
    },
    tokenStatusBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    tokenStatusBadgeText: {
        color: '#0A9A5F',
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    tokenSerialText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
    },
    qrContainer: {
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    qrBox: {
        padding: Spacing.md,
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Shadow.sm,
    },
    qrCaption: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    qrIsolatedTag: {
        fontSize: 10,
        color: '#0284C7',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.sm,
        marginTop: 4,
    },
    activateNoticeWrap: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        backgroundColor: '#FFFBEB',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    activateNoticeText: {
        fontSize: FontSize.xs,
        color: '#92400E',
        marginBottom: Spacing.sm,
    },
    activatePassBtn: {
        backgroundColor: '#D97706',
    },
    actionsWrap: {
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    gateScannerBtn: {
        backgroundColor: '#0F6B56',
    },
    cancelBtn: {
        backgroundColor: '#DC2626',
    },
});

