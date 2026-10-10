import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { getBookingById, type BookingItem } from '@/api/bookingApi';

type PassMethod = 'QR' | 'Smartcard' | 'Barcode';

const PASS_METHODS: { type: PassMethod; label: string; sublabel: string; icon: string }[] = [
    { type: 'QR', label: 'QR Code', sublabel: 'Digital App Pass', icon: '📱' },
    { type: 'Smartcard', label: 'Smartcard', sublabel: 'Physical Transit Card', icon: '💳' },
    { type: 'Barcode', label: 'Barcode', sublabel: 'Printed Ticket Voucher', icon: '🎟️' },
];

export default function BookingTokenScreen() {
    const params = useLocalSearchParams<{
        bookingId?: string;
        bookingRef?: string;
        tokenSerial?: string;
        routeNumber?: string;
        routeName?: string;
        boardingStop?: string;
        alightingStop?: string;
        scheduleDate?: string;
        timeSlot?: string;
        fareAmount?: string;
    }>();

    const bookingId = Number(params.bookingId);
    const { activateBookingPassToken, bookingsLoading } = usePassenger();

    const [booking, setBooking] = useState<BookingItem | null>(null);
    const [loadingBooking, setLoadingBooking] = useState(false);
    const [selectedPass, setSelectedPass] = useState<PassMethod>('QR');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Fetch latest booking status
    const loadBookingData = useCallback(async () => {
        if (!bookingId) return;
        setLoadingBooking(true);
        try {
            const data = await getBookingById(bookingId);
            setBooking(data);
            if (data.PassType) {
                setSelectedPass(data.PassType);
            }
        } catch (err) {
            console.error('Failed to load booking:', err);
        } finally {
            setLoadingBooking(false);
        }
    }, [bookingId]);

    useEffect(() => {
        loadBookingData();
    }, [loadBookingData]);

    // Handle token activation & QR generation
    const handleActivateToken = async () => {
        if (!bookingId) return;
        try {
            const updated = await activateBookingPassToken(bookingId, selectedPass);
            setBooking(updated);
            setShowSuccessModal(true);
        } catch (err: any) {
            console.error('Activation failed:', err);
        }
    };

    const displayBookingRef = booking?.BookingRef || params.bookingRef || 'BK-20261010-8291';
    const displayTokenSerial = booking?.TokenSerial || params.tokenSerial || 'TK-BK-88214';
    const displayRouteNumber = booking?.RouteNumber || params.routeNumber || '245';
    const displayRouteName   = booking?.RouteName || params.routeName || 'Negombo - Colombo Fort';
    const displayBoarding    = booking?.BoardingStop?.StopName || params.boardingStop || 'Negombo Bus Stand';
    const displayAlighting   = booking?.AlightingStop?.StopName || params.alightingStop || 'Colombo Fort';
    const displayDate        = booking?.ScheduleDate || params.scheduleDate || '2026-10-10';
    const displayTimeSlot    = booking?.TimeSlot || params.timeSlot || '09:00 - 10:30';
    const displayFare        = booking?.FareAmount ?? parseFloat(params.fareAmount || '170');

    // QR value encodes unique booking token payload
    const qrValue = booking?.QrPayload || JSON.stringify({
        bookingId: booking?.Id || bookingId,
        bookingRef: displayBookingRef,
        tokenSerial: displayTokenSerial,
        routeNumber: displayRouteNumber,
        boarding: displayBoarding,
        alighting: displayAlighting,
        date: displayDate,
        timeSlot: displayTimeSlot,
        fare: displayFare,
        passType: selectedPass,
    });

    const isTokenActive = booking?.TokenStatus === 'Active';

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
                    <Text style={styles.headerTitle}>Journey Pass & QR</Text>
                    <Text style={styles.headerSubtitle}>Ref: #{displayBookingRef}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Journey Trip Card ─────────────────────────────────── */}
                <View style={styles.tripCard}>
                    <View style={styles.tripHeaderRow}>
                        <View style={styles.routeBadge}>
                            <Text style={styles.routeBadgeText}>{displayRouteNumber}</Text>
                        </View>
                        <View style={styles.tripHeaderInfo}>
                            <Text style={styles.tripRouteName}>{displayRouteName}</Text>
                            <Text style={styles.tripScheduleDate}>
                                📅 {displayDate} · ⏰ {displayTimeSlot}
                            </Text>
                        </View>
                        <View style={styles.paidBadge}>
                            <Text style={styles.paidBadgeText}>PAID</Text>
                        </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.tripDetailRow}>
                        <Text style={styles.tripDetailLabel}>Boarding</Text>
                        <Text style={styles.tripDetailValueGreen}>{displayBoarding}</Text>
                    </View>

                    <View style={styles.tripDetailRow}>
                        <Text style={styles.tripDetailLabel}>Alighting</Text>
                        <Text style={styles.tripDetailValueGreen}>{displayAlighting}</Text>
                    </View>

                    <View style={styles.tripDetailRow}>
                        <Text style={styles.tripDetailLabel}>Total Fare Paid</Text>
                        <Text style={styles.tripDetailFare}>LKR {displayFare.toFixed(2)}</Text>
                    </View>

                    <View style={styles.tripDetailRow}>
                        <Text style={styles.tripDetailLabel}>Booking Token</Text>
                        <Text style={styles.tripDetailToken}>#{displayTokenSerial}</Text>
                    </View>
                </View>

                {/* ── Pass Method Selector ──────────────────────────────── */}
                <Text style={styles.sectionHeader}>SELECT PASS METHOD</Text>
                <Text style={styles.sectionSub}>
                    Choose how you want to present your transit token at the bus validator:
                </Text>

                <View style={styles.passGrid}>
                    {PASS_METHODS.map((pm) => {
                        const isSelected = selectedPass === pm.type;
                        return (
                            <Pressable
                                key={pm.type}
                                style={[styles.passCard, isSelected ? styles.passCardActive : undefined]}
                                onPress={() => setSelectedPass(pm.type)}
                            >
                                <Text style={styles.passIcon}>{pm.icon}</Text>
                                <Text style={[styles.passTitle, isSelected ? styles.passTitleActive : undefined]}>
                                    {pm.label}
                                </Text>
                                <Text style={styles.passSub}>{pm.sublabel}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* ── QR Code Display (if QR is selected or active) ──────── */}
                {selectedPass === 'QR' && (
                    <View style={styles.qrCard}>
                        <View style={styles.tokenStatusRow}>
                            <View style={[styles.statusDot, isTokenActive ? styles.statusDotActive : undefined]} />
                            <Text style={styles.tokenStatusText}>
                                {isTokenActive ? 'TOKEN ACTIVE · READY TO SCAN' : 'PENDING ACTIVATION'}
                            </Text>
                        </View>

                        <View style={styles.qrCodeWrapper}>
                            <QRCode
                                value={qrValue}
                                size={190}
                                color="#083C2F"
                                backgroundColor="#FFFFFF"
                            />
                        </View>

                        <Text style={styles.qrSerialText}>Token #{displayTokenSerial}</Text>
                        <Text style={styles.qrInstruction}>
                            Scan this QR code at the bus optical gate when boarding and alighting.
                        </Text>
                        <Text style={styles.qrIsolationNotice}>
                            🔒 Dedicated Token: Valid exclusively for this booked trip on {displayDate}.
                        </Text>
                    </View>
                )}

                {/* ── Physical Smartcard / Barcode Guide ────────────────── */}
                {selectedPass !== 'QR' && (
                    <View style={styles.physicalCardNotice}>
                        <Text style={styles.physicalIcon}>{selectedPass === 'Smartcard' ? '💳' : '🎟️'}</Text>
                        <Text style={styles.physicalTitle}>
                            {selectedPass === 'Smartcard' ? 'Smartcard Transit Pass' : 'Printed Barcode Ticket'}
                        </Text>
                        <Text style={styles.physicalDesc}>
                            Your booking token #{displayTokenSerial} is assigned to your selected pass method. Present your physical card or printed ticket at the transit terminal gate.
                        </Text>
                    </View>
                )}

                {/* ── Main Activation Button ────────────────────────────── */}
                <View style={styles.actionWrap}>
                    {!isTokenActive ? (
                        <Button
                            label={`Activate ${selectedPass} Token & Finish`}
                            onPress={handleActivateToken}
                            loading={bookingsLoading}
                            style={styles.activateBtn}
                        />
                    ) : (
                        <Button
                            label="Done · Back to Home"
                            onPress={() => router.replace('/passenger')}
                            style={styles.doneBtn}
                        />
                    )}

                    <Pressable
                        style={styles.scannerNavBtn}
                        onPress={() => router.push('/passenger/gate-scanner')}
                    >
                        <Text style={styles.scannerNavBtnText}>Simulate Gate Tap-In / Tap-Out →</Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* ── Booking Completed Success Popup Modal ─────────────── */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Success Icon */}
                        <View style={styles.modalIconWrap}>
                            <Text style={styles.modalIconText}>✓</Text>
                        </View>

                        <Text style={styles.modalTitle}>Booking Confirmed!</Text>
                        <Text style={styles.modalSubtitle}>
                            Your journey is reserved and your digital pass is activated.
                        </Text>

                        {/* Booking Summary Box */}
                        <View style={styles.modalSummaryBox}>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Booking Ref</Text>
                                <Text style={styles.modalValueBold}>{displayBookingRef}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Token Serial</Text>
                                <Text style={styles.modalValueGreen}>#{displayTokenSerial}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Route</Text>
                                <Text style={styles.modalValueBold}>Route {displayRouteNumber}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Departure</Text>
                                <Text style={styles.modalValue}>{displayDate} · {displayTimeSlot}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Fare Paid</Text>
                                <Text style={styles.modalValueBold}>LKR {displayFare.toFixed(2)}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Pass Type</Text>
                                <Text style={styles.modalValueGreen}>{selectedPass} Pass</Text>
                            </View>
                        </View>

                        <Button
                            label="View Active Token"
                            onPress={() => setShowSuccessModal(false)}
                            style={styles.modalBtn}
                        />

                        <Pressable
                            style={styles.modalCloseBtn}
                            onPress={() => {
                                setShowSuccessModal(false);
                                router.replace('/passenger');
                            }}
                        >
                            <Text style={styles.modalCloseText}>Return to Home</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F3F6F8',
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
    scroll: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    tripCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    tripHeaderRow: {
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
    tripHeaderInfo: {
        flex: 1,
    },
    tripRouteName: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    tripScheduleDate: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        marginTop: 2,
    },
    paidBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.sm,
    },
    paidBadgeText: {
        color: '#0A9A5F',
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#EDF2F7',
        marginVertical: Spacing.sm,
    },
    tripDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    tripDetailLabel: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
    },
    tripDetailValueGreen: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
    },
    tripDetailFare: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#0A9A5F',
    },
    tripDetailToken: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#334155',
    },
    sectionHeader: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#334155',
        letterSpacing: 0.6,
        marginBottom: 2,
    },
    sectionSub: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
        marginBottom: Spacing.sm,
    },
    passGrid: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    passCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        padding: Spacing.sm,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    passCardActive: {
        borderColor: '#0A9A5F',
        backgroundColor: '#F0FDF4',
    },
    passIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    passTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#475569',
    },
    passTitleActive: {
        color: '#0A9A5F',
    },
    passSub: {
        fontSize: 9,
        color: Colors.gray400,
        textAlign: 'center',
        marginTop: 2,
    },
    qrCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    tokenStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#CBD5E1',
        marginRight: 6,
    },
    statusDotActive: {
        backgroundColor: '#10B981',
    },
    tokenStatusText: {
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: '#0A9A5F',
        letterSpacing: 0.5,
    },
    qrCodeWrapper: {
        padding: Spacing.md,
        backgroundColor: '#FFFFFF',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    qrSerialText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
        marginBottom: 4,
    },
    qrInstruction: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: Spacing.md,
    },
    qrIsolationNotice: {
        fontSize: 10,
        color: '#0369A1',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.sm,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    physicalCardNotice: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    physicalIcon: {
        fontSize: 36,
        marginBottom: Spacing.xs,
    },
    physicalTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    physicalDesc: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        textAlign: 'center',
        lineHeight: 18,
    },
    actionWrap: {
        marginBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    activateBtn: {
        backgroundColor: '#0F6B56',
    },
    doneBtn: {
        backgroundColor: '#083C2F',
    },
    scannerNavBtn: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    scannerNavBtnText: {
        fontSize: FontSize.xs,
        color: '#E67E22',
        fontWeight: FontWeight.bold,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        ...Shadow.lg,
    },
    modalIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    modalIconText: {
        fontSize: 30,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    modalTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
        textAlign: 'center',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    modalSummaryBox: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: Spacing.lg,
        gap: 6,
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalLabel: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
    },
    modalValue: {
        fontSize: FontSize.xs,
        color: Colors.text,
    },
    modalValueBold: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    modalValueGreen: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
    },
    modalBtn: {
        width: '100%',
        backgroundColor: '#0F6B56',
    },
    modalCloseBtn: {
        marginTop: Spacing.md,
        paddingVertical: 6,
    },
    modalCloseText: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
        fontWeight: FontWeight.semibold,
    },
});

