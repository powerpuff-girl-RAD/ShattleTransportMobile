import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { getInspections } from '@/api/inspectorApi';
import type { InspectionList, InspectionQuery, InspectionResult } from '@/api/inspectorApi';
import { ChipGroup, type ChipOption } from '@/components/inspector/ChipGroup';
import { InspectionRow } from '@/components/inspector/InspectionRow';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { messageFrom } from '@/store/inspectorStore';
import { dayLabel, toDateKey } from '@/utils/formatTime';

const RESULTS: ChipOption<InspectionResult | null>[] = [
    { label: 'All', value: null },
    { label: 'Valid', value: 'Valid' },
    { label: 'Invalid', value: 'Invalid' },
];

/** Today and the 6 days before it, as "YYYY-MM-DD" chips. */
function lastSevenDays(): ChipOption<string | null>[] {
    const days: ChipOption<string | null>[] = [{ label: 'All dates', value: null }];
    for (let i = 0; i < 7; i++) {
        const key = toDateKey(new Date(Date.now() - i * 86_400_000));
        days.push({ label: dayLabel(key), value: key });
    }
    return days;
}

/**
 * Inspection History — every inspection this inspector has done, newest first.
 * Filters (date, route, bus, result) are sent to the backend as query
 * parameters, so the database does the filtering, not the phone.
 */
export default function HistoryScreen() {
    const [date, setDate] = useState<string | null>(null);
    const [route, setRoute] = useState<string | null>(null);
    const [bus, setBus] = useState<string | null>(null);
    const [result, setResult] = useState<InspectionResult | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const [data, setData] = useState<InspectionList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const query: InspectionQuery = {};
        if (date) query.date = date;
        if (route) query.route = route;
        if (bus) query.bus = bus;
        if (result) query.result = result;

        setIsLoading(true);
        setError(null);
        try {
            setData(await getInspections(query));
        } catch (err) {
            setError(messageFrom(err, 'Could not load inspection history'));
        } finally {
            setIsLoading(false);
        }
    }, [date, route, bus, result]);

    // Reload when the tab is opened (new scans) and whenever a filter changes
    useFocusEffect(useCallback(() => { load(); }, [load]));

    const dayOptions = useMemo(lastSevenDays, []);
    const routeOptions = useMemo<ChipOption<string | null>[]>(
        () => [{ label: 'All routes', value: null }, ...(data?.filters.routes ?? []).map((r) => ({ label: `Route ${r}`, value: r }))],
        [data?.filters.routes]
    );
    const busOptions = useMemo<ChipOption<string | null>[]>(
        () => [{ label: 'All buses', value: null }, ...(data?.filters.buses ?? []).map((b) => ({ label: b, value: b }))],
        [data?.filters.buses]
    );

    const activeFilters = [date, route, bus].filter(Boolean).length;
    const inspections = data?.inspections ?? [];
    const invalidCount = inspections.filter((i) => i.result === 'Invalid').length;

    const clearFilters = () => { setDate(null); setRoute(null); setBus(null); setResult(null); };

    return (
        <View style={styles.root}>
            <InspectorHeader
                title="Inspection History"
                subtitle={activeFilters ? `${activeFilters} filter${activeFilters === 1 ? '' : 's'} applied` : 'All inspections'}
                action={{ icon: 'filter', label: showFilters ? 'Hide filters' : 'Show filters', onPress: () => setShowFilters((s) => !s) }}
            />

            <View style={styles.filters}>
                <ChipGroup options={RESULTS} selected={result} onChange={setResult} scroll />
                {showFilters ? (
                    <>
                        <FilterLabel text="Date" />
                        <ChipGroup options={dayOptions} selected={date} onChange={setDate} scroll />
                        <FilterLabel text="Route" />
                        <ChipGroup options={routeOptions} selected={route} onChange={setRoute} scroll />
                        <FilterLabel text="Bus" />
                        <ChipGroup options={busOptions} selected={bus} onChange={setBus} scroll />
                        {activeFilters || result ? (
                            <Text style={styles.clear} onPress={clearFilters} accessibilityRole="button">Clear filters</Text>
                        ) : null}
                    </>
                ) : null}
            </View>

            <FlatList
                data={inspections}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading && !!data} onRefresh={load} tintColor={Colors.orange} />}
                ListHeaderComponent={
                    data ? (
                        <Text style={styles.summary}>
                            {inspections.length} inspection{inspections.length === 1 ? '' : 's'} · {invalidCount} invalid
                        </Text>
                    ) : null
                }
                ListEmptyComponent={
                    isLoading && !data ? (
                        <ActivityIndicator color={Colors.orange} style={styles.loader} />
                    ) : (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>
                                {error ?? (activeFilters || result ? 'No inspections match these filters.' : 'No inspections yet.')}
                            </Text>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <InspectionRow
                        inspection={item}
                        onPress={() => router.push({ pathname: '/inspector/inspection/[id]', params: { id: String(item.id) } })}
                    />
                )}
            />
        </View>
    );
}

function FilterLabel({ text }: { text: string }) {
    return <Text style={styles.filterLabel}>{text}</Text>;
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    filters: {
        backgroundColor: Colors.white, paddingHorizontal: Spacing.five, paddingVertical: Spacing.three,
        gap: Spacing.two, ...Shadow.sm,
    },
    filterLabel: {
        fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textDarkSecondary,
        textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.one,
    },
    clear: { color: Colors.orange, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, alignSelf: 'flex-end' },

    list: { padding: Spacing.five, gap: Spacing.three, paddingBottom: Spacing.twelve },
    summary: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, marginBottom: Spacing.one },
    loader: { marginTop: Spacing.ten },
    empty: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.five, ...Shadow.sm },
    emptyText: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center' },
});
