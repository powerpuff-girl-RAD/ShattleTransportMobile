import React from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

export default function BoardingConfirmationScreen() {
    const params = useLocalSearchParams<{
        routeNumber?: string;
        routeName?: string;
        tokenSerial?: string;
        boardingStop?: string;
        tapInTime?: string;
        balance?: string;
    }>();

    const routeNumber = params.routeNumber || '245';
    const routeName   = params.routeName   || 'Negombo → Colombo Fort';
    const tokenSerial = params.tokenSerial || 'TK-88214';
    const boardingStop = params.boardingStop || 'Negombo Bus Stand';
    const balanceVal  = parseFloat(params.balance || '180') || 180;

    const formattedTime = params.tapInTime
        ? new Date(params.tapInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <View style={styles.container}>
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
                    <Text style={styles.headerTitle}>Boarding Confirmation</Text>
                    <Text style={styles.headerSubtitle}>Route {routeNumber} · {routeName}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ── Green Success Hero Badge ─────────────────────────── */}
                <View style={styles.heroSection}>
                    <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                    </View>
                    <Text style={styles.headline}>Tapped in — boarding Accepted</Text>
                    <Text style={styles.tokenText}>Token #{tokenSerial}</Text>
                </View>

                {/* ── Journey Card ─────────────────────────────────────── */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <View style={styles.routeBadge}>
                            <Text style={styles.routeBadgeText}>{routeNumber}</Text>
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeNameText}>{routeName}</Text>
                            <Text style={styles.journeyStartedText}>Journey started</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tap in</Text>
                        <Text style={styles.tapInValue}>{formattedTime} · {boardingStop}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Balance</Text>
                        <Text style={styles.balanceValue}>
                            LKR {balanceVal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={styles.statusValue}>OPEN — fare on tap out</Text>
                    </View>
                </View>

                {/* ── Notice / Instructions ────────────────────────────── */}
                <Text style={styles.helperText}>Tap out at your destination to pay the fare</Text>

                {/* ── Action Button ────────────────────────────────────── */}
                <Button
                    label="Done"
                    variant="primary"
                    onPress={() => router.replace('/passenger')}
                    style={styles.doneBtn}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surfaceLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gradientTop,
        paddingTop: 56,
        paddingBottom: Spacing.five,
        paddingHorizontal: Spacing.five,
        gap: Spacing.three,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnText: {
        color: Colors.white,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    headerTitleWrap: {
        flex: 1,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.75)',
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    scrollContent: {
        padding: Spacing.five,
        alignItems: 'center',
        gap: Spacing.five,
        paddingBottom: Spacing.twelve,
    },
    heroSection: {
        alignItems: 'center',
        paddingTop: Spacing.four,
        gap: Spacing.two,
    },
    checkCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#27AE60',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.md,
    },
    checkIcon: {
        color: Colors.white,
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.black,
    },
    headline: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
        textAlign: 'center',
        marginTop: Spacing.two,
    },
    tokenText: {
        fontSize: FontSize.sm,
        color: Colors.textDarkSecondary,
    },
    card: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: Radius['2xl'],
        padding: Spacing.six,
        gap: Spacing.four,
        ...Shadow.sm,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    routeBadge: {
        backgroundColor: Colors.orange,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    routeBadgeText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    routeInfo: {
        flex: 1,
    },
    routeNameText: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    journeyStartedText: {
        fontSize: FontSize.xs,
        color: Colors.textDarkSecondary,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.inputLightBorder,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: FontSize.sm,
        color: Colors.inputLightLabel,
    },
    tapInValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: '#27AE60',
    },
    balanceValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    statusValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#27AE60',
    },
    helperText: {
        fontSize: FontSize.sm,
        color: Colors.textDarkSecondary,
        textAlign: 'center',
    },
    doneBtn: {
        width: '100%',
        backgroundColor: '#0D4D3D',
        marginTop: Spacing.two,
    },
});