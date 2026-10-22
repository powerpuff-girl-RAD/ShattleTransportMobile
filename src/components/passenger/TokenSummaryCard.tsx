import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import type { DigitalToken } from '@/api/tokenApi';
import type { BookingItem } from '@/api/bookingApi';

interface Props {
    token: DigitalToken | null;
    booking?: BookingItem | null;
    onPress: () => void;
}

/**
 * Home-screen card showing the active transit token or next scheduled journey booking.
 * Matches the orange→yellow gradient card from the Figma home design.
 */
export function TokenSummaryCard({ token, booking, onPress }: Props) {
    // If a scheduled booking exists for today or next departure, display it on top of home
    if (booking) {
        const isCompleted = booking.Status === 'Completed';
        const isCancelled = booking.Status === 'Cancelled';
        const isInProgress = booking.Status === 'InProgress';
        const isToday = booking.ScheduleDate === new Date().toISOString().split('T')[0];

        return (
            <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="View booking details and QR">
                <LinearGradient
                    colors={['#0F6B56', '#128C6E', '#17B890']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                >
                    {/* ── Top row ─────────────────────────────────── */}
                    <View style={styles.topRow}>
                        <View style={styles.routeBadge}>
                            <Text style={[styles.routeBadgeText, { color: '#0F6B56' }]}>
                                {isToday ? 'TODAY TRIP' : 'NEXT BOOKING'}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, styles.statusActive]}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: isCancelled ? Colors.error : isCompleted ? Colors.gray500 : Colors.success },
                                ]}
                            />
                            <Text style={styles.statusText}>{booking.Status.toUpperCase()}</Text>
                        </View>
                    </View>

                    {/* ── Route info & token serial ───────────────── */}
                    <Text style={styles.tokenSerial}>Route {booking.RouteNumber} · #{booking.TokenSerial}</Text>
                    <Text style={styles.bookingStopsRow}>
                        {booking.BoardingStop.StopName} → {booking.AlightingStop.StopName}
                    </Text>

                    {/* ── Dashed divider ───────────────────────────── */}
                    <View style={styles.divider} />

                    {/* ── Footer info ──────────────────────────────── */}
                    <View style={styles.footer}>
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>DATE</Text>
                            <Text style={styles.footerValue}>{booking.ScheduleDate}</Text>
                        </View>
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>TIME SLOT</Text>
                            <Text style={styles.footerValue}>{booking.TimeSlot}</Text>
                        </View>
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>PASSENGERS</Text>
                            <Text style={styles.footerValue}>
                                {booking.MinorCount && booking.MinorCount > 0
                                    ? `${booking.AdultCount || 1}A + ${booking.MinorCount}M`
                                    : `${booking.PassengerCount || 1} ${booking.PassengerType || 'Adult'}`}
                            </Text>
                        </View>
                        <View style={styles.footerItem}>
                            <Text style={styles.footerLabel}>FARE</Text>
                            <Text style={styles.footerValue}>LKR {booking.FareAmount.toFixed(0)}</Text>
                        </View>
                    </View>

                    {/* ── CTA ──────────────────────────────────────── */}
                    <Text style={styles.cta}>Show Journey QR Code →</Text>
                </LinearGradient>
            </Pressable>
        );
    }

    if (!token) {
        return (
            <Pressable style={styles.emptyCard} onPress={onPress}>
                <Text variant="body" style={styles.emptyText}>
                    No active booking or token.{' '}
                </Text>
                <Text variant="body" style={styles.emptyLink}>
                    Tap to book a journey →
                </Text>
            </Pressable>
        );
    }

    const isActive = token.status === 'Active';

    return (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="View token details">
            <LinearGradient
                colors={['#E07820', '#F5A623', '#F5CE42']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                {/* ── Top row ─────────────────────────────────── */}
                <View style={styles.topRow}>
                    <View style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>TOKEN</Text>
                    </View>
                    <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
                        <View style={[styles.statusDot, { backgroundColor: isActive ? Colors.success : Colors.error }]} />
                        <Text style={styles.statusText}>{token.status.toUpperCase()}</Text>
                    </View>
                </View>

                {/* ── Token serial ─────────────────────────────── */}
                <Text style={styles.tokenSerial}>#{token.serial}</Text>
                <Text style={styles.tokenType}>{token.type} Token</Text>

                {/* ── Dashed divider ───────────────────────────── */}
                <View style={styles.divider} />

                {/* ── Footer info ──────────────────────────────── */}
                <View style={styles.footer}>
                    <View style={styles.footerItem}>
                        <Text style={styles.footerLabel}>TYPE</Text>
                        <Text style={styles.footerValue}>{token.type}</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Text style={styles.footerLabel}>ACTIVATED</Text>
                        <Text style={styles.footerValue}>
                            {new Date(token.activatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Text style={styles.footerLabel}>TOKEN ID</Text>
                        <Text style={styles.footerValue}>#{token.serial}</Text>
                    </View>
                </View>

                {/* ── CTA ──────────────────────────────────────── */}
                <Text style={styles.cta}>View ticket & QR code →</Text>
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius['2xl'],
        padding: Spacing.five,
        gap: Spacing.two,
    },
    emptyCard: {
        borderRadius: Radius['2xl'],
        borderWidth: 1.5,
        borderColor: Colors.orange,
        borderStyle: 'dashed',
        padding: Spacing.six,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surfaceLight,
        gap: Spacing.one,
    },
    emptyText: {
        color: Colors.textDark,
        fontSize: FontSize.base,
    },
    emptyLink: {
        color: Colors.orange,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.base,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.one,
    },
    routeBadge: {
        backgroundColor: Colors.white,
        borderRadius: Radius.sm,
        paddingHorizontal: Spacing.two,
        paddingVertical: 2,
    },
    routeBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.orange,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.sm,
        paddingHorizontal: Spacing.two,
        paddingVertical: 2,
        gap: 4,
    },
    statusActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
    statusInactive: { backgroundColor: 'rgba(0,0,0,0.15)' },
    statusDot: {
        width: 6, height: 6, borderRadius: 3,
    },
    statusText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    tokenSerial: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.black,
        color: Colors.white,
    },
    tokenType: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    bookingStopsRow: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: FontWeight.medium,
        marginTop: 2,
    },
    divider: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.45)',
        borderStyle: 'dashed',
        marginVertical: Spacing.two,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerItem: { gap: 2 },
    footerLabel: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.65)',
        fontWeight: FontWeight.semibold,
    },
    footerValue: {
        fontSize: FontSize.sm,
        color: Colors.white,
        fontWeight: FontWeight.bold,
    },
    cta: {
        marginTop: Spacing.two,
        color: Colors.white,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
        textDecorationLine: 'underline',
    },
});
