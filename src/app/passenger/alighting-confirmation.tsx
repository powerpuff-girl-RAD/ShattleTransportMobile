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

export default function AlightingConfirmationScreen() {
    const params = useLocalSearchParams<{
        routeNumber?: string;
        routeName?: string;
        tokenSerial?: string;
        boardingStop?: string;
        alightingStop?: string;
        distanceKm?: string;
        fareAmount?: string;
        newBalance?: string;
        tapOutTime?: string;
        lowBalanceWarning?: string;
    }>();

    const routeNumber = params.routeNumber || '245';
    const routeName   = params.routeName   || 'Negombo → Colombo Fort';
    const tokenSerial = params.tokenSerial || 'TK-88214';
    const boardingStop = params.boardingStop || 'Negombo Bus Stand';
    const alightingStop = params.alightingStop || 'Colombo Fort';
    const distanceKm   = params.distanceKm || '38';
    const fareAmount   = parseFloat(params.fareAmount || '170') || 170;
    const newBalance   = parseFloat(params.newBalance || '10') || 10;
    const isLowBalance = params.lowBalanceWarning === 'true' || newBalance < 100;

    const formattedTime = params.tapOutTime
        ? new Date(params.tapOutTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
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
                    <Text style={styles.headerTitle}>Alighting Confirmation</Text>
                    <Text style={styles.headerSubtitle}>Route {routeNumber} · {routeName}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ── Green Success Hero Badge ─────────────────────────── */}
                <View style={styles.heroSection}>
                    <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                    </View>
                    <Text style={styles.headline}>Tapped out — Journey Completed</Text>
                    <Text style={styles.tokenText}>Token #{tokenSerial}</Text>
                </View>

                {/* ── Journey & Fare Summary Card ───────────────────────── */}
                <View style={styles.card}>
                    {/* Route Header Badge */}
                    <View style={styles.routeHeader}>
                        <View style={styles.routeBadge}>
                            <Text style={styles.routeBadgeText}>{routeNumber}</Text>
                        </View>
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeName}>{routeName}</Text>
                            <Text style={styles.journeyState}>Completed · {formattedTime}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Trip Stops */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Boarding</Text>
                        <Text style={styles.valueGreen}>{boardingStop}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Alighted</Text>
                        <Text style={styles.valueGreen}>{alightingStop}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Distance</Text>
                        <Text style={styles.value}>{distanceKm} km</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Fare Calculation Result */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Fare Deducted</Text>
                        <Text style={styles.fareAmount}>- LKR {fareAmount.toFixed(2)}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>New Balance</Text>
                        <Text style={[styles.balanceValue, isLowBalance ? styles.balanceLow : undefined]}>
                            LKR {newBalance.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={styles.statusClosed}>CLOSED — PAID</Text>
                    </View>
                </View>

                {/* ── Low Balance Alert (if below threshold) ─────────────── */}
                {isLowBalance && (
                    <View style={styles.lowBalanceCard}>
                        <View style={styles.alertIconWrap}>
                            <Text style={styles.alertIcon}>⚠️</Text>
                        </View>
                        <View style={styles.alertTextWrap}>
                            <Text style={styles.alertTitle}>Low Balance Warning</Text>
                            <Text style={styles.alertDesc}>
                                Your balance is below LKR 100.00. Please top up your wallet to ensure uninterrupted transit on your next trip.
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Guidance Text ────────────────────────────────────── */}
                <Text style={styles.helperText}>
                    Thank you for traveling with Shattel Transport!
                </Text>

                {/* ── Action Buttons ───────────────────────────────────── */}
                <View style={styles.actionsContainer}>
                    {isLowBalance && (
                        <Button
                            title="Top Up Wallet Now"
                            onPress={() => router.push('/passenger/topup')}
                            style={styles.topUpBtn}
                        />
                    )}
                    <Button
                        title="Done"
                        onPress={() => router.replace('/passenger')}
                        style={styles.doneBtn}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    checkCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#1FD186',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        ...Shadow.md,
    },
    checkIcon: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: FontWeight.bold,
        lineHeight: 40,
    },
    headline: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
        textAlign: 'center',
        marginBottom: 4,
    },
    tokenText: {
        fontSize: FontSize.sm,
        color: Colors.gray500,
        fontWeight: FontWeight.medium,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    routeBadge: {
        backgroundColor: '#E67E22',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.sm,
        marginRight: Spacing.md,
    },
    routeBadgeText: {
        color: Colors.white,
        fontWeight: FontWeight.bold,
        fontSize: FontSize.md,
    },
    routeInfo: {
        flex: 1,
    },
    routeName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    journeyState: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#EDF2F7',
        marginVertical: Spacing.sm,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 7,
    },
    label: {
        fontSize: FontSize.sm,
        color: Colors.gray500,
    },
    value: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.text,
    },
    valueGreen: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: '#0F6B56',
    },
    fareAmount: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: '#E53935',
    },
    balanceValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
    },
    balanceLow: {
        color: '#E67E22',
    },
    statusClosed: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
    },
    lowBalanceCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF7ED',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: '#FDBA74',
        padding: Spacing.md,
        marginBottom: Spacing.md,
        alignItems: 'flex-start',
    },
    alertIconWrap: {
        marginRight: Spacing.sm,
        marginTop: 2,
    },
    alertIcon: {
        fontSize: 18,
    },
    alertTextWrap: {
        flex: 1,
    },
    alertTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#C2410C',
        marginBottom: 2,
    },
    alertDesc: {
        fontSize: FontSize.xs,
        color: '#9A3412',
        lineHeight: 18,
    },
    helperText: {
        textAlign: 'center',
        color: Colors.gray500,
        fontSize: FontSize.xs,
        marginBottom: Spacing.lg,
    },
    actionsContainer: {
        gap: Spacing.sm,
    },
    topUpBtn: {
        backgroundColor: '#E67E22',
    },
    doneBtn: {
        backgroundColor: '#0A3B32',
    },
});