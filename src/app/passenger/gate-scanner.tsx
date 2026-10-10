import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { router } from 'expo-router';
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

const ROUTE_STOPS = [
    { id: 1, name: 'Negombo Bus Stand', km: 0 },
    { id: 2, name: 'Katunayake Airport Junction', km: 8 },
    { id: 3, name: 'Ja-Ela Interchange', km: 19 },
    { id: 4, name: 'Peliyagoda Central', km: 31 },
    { id: 5, name: 'Colombo Fort', km: 38 },
];

export default function GateScannerScreen() {
    const {
        token,
        profile,
        activeJourney,
        bookings,
        loadBookings,
        loadActiveJourney,
        boardJourney,
        alightJourney,
        journeyLoading,
    } = usePassenger();

    const [selectedStopId, setSelectedStopId] = useState<number>(1);
    const [selectedAlightStopId, setSelectedAlightStopId] = useState<number>(5);
    const [customTokenSerial, setCustomTokenSerial] = useState<string>('');

    useEffect(() => {
        loadActiveJourney();
        loadBookings();
    }, [loadActiveJourney, loadBookings]);

    const activeTokenSerial = customTokenSerial || token?.serial || 'TK-88214';
    const currentBalance = profile?.account?.balance ?? 180;
    const isJourneyActive = !!activeJourney;

    // Handle Tap In (Boarding)
    const handleTapIn = async () => {
        const stop = ROUTE_STOPS.find((s) => s.id === selectedStopId) || ROUTE_STOPS[0];

        // Simulate or perform validation
        if (currentBalance < 30) {
            router.push({
                pathname: '/passenger/validation-result',
                params: {
                    tokenSerial: activeTokenSerial,
                    errorCode: 'ERR-TK-4021',
                    remainingBalance: currentBalance.toString(),
                    message: 'Insufficient balance for transit fare',
                },
            });
            return;
        }

        try {
            const res = await boardJourney({
                tokenSerial: activeTokenSerial,
                routeId: 1,
                boardingStopId: stop.id,
                boardingStopName: stop.name,
            });

            if (res.status === 'Accepted' && res.journey) {
                router.replace({
                    pathname: '/passenger/boarding-confirmation',
                    params: {
                        routeNumber: res.journey.routeNumber,
                        routeName: res.journey.routeName,
                        tokenSerial: res.journey.tokenSerial,
                        boardingStop: res.journey.boardingStop.stopName,
                        tapInTime: res.journey.createdAt,
                        balance: res.balance?.toString() || currentBalance.toString(),
                    },
                });
            } else {
                router.push({
                    pathname: '/passenger/validation-result',
                    params: {
                        tokenSerial: activeTokenSerial,
                        errorCode: res.errorCode || 'ERR-TK-4021',
                        remainingBalance: (res.remainingBalance ?? currentBalance).toString(),
                        message: res.message || 'Token verification failed',
                    },
                });
            }
        } catch (err: any) {
            Alert.alert('Scan Error', err?.message || 'Gate terminal could not verify token');
        }
    };

    // Handle Tap Out (Alighting)
    const handleTapOut = async () => {
        const stop = ROUTE_STOPS.find((s) => s.id === selectedAlightStopId) || ROUTE_STOPS[4];

        try {
            const res = await alightJourney({
                tokenSerial: activeTokenSerial,
                alightingStopId: stop.id,
                alightingStopName: stop.name,
                isPeak: true,
            });

            if (res.success) {
                router.replace({
                    pathname: '/passenger/alighting-confirmation',
                    params: {
                        routeNumber: res.journey.routeNumber,
                        routeName: res.journey.routeName,
                        tokenSerial: res.journey.tokenSerial,
                        boardingStop: res.journey.boardingStop.stopName,
                        alightingStop: res.journey.alightingStop?.stopName || stop.name,
                        distanceKm: res.journey.distanceKm?.toString() || '38',
                        fareAmount: res.fareDeducted.toString(),
                        newBalance: res.newBalance.toString(),
                        tapOutTime: res.journey.completedAt || new Date().toISOString(),
                        lowBalanceWarning: res.lowBalanceWarning ? 'true' : 'false',
                    },
                });
            }
        } catch (err: any) {
            Alert.alert('Tap Out Error', err?.message || 'Could not complete journey alighting');
        }
    };

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
                    <Text style={styles.headerTitle}>Transit Gate Scanner</Text>
                    <Text style={styles.headerSubtitle}>
                        {isJourneyActive ? 'Destination Exit Gate' : 'Boarding Entry Gate'}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Mode Banner ───────────────────────────────────────── */}
                <View style={[styles.modeBanner, isJourneyActive ? styles.modeBannerExit : styles.modeBannerEntry]}>
                    <Text style={styles.modeIcon}>{isJourneyActive ? '🚪' : '🚌'}</Text>
                    <View style={styles.modeTextWrap}>
                        <Text style={styles.modeTitle}>
                            {isJourneyActive ? 'Exit Gate · Tap-Out Required' : 'Entry Gate · Tap-In Boarding'}
                        </Text>
                        <Text style={styles.modeSub}>
                            {isJourneyActive
                                ? 'Tap out to calculate distance-based fare and complete trip'
                                : 'Present your digital token QR to validate and open gate'}
                        </Text>
                    </View>
                </View>

                {/* ── Optical Scanner Simulation ───────────────────────── */}
                <View style={styles.scannerCard}>
                    <View style={styles.scannerViewport}>
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />

                        <View style={styles.scannerCenter}>
                            <Text style={styles.qrIcon}>📱</Text>
                            <Text style={styles.scannerStatus}>
                                {isJourneyActive ? 'Ready to Exit' : 'Ready to Board'}
                            </Text>
                            <Text style={styles.tokenRef}>Token #{activeTokenSerial}</Text>
                        </View>

                        {/* Scanner Laser Bar */}
                        <View style={styles.laserBar} />
                    </View>

                    <Text style={styles.scannerHint}>
                        Hold phone steady against the gate optical sensor
                    </Text>
                </View>

                {/* ── Active Journey Details (if in progress) ───────────── */}
                {isJourneyActive && (
                    <View style={styles.tripCard}>
                        <Text style={styles.cardHeader}>ONGOING JOURNEY</Text>
                        <View style={styles.tripRow}>
                            <Text style={styles.tripLabel}>Route</Text>
                            <Text style={styles.tripValue}>
                                {activeJourney?.routeNumber} · {activeJourney?.routeName}
                            </Text>
                        </View>
                        <View style={styles.tripRow}>
                            <Text style={styles.tripLabel}>Boarded At</Text>
                            <Text style={styles.tripValueGreen}>
                                {activeJourney?.boardingStop.stopName}
                            </Text>
                        </View>
                        <View style={styles.tripRow}>
                            <Text style={styles.tripLabel}>Boarding Time</Text>
                            <Text style={styles.tripValue}>
                                {activeJourney?.createdAt
                                    ? new Date(activeJourney.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Just now'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Alighting Station Selection */}
                        <Text style={styles.fieldLabel}>SELECT ALIGHTING STATION</Text>
                        <View style={styles.stopPills}>
                            {ROUTE_STOPS.map((s) => (
                                <Pressable
                                    key={s.id}
                                    style={[
                                        styles.stopPill,
                                        selectedAlightStopId === s.id ? styles.stopPillActive : undefined,
                                    ]}
                                    onPress={() => setSelectedAlightStopId(s.id)}
                                >
                                    <Text
                                        style={[
                                            styles.stopPillText,
                                            selectedAlightStopId === s.id ? styles.stopPillTextActive : undefined,
                                        ]}
                                    >
                                        {s.name} ({s.km}km)
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Token Selector (General vs Booked Journeys) ──────── */}
                {!isJourneyActive && bookings && bookings.filter(b => b.Status === 'Booked' || b.Status === 'InProgress').length > 0 && (
                    <View style={styles.tripCard}>
                        <Text style={styles.cardHeader}>SELECT TOKEN / BOOKING TO SCAN</Text>
                        <View style={styles.stopPills}>
                            <Pressable
                                style={[
                                    styles.stopPill,
                                    !customTokenSerial ? styles.stopPillActive : undefined,
                                ]}
                                onPress={() => setCustomTokenSerial('')}
                            >
                                <Text
                                    style={[
                                        styles.stopPillText,
                                        !customTokenSerial ? styles.stopPillTextActive : undefined,
                                    ]}
                                >
                                    Default Wallet Token ({token?.serial || 'TK-88214'})
                                </Text>
                            </Pressable>
                            {bookings
                                .filter(b => b.Status === 'Booked' || b.Status === 'InProgress')
                                .map((b) => (
                                    <Pressable
                                        key={b.Id || b.TokenSerial}
                                        style={[
                                            styles.stopPill,
                                            customTokenSerial === b.TokenSerial ? styles.stopPillActive : undefined,
                                        ]}
                                        onPress={() => setCustomTokenSerial(b.TokenSerial)}
                                    >
                                        <Text
                                            style={[
                                                styles.stopPillText,
                                                customTokenSerial === b.TokenSerial ? styles.stopPillTextActive : undefined,
                                            ]}
                                        >
                                            Booked {b.RouteNumber}: {b.TokenSerial} ({b.TimeSlot})
                                        </Text>
                                    </Pressable>
                                ))}
                        </View>
                    </View>
                )}

                {/* ── Boarding Station Selection (if not started) ──────── */}
                {!isJourneyActive && (
                    <View style={styles.tripCard}>
                        <Text style={styles.cardHeader}>SELECT BOARDING STATION</Text>
                        <View style={styles.stopPills}>
                            {ROUTE_STOPS.map((s) => (
                                <Pressable
                                    key={s.id}
                                    style={[
                                        styles.stopPill,
                                        selectedStopId === s.id ? styles.stopPillActive : undefined,
                                    ]}
                                    onPress={() => setSelectedStopId(s.id)}
                                >
                                    <Text
                                        style={[
                                            styles.stopPillText,
                                            selectedStopId === s.id ? styles.stopPillTextActive : undefined,
                                        ]}
                                    >
                                        {s.name} ({s.km}km)
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.tripRow}>
                            <Text style={styles.tripLabel}>Passenger Balance</Text>
                            <Text style={[styles.tripValue, currentBalance < 30 ? styles.tripValueWarn : undefined]}>
                                LKR {currentBalance.toFixed(2)}
                            </Text>
                        </View>
                        {currentBalance < 30 && (
                            <Text style={styles.balanceWarningText}>
                                ⚠️ Minimum LKR 30.00 required to board. Please top up your wallet.
                            </Text>
                        )}
                    </View>
                )}

                {/* ── Main Action Button ───────────────────────────────── */}
                <View style={styles.actionWrap}>
                    {journeyLoading ? (
                        <ActivityIndicator size="large" color="#0F6B56" />
                    ) : isJourneyActive ? (
                        <Button
                            label="Tap Out (Alight & Pay Fare)"
                            onPress={handleTapOut}
                            style={styles.tapOutBtn}
                        />
                    ) : (
                        <Button
                            label="Tap In (Scan & Board)"
                            onPress={handleTapIn}
                            style={styles.tapInBtn}
                        />
                    )}
                </View>
            </ScrollView>
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
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.78)',
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    scroll: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    modeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    modeBannerEntry: {
        backgroundColor: '#E6F4EA',
        borderLeftWidth: 4,
        borderLeftColor: '#0A9A5F',
    },
    modeBannerExit: {
        backgroundColor: '#FFF7ED',
        borderLeftWidth: 4,
        borderLeftColor: '#E67E22',
    },
    modeIcon: {
        fontSize: 28,
        marginRight: Spacing.md,
    },
    modeTextWrap: {
        flex: 1,
    },
    modeTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    modeSub: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        marginTop: 2,
    },
    scannerCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    scannerViewport: {
        width: 220,
        height: 220,
        backgroundColor: '#1E293B',
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#10B981',
    },
    cornerTL: {
        top: 14,
        left: 14,
        borderTopWidth: 3,
        borderLeftWidth: 3,
    },
    cornerTR: {
        top: 14,
        right: 14,
        borderTopWidth: 3,
        borderRightWidth: 3,
    },
    cornerBL: {
        bottom: 14,
        left: 14,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
    },
    cornerBR: {
        bottom: 14,
        right: 14,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    scannerCenter: {
        alignItems: 'center',
    },
    qrIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    scannerStatus: {
        color: '#FFFFFF',
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    tokenRef: {
        color: '#94A3B8',
        fontSize: FontSize.xs,
        marginTop: 4,
    },
    laserBar: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: '#34D399',
        top: '50%',
        shadowColor: '#34D399',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },
    scannerHint: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    tripCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        ...Shadow.sm,
    },
    cardHeader: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
    },
    tripRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    tripLabel: {
        fontSize: FontSize.sm,
        color: Colors.gray600,
    },
    tripValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    tripValueGreen: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
    },
    tripValueWarn: {
        color: '#DC2626',
    },
    balanceWarningText: {
        color: '#DC2626',
        fontSize: FontSize.xs,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#EDF2F7',
        marginVertical: Spacing.sm,
    },
    fieldLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#475569',
        marginVertical: Spacing.xs,
    },
    stopPills: {
        gap: Spacing.xs,
        marginTop: 4,
    },
    stopPill: {
        paddingVertical: 9,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    stopPillActive: {
        backgroundColor: '#0F6B56',
        borderColor: '#0F6B56',
    },
    stopPillText: {
        fontSize: FontSize.xs,
        color: '#475569',
        fontWeight: FontWeight.medium,
    },
    stopPillTextActive: {
        color: Colors.white,
        fontWeight: FontWeight.bold,
    },
    actionWrap: {
        marginBottom: Spacing.xl,
    },
    tapInBtn: {
        backgroundColor: '#0A3B32',
    },
    tapOutBtn: {
        backgroundColor: '#E67E22',
    },
});