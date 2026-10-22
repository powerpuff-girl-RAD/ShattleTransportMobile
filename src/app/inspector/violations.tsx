import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { getViolations } from '@/api/inspectorApi';
import type { Violation, ViolationType } from '@/api/inspectorApi';
import { ChipGroup, type ChipOption } from '@/components/inspector/ChipGroup';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { StatusPill } from '@/components/inspector/StatusPill';
import { Icon, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { messageFrom } from '@/store/inspectorStore';
import { formatDateTime } from '@/utils/formatTime';

/** Violation Records — every violation this inspector has recorded, filterable by type. */
export default function ViolationsScreen() {
    const [violations, setViolations] = useState<Violation[] | null>(null);
    const [type, setType] = useState<ViolationType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            setViolations(await getViolations());
        } catch (err) {
            setError(messageFrom(err, 'Could not load violation records'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    // Chip per type that actually occurs, with its count: "Expired Token (3)"
    const typeOptions = useMemo<ChipOption<ViolationType | null>[]>(() => {
        const counts = new Map<ViolationType, number>();
        (violations ?? []).forEach((v) => counts.set(v.violationType, (counts.get(v.violationType) ?? 0) + 1));
        return [
            { label: `All (${violations?.length ?? 0})`, value: null },
            ...[...counts].map(([value, count]) => ({ label: `${value} (${count})`, value })),
        ];
    }, [violations]);

    const shown = (violations ?? []).filter((v) => !type || v.violationType === type);
    const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/inspector/profile'));

    return (
        <View style={styles.root}>
            <InspectorHeader title="Violation Records" subtitle="Recorded by you" onBack={goBack} />

            <View style={styles.filters}>
                <ChipGroup options={typeOptions} selected={type} onChange={setType} scroll />
            </View>

            <FlatList
                data={shown}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading && !!violations} onRefresh={load} tintColor={Colors.orange} />}
                ListEmptyComponent={
                    isLoading && !violations ? (
                        <ActivityIndicator color={Colors.orange} style={styles.loader} />
                    ) : (
                        <View style={styles.card}>
                            <Text style={styles.emptyText}>{error ?? 'No violations recorded yet.'}</Text>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <Pressable
                        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                        onPress={() => router.push({ pathname: '/inspector/inspection/[id]', params: { id: String(item.inspectionId) } })}
                        accessibilityRole="button"
                    >
                        <View style={styles.cardTop}>
                            <StatusPill label={item.violationType} tone="error" />
                            <Text style={styles.id}>#{item.id}</Text>
                        </View>
                        <Text style={styles.serial}>Token #{item.tokenSerial}</Text>
                        <View style={styles.metaRow}>
                            <Icon name="bus" color={Colors.textDarkSecondary} size={14} />
                            <Text style={styles.meta}>Route {item.routeNumber} · Bus {item.busNumber} · {item.location}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Icon name="clock" color={Colors.textDarkSecondary} size={14} />
                            <Text style={styles.meta}>{formatDateTime(item.recordedAt)}</Text>
                        </View>
                        {item.notes ? <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text> : null}
                    </Pressable>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    filters: { backgroundColor: Colors.white, paddingHorizontal: Spacing.five, paddingVertical: Spacing.three, ...Shadow.sm },
    list: { padding: Spacing.five, gap: Spacing.three, paddingBottom: Spacing.twelve },
    loader: { marginTop: Spacing.ten },

    card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.one, ...Shadow.sm },
    pressed: { opacity: 0.7 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.one },
    id: { color: Colors.textDarkSecondary, fontSize: FontSize.xs },
    serial: { color: Colors.textDark, fontSize: FontSize.base, fontWeight: FontWeight.bold },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
    meta: { color: Colors.textDarkSecondary, fontSize: FontSize.xs },
    notes: { color: Colors.textDark, fontSize: FontSize.sm, marginTop: Spacing.one },
    emptyText: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center' },
});
