import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { InfoRow } from '@/components/inspector/InfoRow';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { ConfirmationModal, Icon, Text, type IconName } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import { useInspector } from '@/store/inspectorStore';

/** Inspector Profile — identity card, lifetime stats, account actions. */
export default function InspectorProfileScreen() {
    const { user, signOut } = useAuth();
    const { profile, shift, todayStats } = useInspector();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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

    const name = profile?.name ?? user?.email ?? 'Inspector';
    const initials = name.split(/[\s.]+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    const total = todayStats.total;
    const validRate = total ? Math.round((todayStats.valid / total) * 100) : 0;

    return (
        <View style={styles.root}>
            <InspectorHeader title={name} subtitle="Ticket Inspector" />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Identity card ─────────────────────────────────────── */}
                <View style={[styles.card, styles.identity]}>
                    <View style={styles.avatarRing}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    </View>
                    <Text style={styles.name}>{name}</Text>
                    {profile ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Badge {profile.badge}</Text>
                        </View>
                    ) : null}
                    <View style={styles.fullWidth}>
                        <InfoRow label="Today's Route" value={shift ? `Route ${shift.routeNumber} · ${shift.routeName}` : 'No shift today'} />
                    </View>
                </View>

                {/* ── Lifetime stats ────────────────────────────────────── */}
                <View style={[styles.card, styles.statsRow]}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{total.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Today's Inspections</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: Colors.primary }]}>{validRate}%</Text>
                        <Text style={styles.statLabel}>Today's Valid Rate</Text>
                    </View>
                </View>

                {/* ── Actions ───────────────────────────────────────────── */}
                <MenuItem icon="chart" label="My Statistics" onPress={() => router.push('/inspector/stats')} />
                <MenuItem icon="warning" label="Violation Records" onPress={() => router.push('/inspector/violations')} />
                <MenuItem icon="calendar" label="View Shift Schedule" onPress={() => router.push('/inspector/schedule')} />
                <MenuItem icon="lock" label="Change Password" onPress={() => router.push('/inspector/change-password')} />
                <MenuItem icon="logout" label="Log Out" destructive onPress={() => setShowLogoutModal(true)} />
            </ScrollView>

            <ConfirmationModal
                visible={showLogoutModal}
                title="Log Out"
                message="Are you sure you want to log out of the inspector app?"
                confirmLabel="Yes"
                cancelLabel="No"
                isLoading={isLoggingOut}
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
        </View>
    );
}

function MenuItem({ icon, label, onPress, destructive = false }: {
    icon: IconName;
    label: string;
    onPress: () => void;
    destructive?: boolean;
}) {
    const color = destructive ? Colors.error : Colors.textDark;
    return (
        <Pressable
            style={({ pressed }) => [styles.card, styles.menuItem, pressed && styles.pressed]}
            onPress={onPress}
            accessibilityRole="button"
        >
            <Icon name={icon} color={color} size={20} />
            <Text style={[styles.menuLabel, { color }]}>{label}</Text>
            <Icon name="chevronRight" color={Colors.inputLightPlaceholder} size={18} />
        </Pressable>
    );
}

const AVATAR = 84;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    scroll: { padding: Spacing.five, gap: Spacing.four, paddingBottom: Spacing.twelve },
    card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.four, ...Shadow.sm },

    identity: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.six },
    avatarRing: {
        width: AVATAR + 8, height: AVATAR + 8, borderRadius: (AVATAR + 8) / 2,
        borderWidth: 3, borderColor: Colors.orange,
        alignItems: 'center', justifyContent: 'center',
    },
    avatar: {
        width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2,
        backgroundColor: Colors.gradientMid, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: Colors.white, fontSize: FontSize['2xl'], lineHeight: FontSize['2xl'] * 1.3, fontWeight: FontWeight.bold },
    name: { fontSize: FontSize.lg, lineHeight: FontSize.lg * 1.3, fontWeight: FontWeight.bold, color: Colors.textDark },
    badge: {
        backgroundColor: Colors.gradientTop, borderRadius: Radius.full,
        paddingHorizontal: Spacing.three, paddingVertical: 3,
    },
    badgeText: {
        color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.bold,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    fullWidth: { alignSelf: 'stretch', marginTop: Spacing.two },

    statsRow: { flexDirection: 'row', alignItems: 'center' },
    stat: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { fontSize: FontSize.lg, lineHeight: FontSize.lg * 1.3, fontWeight: FontWeight.bold, color: Colors.textDark },
    statLabel: {
        fontSize: FontSize.xs - 1, color: Colors.textDarkSecondary,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: Colors.divider },

    menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
    menuLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
    pressed: { opacity: 0.7 },
});
