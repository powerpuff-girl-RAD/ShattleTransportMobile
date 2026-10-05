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
        tokenLoading,
        error,
        loadToken,
        refreshQR,
        clearError,
    } = usePassenger();

    const countdown = useQRCountdown(qr?.expiresIn ?? null);

    /** Load token on mount, then immediately generate QR if active. */
    useEffect(() => {
        (async () => {
            await loadToken();
        })();
    }, []);

    useEffect(() => {
        if (token?.status === 'Active' && !qr) {
            refreshQR();
        }
    }, [token]);

    const handleRefresh = useCallback(() => {
        clearError();
        refreshQR();
    }, []);

    const displayName = profile?.fullName || user?.email || 'Passenger';
    const balance = profile?.account.balance ?? 0;

    // ── No token state ────────────────────────────────────────────────────
    if (!tokenLoading && !token) {
        return (
            <View style={styles.root}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Your Digital Token</Text>
                </View>
                <View style={styles.noTokenContainer}>
                    <Text style={styles.noTokenEmoji}>🎫</Text>
                    <Text style={styles.noTokenTitle}>No Active Token</Text>
                    <Text style={styles.noTokenSubtitle}>
                        Go to the Buy tab to activate your digital token.
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
                {/* ── QR card ─────────────────────────────────────────── */}
                <View style={styles.qrCard}>
                    {/* Active badge */}
                    <View style={styles.cardTopRow}>
                        <View style={[styles.statusBadge, token?.status === 'Active' && styles.statusBadgeActive]}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>{token?.status?.toUpperCase() ?? 'LOADING'}</Text>
                        </View>
                        <Text style={styles.refreshHint}>
                            {qr ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` : '--:--'}
                        </Text>
                    </View>

                    {/* QR code */}
                    <View style={styles.qrWrapper}>
                        {tokenLoading || !qr ? (
                            <ActivityIndicator size="large" color={Colors.primaryDark} />
                        ) : (
                            <QRCode
                                value={qr.qrPayload}
                                size={200}
                                color={Colors.black}
                                backgroundColor={Colors.white}
                            />
                        )}
                    </View>

                    <Text style={styles.tokenSerial}>Token #{token?.serial}</Text>
                    <Text style={styles.tokenHint}>Tap in and tap out with this QR</Text>

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

