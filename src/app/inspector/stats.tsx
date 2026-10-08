import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { getStats } from '@/api/inspectorApi';
import type { InspectorStats, StatsPeriod } from '@/api/inspectorApi';
import { Card } from '@/components/inspector/Card';
import { ChipGroup, type ChipOption } from '@/components/inspector/ChipGroup';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { StatCard } from '@/components/inspector/StatCard';
import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { messageFrom } from '@/store/inspectorStore';
import { dayLabel } from '@/utils/formatTime';

const PERIODS: ChipOption<StatsPeriod>[] = [
    { label: 'Today', value: 1 },
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
];

const CHART_HEIGHT = 120;

/**
 * My Statistics — totals, valid rate, a day-by-day chart, violations by type
 * and by route. All numbers are worked out by one MongoDB aggregation.
 */
export default function StatsScreen() {
    const [days, setDays] = useState<StatsPeriod>(7);
    const [stats, setStats] = useState<InspectorStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            setStats(await getStats(days));
        } catch (err) {
            setError(messageFrom(err, 'Could not load statistics'));
        } finally {
            setIsLoading(false);
        }
    }, [days]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/inspector'));
    const current = stats && stats.days === days ? stats : null;

    return (
        <View style={styles.root}>
            <InspectorHeader title="My Statistics" subtitle="Inspections and violations" onBack={goBack} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isLoading && !!current} onRefresh={load} tintColor={Colors.orange} />}
            >
                <ChipGroup options={PERIODS} selected={days} onChange={setDays} scroll />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {!current ? (
                    isLoading ? <ActivityIndicator color={Colors.orange} style={styles.loader} /> : null
                ) : (
                    <>
                        <View style={styles.statsRow}>
                            <StatCard value={current.totals.total} label="Inspections" />
                            <StatCard value={current.totals.valid} label="Valid" valueColor={Colors.primary} />
                            <StatCard value={current.totals.invalid} label="Invalid" valueColor={Colors.error} />
                        </View>

                        <Card title="Valid Rate">
                            <View style={styles.rateRow}>
                                <Text style={styles.rateValue}>{current.totals.validRate}%</Text>
                                <Text style={styles.rateHint}>of tokens checked were valid</Text>
                            </View>
                            <Bar fraction={current.totals.validRate / 100} color={Colors.primary} />
                        </Card>

                        {current.byDay.length > 1 ? (
                            <Card title="Day by Day">
                                <DayChart days={current.byDay} />
                                <View style={styles.legend}>
                                    <LegendDot color={Colors.primary} label="Valid" />
                                    <LegendDot color={Colors.error} label="Invalid" />
                                </View>
                            </Card>
                        ) : null}

                        <Card title="Violations by Type">
                            {current.byReason.length === 0 ? (
                                <Text style={styles.muted}>No invalid tickets in this period.</Text>
                            ) : (
                                current.byReason.map((r) => (
                                    <View key={r.reason} style={styles.barRow}>
                                        <View style={styles.barLabelRow}>
                                            <Text style={styles.barLabel}>{r.reason}</Text>
                                            <Text style={styles.barCount}>{r.count}</Text>
                                        </View>
                                        <Bar fraction={r.count / current.totals.invalid} color={Colors.error} />
                                    </View>
                                ))
                            )}
                        </Card>

                        <Card title="By Route">
                            {current.byRoute.length === 0 ? (
                                <Text style={styles.muted}>No inspections in this period.</Text>
                            ) : (
                                current.byRoute.map((r) => (
                                    <View key={r.routeNumber ?? 'none'} style={styles.routeRow}>
                                        <View style={styles.flex}>
                                            <Text style={styles.barLabel}>Route {r.routeNumber}</Text>
                                            <Text style={styles.muted} numberOfLines={1}>{r.routeName}</Text>
                                        </View>
                                        <Text style={styles.barCount}>{r.total} checked</Text>
                                        <Text style={[styles.barCount, styles.invalidCount]}>{r.invalid} invalid</Text>
                                    </View>
                                ))
                            )}
                        </Card>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

/** Horizontal progress bar, fraction 0..1. */
function Bar({ fraction, color }: { fraction: number; color: string }) {
    return (
        <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(Math.min(1, fraction) * 100)}%`, backgroundColor: color }]} />
        </View>
    );
}

/** Stacked column per day: green = valid, red = invalid. Plain Views, no chart library. */
function DayChart({ days }: { days: InspectorStats['byDay'] }) {
    const max = Math.max(1, ...days.map((d) => d.total));
    const showLabels = days.length <= 7;

    return (
        <View style={styles.chart}>
            {days.map((d) => (
                <View key={d.date} style={styles.chartCol}>
                    <View style={[styles.chartBar, { height: (d.total / max) * CHART_HEIGHT }]}>
                        <View style={{ flex: d.total - d.invalid, backgroundColor: Colors.primary }} />
                        <View style={{ flex: d.invalid, backgroundColor: Colors.error }} />
                    </View>
                    {showLabels ? <Text style={styles.chartLabel} numberOfLines={1}>{dayLabel(d.date).replace('Yesterday', 'Yest.')}</Text> : null}
                </View>
            ))}
        </View>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.muted}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    scroll: { padding: Spacing.five, gap: Spacing.four, paddingBottom: Spacing.twelve },
    flex: { flex: 1 },
    loader: { marginTop: Spacing.ten },
    error: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },
    muted: { color: Colors.textDarkSecondary, fontSize: FontSize.xs },
    statsRow: { flexDirection: 'row', gap: Spacing.three },

    rateRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two, marginBottom: Spacing.two },
    rateValue: { color: Colors.primaryDark, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
    rateHint: { color: Colors.textDarkSecondary, fontSize: FontSize.sm },

    barRow: { gap: Spacing.one, paddingVertical: Spacing.one },
    barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
    barLabel: { color: Colors.textDark, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
    barCount: { color: Colors.textDark, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    invalidCount: { color: Colors.error, minWidth: 70, textAlign: 'right' },
    barTrack: { height: 8, borderRadius: Radius.full, backgroundColor: Colors.divider, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: Radius.full },

    routeRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two,
        borderBottomWidth: 1, borderBottomColor: Colors.divider,
    },

    chart: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT + 20, gap: 3 },
    chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
    chartBar: { width: '70%', minHeight: 2, borderRadius: 3, overflow: 'hidden', backgroundColor: Colors.divider },
    chartLabel: { color: Colors.textDarkSecondary, fontSize: 10 },
    legend: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.three },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
});
