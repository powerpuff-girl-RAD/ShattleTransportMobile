import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { ConfirmationModal, Text } from '@/components/ui';
import { TokenSummaryCard } from '@/components/passenger/TokenSummaryCard';
import { QuickActionTile } from '@/components/passenger/QuickActionTile';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import { usePassenger } from '@/store/passengerStore';
import { router } from 'expo-router';

export default function PassengerHome() {
    const { user, signOut } = useAuth();
    const {
        profile,
        token,
        activeJourney,
        notifications,
        bookings,
        isLoading,
        loadProfile,
        loadToken,
        loadActiveJourney,
        loadNotifications,
        loadBookings,
    } = usePassenger();

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        loadProfile();
        loadToken();
        loadActiveJourney();
        loadNotifications();
        loadBookings();
    }, [loadProfile, loadToken, loadActiveJourney, loadNotifications, loadBookings]);

    const goToTickets = useCallback(() => router.push('/passenger/tickets'), []);
    const goToBuy = useCallback(() => router.push('/passenger/buy'), []);
    const goToTopUp = useCallback(() => router.push('/passenger/topup'), []);
    const goToScanner = useCallback(() => router.push('/passenger/gate-scanner'), []);
    const goToBooking = useCallback(() => router.push('/passenger/booking'), []);

    const handleConfirmLogout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            setShowLogoutModal(false);
            router.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
        }
    }, [signOut]);

    const handleNotificationsPress = () => {
        if (!notifications || notifications.length === 0) {
            Alert.alert('Notifications', 'You have no new transit notifications at this time.');
            return;
        }

        const latest = notifications.slice(0, 3).map((n) => `• ${n.title}: ${n.message}`).join('\n\n');
        Alert.alert('Recent Notifications', latest, [{ text: 'Close' }]);
    };

    const displayName = profile?.fullName || user?.email || 'Passenger';
    const balance = profile?.account?.balance ?? null;
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Determine next scheduled booking (today or earliest future travel date)
    const todayIso = new Date().toISOString().split('T')[0];
    const activeBookings = (bookings || []).filter(
        (b) => b.Status === 'Booked' || b.Status === 'InProgress'
    );

    // Sort by ScheduleDate asc, then TimeSlot asc
    const sortedBookings = [...activeBookings].sort((a, b) => {
        if (a.ScheduleDate !== b.ScheduleDate) {
            return a.ScheduleDate.localeCompare(b.ScheduleDate);
        }
        return a.TimeSlot.localeCompare(b.TimeSlot);
    });

    // Prioritize today's booking or next upcoming booking
    const nextBooking =
        sortedBookings.find((b) => b.ScheduleDate >= todayIso) ||
        sortedBookings[0] ||
        (bookings && bookings.length > 0 ? bookings[0] : null);

    return (
        <View style={styles.root}>
            {/* ── Top Header ──────────────────────────────────────────── */}
            <View style={styles.topBar}>
                {/* Left: Avatar + Name */}
                <View style={styles.headerLeft}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarInitial}>{(displayName[0] ?? 'P').toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.nameText}>{displayName}</Text>
                    </View>
                </View>

                {/* Right: Balance Pill + Notifications + Sign-out */}
                <View style={styles.headerRight}>
                    {balance !== null && (
                        <Pressable style={styles.balancePill} onPress={goToTopUp}>
                            <Text style={styles.balanceText}>
                                LKR {balance.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </Text>
                        </Pressable>
                    )}

                    {/* Notification Icon */}
                    <Pressable
                        style={styles.iconBtn}
                        onPress={handleNotificationsPress}
                        accessibilityRole="button"
                        accessibilityLabel="Notifications"
                    >
                        <Text style={styles.iconBtnText}>🔔</Text>
                        {unreadCount > 0 && (
                            <View style={styles.badgeWrap}>
                                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </Pressable>

                    {/* Sign-out Icon */}
                    <Pressable
                        style={styles.iconBtn}
                        onPress={() => setShowLogoutModal(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Sign out"
                    >
                        <Text style={styles.iconBtnText}>⎋</Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Active Journey In Progress Banner ──────────────────── */}
                {activeJourney && (
                    <View style={styles.activeJourneyCard}>
                        <View style={styles.activeJourneyHeader}>
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>IN PROGRESS</Text>
                            </View>
                            <Text style={styles.activeTime}>
                                Boarded {activeJourney.createdAt ? new Date(activeJourney.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                            </Text>
                        </View>

                        <Text style={styles.activeRouteTitle}>
                            Route {(activeJourney as any)?.routeNumber || (activeJourney as any)?.RouteNumber || 'Bus'} · {(activeJourney as any)?.routeName || (activeJourney as any)?.RouteName || 'Transit'}
                        </Text>
                        <Text style={styles.activeStopText}>
                            Boarded at: {(activeJourney as any)?.boardingStop?.stopName || (activeJourney as any)?.boardingStop?.StopName || (activeJourney as any)?.BoardingStop?.StopName || (activeJourney as any)?.BoardingStop?.stopName || 'Transit Gate'}
                        </Text>

                        <Pressable style={styles.alightBtn} onPress={goToScanner}>
                            <Text style={styles.alightBtnText}>Tap Out / Alight Bus →</Text>
                        </Pressable>
                    </View>
                )}

                {/* ── Active Token / Booking Ticket Card ────────────────── */}
                {isLoading ? (
                    <ActivityIndicator color={Colors.orange} style={{ marginVertical: Spacing.six }} />
                ) : (
                    <TokenSummaryCard
                        token={token}
                        booking={nextBooking}
                        onPress={() => {
                            if (nextBooking) {
                                router.push({
                                    pathname: '/passenger/booking-details',
                                    params: { id: nextBooking.Id.toString() },
                                });
                            } else {
                                goToTickets();
                            }
                        }}
                    />
                )}

                {/* ── Quick Actions ────────────────────────────────────── */}
                <Text style={styles.sectionTitle}>Quick actions</Text>
                <View style={styles.quickRow}>
                    <QuickActionTile
                        icon={<Text style={styles.quickIcon}>🎫</Text>}
                        label="Book Bus"
                        onPress={goToBooking}
                    />
                    <QuickActionTile
                        icon={<Text style={styles.quickIcon}>💳</Text>}
                        label="Top-up"
                        onPress={goToTopUp}
                    />
                    <QuickActionTile
                        icon={<Text style={styles.quickIcon}>QR</Text>}
                        label="Show QR"
                        onPress={goToTickets}
                    />
                    <QuickActionTile
                        icon={<Text style={styles.quickIcon}>🎟️</Text>}
                        label="Passes"
                        onPress={goToBuy}
                    />
                </View>

                {/* ── Recent Journeys & Bookings Section ────────────────── */}
                <View style={styles.journeysHeader}>
                    <Text style={styles.sectionTitle}>Recent Journeys & Bookings</Text>
                    <Pressable
                        style={styles.addBtn}
                        onPress={goToBooking}
                        accessibilityLabel="Book a new journey"
                    >
                        <Text style={styles.addBtnText}>＋</Text>
                    </Pressable>
                </View>

                {/* Display Bookings if any exist */}
                {bookings && bookings.length > 0 ? (
                    <View style={styles.bookingsContainer}>
                        {bookings.slice(0, 5).map((b) => {
                            const isCompleted = b.Status === 'Completed';
                            const isCancelled = b.Status === 'Cancelled';
                            const isInProgress = b.Status === 'InProgress';
                            const statusColor = isCompleted
                                ? '#10B981'
                                : isInProgress
                                ? '#2563EB'
                                : isCancelled
                                ? '#EF4444'
                                : '#E67E22';

                            return (
                                <Pressable
                                    key={b.Id}
                                    style={styles.bookingCard}
                                    onPress={() => router.push({
                                        pathname: '/passenger/booking-details',
                                        params: { id: b.Id.toString() },
                                    })}
                                >
                                    <View style={styles.bookingTop}>
                                        <View style={styles.routeBadgeSmall}>
                                            <Text style={styles.routeBadgeSmallText}>{b.RouteNumber}</Text>
                                        </View>
                                        <View style={styles.bookingMainWrap}>
                                            <Text style={styles.bookingRouteName}>{b.RouteName}</Text>
                                            <Text style={styles.bookingStopsText}>
                                                {b.BoardingStop.StopName} → {b.AlightingStop.StopName}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadgeSmall, { backgroundColor: statusColor }]}>
                                            <Text style={styles.statusBadgeSmallText}>{b.Status}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.bookingBottom}>
                                        <Text style={styles.bookingDateTime}>
                                            📅 {b.ScheduleDate} · ⏰ {b.TimeSlot}{b.MinorCount && b.MinorCount > 0 ? ` · 👥 ${b.AdultCount || 1}A+${b.MinorCount}M` : (b.PassengerCount && b.PassengerCount > 1 ? ` · 👥 ${b.PassengerCount}` : '')}
                                        </Text>
                                        <Text style={styles.bookingFare}>LKR {b.FareAmount.toFixed(2)}</Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                ) : activeJourney ? (
                    <View style={styles.journeyItemCard}>
                        <View style={styles.journeyItemTop}>
                            <Text style={styles.journeyItemRoute}>Route {(activeJourney as any)?.routeNumber || (activeJourney as any)?.RouteNumber || 'Bus'}</Text>
                            <Text style={styles.journeyItemBadgeLive}>Live Trip</Text>
                        </View>
                        <Text style={styles.journeyItemDesc}>
                            {((activeJourney as any)?.boardingStop?.stopName || (activeJourney as any)?.boardingStop?.StopName || (activeJourney as any)?.BoardingStop?.StopName || (activeJourney as any)?.BoardingStop?.stopName || 'Transit Origin')} → En Route
                        </Text>
                    </View>
                ) : (
                    <View style={styles.emptyJourneys}>
                        <Text style={styles.emptyText}>
                            No booked journeys yet. Click '＋' to book your scheduled bus journey.
                        </Text>
                        <Pressable style={styles.bookNowBtn} onPress={goToBooking}>
                            <Text style={styles.bookNowBtnText}>Book a Journey Now →</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>

            {/* ── Logout Confirmation Popup ─────────────────────────── */}
            <ConfirmationModal
                visible={showLogoutModal}
                title="Sign Out"
                message="Are you sure you want to sign out of your account?"
                confirmLabel="Yes"
                cancelLabel="No"
                isDestructive={true}
                isLoading={isLoggingOut}
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0F6B56',
        paddingTop: 56,
        paddingBottom: Spacing.five,
        paddingHorizontal: Spacing.five,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.orange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
    welcomeText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
    nameText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
    balancePill: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.one,
    },
    balanceText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    iconBtnText: { fontSize: 16 },
    badgeWrap: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    scroll: { padding: Spacing.five, gap: Spacing.five, paddingBottom: Spacing.twelve },
    activeJourneyCard: {
        backgroundColor: '#0A3B32',
        borderRadius: Radius.lg,
        padding: Spacing.md,
        ...Shadow.md,
    },
    activeJourneyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    activeBadge: {
        backgroundColor: '#1FD186',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    activeBadgeText: {
        color: '#0A3B32',
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    activeTime: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: FontSize.xs,
    },
    activeRouteTitle: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        marginBottom: 2,
    },
    activeStopText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: FontSize.xs,
        marginBottom: Spacing.sm,
    },
    alightBtn: {
        backgroundColor: '#E67E22',
        borderRadius: Radius.md,
        paddingVertical: 8,
        alignItems: 'center',
    },
    alightBtnText: {
        color: Colors.white,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textDark },
    quickRow: { flexDirection: 'row', gap: Spacing.two },
    quickIcon: { fontSize: FontSize.lg, color: Colors.orange },
    journeysHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.orange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
    bookingsContainer: {
        gap: Spacing.sm,
    },
    bookingCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Shadow.sm,
    },
    bookingTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    routeBadgeSmall: {
        backgroundColor: '#E67E22',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.sm,
        marginRight: Spacing.sm,
    },
    routeBadgeSmallText: {
        color: Colors.white,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    bookingMainWrap: {
        flex: 1,
    },
    bookingRouteName: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    bookingStopsText: {
        fontSize: 10,
        color: Colors.gray500,
        marginTop: 1,
    },
    statusBadgeSmall: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    statusBadgeSmallText: {
        color: Colors.white,
        fontSize: 9,
        fontWeight: FontWeight.bold,
    },
    bookingBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    bookingDateTime: {
        fontSize: 10,
        color: '#64748B',
    },
    bookingFare: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#0A9A5F',
    },
    journeyItemCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        ...Shadow.sm,
    },
    journeyItemTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    journeyItemRoute: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    journeyItemBadgeLive: {
        color: '#0A9A5F',
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    journeyItemDesc: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
    },
    emptyJourneys: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.five,
        alignItems: 'center',
        ...Shadow.sm,
    },
    emptyText: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center', marginBottom: Spacing.sm },
    bookNowBtn: {
        backgroundColor: '#0F6B56',
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: Radius.md,
    },
    bookNowBtnText: {
        color: Colors.white,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
});