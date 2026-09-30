import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { TokenSummaryCard } from '@/components/passenger/TokenSummaryCard';
import { QuickActionTile } from '@/components/passenger/QuickActionTile';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import { usePassenger } from '@/store/passengerStore';
import { router } from 'expo-router';

export default function PassengerHome() {
    const { user, signOut } = useAuth();
    const { profile, token, isLoading, loadProfile, loadToken } = usePassenger();

    useEffect(() => { loadProfile(); loadToken(); }, []);

    const goToTickets = useCallback(() => router.replace('/passenger/tickets'), []);
    const goToBuy = useCallback(() => router.replace('/passenger/buy'), []);

    const handleSignOut = useCallback(() => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
            ]
        );
    }, [signOut]);

    const displayName = profile?.fullName || user?.email || 'Passenger';
    const balance = profile?.account.balance ?? null;

    return (
        <View style={styles.root}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={styles.topBar}>
                {/* Left: avatar + name */}
                <View style={styles.headerLeft}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarInitial}>{(displayName[0] ?? 'P').toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.nameText}>{displayName}</Text>
                    </View>
                </View>

                {/* Right: balance pill + notification + sign-out */}
                <View style={styles.headerRight}>
                    {balance !== null && (
                        <View style={styles.balancePill}>
                            <Text style={styles.balanceText}>LKR {balance.toFixed(2)}</Text>
                        </View>
                    )}

                    {/* Notification icon */}
                    <Pressable
                        style={styles.iconBtn}
                        onPress={() => { /* Notifications screen — coming in next sprint */ }}
                        accessibilityRole="button"
                        accessibilityLabel="Notifications"
                    >
                        <Text style={styles.iconBtnText}>🔔</Text>
                    </Pressable>

                    {/* Sign-out icon */}
                    <Pressable
                        style={styles.iconBtn}
                        onPress={handleSignOut}
                        accessibilityRole="button"
                        accessibilityLabel="Sign out"
                    >
                        <Text style={styles.iconBtnText}>⎋</Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Active token card ────────────────────────────────── */}
                {isLoading
                    ? <ActivityIndicator color={Colors.orange} style={{ marginVertical: Spacing.six }} />
                    : <TokenSummaryCard token={token} onPress={goToTickets} />
                }

                {/* ── Quick actions ────────────────────────────────────── */}
                <Text style={styles.sectionTitle}>Quick actions</Text>
                <View style={styles.quickRow}>
                    <QuickActionTile icon={<Text style={styles.quickIcon}>＋</Text>} label="Buy a token" onPress={goToBuy} />
                    <QuickActionTile icon={<Text style={styles.quickIcon}>🎫</Text>} label="My tickets" onPress={goToTickets} />
                    <QuickActionTile icon={<Text style={styles.quickIcon}>QR</Text>} label="Show QR" onPress={goToTickets} />
                </View>

                {/* ── Recent journeys ──────────────────────────────────── */}
                <View style={styles.journeysHeader}>
                    <Text style={styles.sectionTitle}>Recent Journeys</Text>
                    <View style={styles.addBtn}>
                        <Text style={styles.addBtnText}>＋</Text>
                    </View>
                </View>
                <View style={styles.emptyJourneys}>
                    <Text style={styles.emptyText}>
                        No journeys yet. Board a bus using your QR token to record your first trip.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    topBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: Colors.gradientTop,
        paddingTop: 56, paddingBottom: Spacing.five, paddingHorizontal: Spacing.five,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center',
    },
    avatarInitial: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
    welcomeText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
    nameText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
    balancePill: {
        backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radius.full,
        paddingHorizontal: Spacing.three, paddingVertical: Spacing.one,
    },
    balanceText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
    iconBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    iconBtnText: { fontSize: 16 },
    scroll: { padding: Spacing.five, gap: Spacing.five, paddingBottom: Spacing.twelve },
    sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textDark },
    quickRow: { flexDirection: 'row', gap: Spacing.three },
    quickIcon: { fontSize: FontSize.lg, color: Colors.orange },
    journeysHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
    emptyJourneys: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.five, alignItems: 'center', ...Shadow.sm },
    emptyText: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center' },
});