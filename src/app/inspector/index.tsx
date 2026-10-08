import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import { InfoRow } from '@/components/inspector/InfoRow';
import { InspectionRow } from '@/components/inspector/InspectionRow';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { StatCard } from '@/components/inspector/StatCard';
import { StatusPill } from '@/components/inspector/StatusPill';
import { ConfirmationModal, Icon, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { useInspector } from '@/store/inspectorStore';

/**
 * Inspector Dashboard — today's stats, current shift, the big SCAN button
 * and the three most recent inspections.
 */
export default function InspectorDashboard() {
    const { profile, shift, recentInspections, todayStats, isLoading, error, loadDashboard, toggleShift } = useInspector();
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [isTogglingShift, setIsTogglingShift] = useState(false);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const handleConfirmShift = useCallback(async () => {
        setIsTogglingShift(true);
        try {
            await toggleShift();
            setShowShiftModal(false);
        } catch (err) {
            console.error('Shift update error:', err);
        } finally {
            setIsTogglingShift(false);
        }
    }, [toggleShift]);

    const goToScan = useCallback(() => router.push('/inspector/scan'), []);
    const goToHistory = useCallback(() => router.push('/inspector/history'), []);

    const onDuty = shift?.onDuty ?? false;
    const recent = recentInspections.slice(0, 3);

    return (
        <View style={styles.root}>
            <InspectorHeader
                title={`Inspector ${profile?.name ?? ''}`}
                subtitle={profile ? `Badge #${profile.badge}` : undefined}
                action={{ icon: 'bell', label: 'Notifications', onPress: () => { /* Notifications — later step */ } }}
            />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isLoading && !!shift} onRefresh={loadDashboard} tintColor={Colors.orange} />
                }
            >
                {error ? <Text style={styles.error}>{error}</Text> : null}

                {/* ── Today's stats ─────────────────────────────────────── */}
                <View style={styles.statsRow}>
                    <StatCard value={todayStats.total} label="Inspections" />
                    <StatCard value={todayStats.valid} label="Valid" valueColor={Colors.primary} />
                    <StatCard value={todayStats.violations} label="Violations" valueColor={Colors.error} />
                </View>

                {/* ── Current shift ─────────────────────────────────────── */}
                {isLoading && !shift ? (
                    <ActivityIndicator color={Colors.orange} style={{ marginVertical: Spacing.six }} />
                ) : shift ? (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Current Shift</Text>
                            <StatusPill label={onDuty ? 'On Duty' : 'Off Duty'} tone={onDuty ? 'success' : 'neutral'} />
                        </View>
                        <InfoRow label="Route Assignment" value={`Route ${shift.routeNumber}`} />
                        <InfoRow label="Vehicle Number" value={`Bus ${shift.vehicleNumber}`} />
                        <InfoRow label="Shift Hours">
                            <View style={styles.shiftHours}>
                                <Text style={styles.shiftHoursText}>{shift.startTime} - {shift.endTime}</Text>
                                {onDuty ? <StatusPill label="Active" /> : null}
                            </View>
                        </InfoRow>

                        <Pressable
                            style={({ pressed }) => [
                                styles.shiftButton,
                                { backgroundColor: onDuty ? Colors.error : Colors.primaryDark },
                                pressed && styles.pressed,
                            ]}
                            onPress={() => setShowShiftModal(true)}
                            accessibilityRole="button"
                        >
                            <Text style={styles.shiftButtonText}>{onDuty ? 'End Shift' : 'Start Shift'}</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Current Shift</Text>
                        <Text style={styles.emptyText}>No shift is scheduled for you today.</Text>
                    </View>
                )}


                {/* ── Scan button ───────────────────────────────────────── */}
                <View style={styles.scanWrap}>
                    <Pressable
                        style={({ pressed }) => [styles.scanButton, pressed && styles.scanPressed, !onDuty && styles.disabled]}
                        onPress={goToScan}
                        disabled={!onDuty}
                        accessibilityRole="button"
                        accessibilityLabel="Scan passenger token"
                    >
                        <Icon name="scan" color={Colors.white} size={36} />
                        <Text style={styles.scanText}>Scan</Text>
                    </Pressable>
                    {!onDuty && shift ? (
                        <Text style={styles.scanHint}>Start your shift to scan tokens</Text>
                    ) : null}
                </View>

                {/* ── Recent inspections ────────────────────────────────── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Inspections</Text>
                    {recentInspections.length > 3 ? (
                        <Pressable onPress={goToHistory} accessibilityRole="button">
                            <Text style={styles.seeAll}>See all</Text>
                        </Pressable>
                    ) : null}
                </View>

                {recent.length === 0 && !isLoading ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No inspections yet. Tap Scan to check a passenger's token.</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {recent.map((inspection) => (
                            // Inspection detail screen is added in step 5
                            <InspectionRow key={inspection.id} inspection={inspection} />
                        ))}
                    </View>
                )}
            </ScrollView>

            <ConfirmationModal
                visible={showShiftModal}
                title={onDuty ? 'End Shift' : 'Start Shift'}
                message={
                    onDuty
                        ? 'End your shift now? You will not be able to scan tokens until you start a new shift.'
                        : `Start your shift on Route ${shift?.routeNumber ?? ''}?`
                }
                confirmLabel={onDuty ? 'End Shift' : 'Start'}
                cancelLabel="Cancel"
                isDestructive={onDuty}
                isLoading={isTogglingShift}
                onConfirm={handleConfirmShift}
                onCancel={() => setShowShiftModal(false)}
            />
        </View>
    );
}

const SCAN_SIZE = 120;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    scroll: { padding: Spacing.five, gap: Spacing.five, paddingBottom: Spacing.twelve },
    error: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: Spacing.three },

    card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.four, ...Shadow.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
    cardTitle: {
        fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textDark,
        textTransform: 'uppercase',
    },
    shiftHours: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
    shiftHoursText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textDark },
    shiftButton: {
        marginTop: Spacing.three, height: 46, borderRadius: Radius.md,
        alignItems: 'center', justifyContent: 'center',
    },
    shiftButtonText: {
        color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    pressed: { opacity: 0.8 },

    scanWrap: { alignItems: 'center', gap: Spacing.two },
    scanButton: {
        width: SCAN_SIZE, height: SCAN_SIZE, borderRadius: SCAN_SIZE / 2,
        backgroundColor: Colors.orange,
        alignItems: 'center', justifyContent: 'center', gap: Spacing.one,
        ...Shadow.md,
    },
    scanPressed: { backgroundColor: Colors.orangePressed, transform: [{ scale: 0.97 }] },
    disabled: { opacity: 0.45 },
    scanText: {
        color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold,
        textTransform: 'uppercase', letterSpacing: 1,
    },
    scanHint: { fontSize: FontSize.xs, color: Colors.textDarkSecondary },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textDark },
    seeAll: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.orange },
    list: { gap: Spacing.three },
    empty: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.five, ...Shadow.sm },
    emptyText: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center' },
});
