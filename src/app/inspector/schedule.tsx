import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { getSchedule } from '@/api/inspectorApi';
import type { ScheduledShift } from '@/api/inspectorApi';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { StatusPill } from '@/components/inspector/StatusPill';
import { Icon, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { messageFrom } from '@/store/inspectorStore';
import { dayLabel, formatDate } from '@/utils/formatTime';

/** Shift Schedule — today's and upcoming shifts assigned by a manager in the web portal. */
export default function ScheduleScreen() {
    const [shifts, setShifts] = useState<ScheduledShift[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            setShifts(await getSchedule());
        } catch (err) {
            setError(messageFrom(err, 'Could not load your schedule'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/inspector/profile'));

    return (
        <View style={styles.root}>
            <InspectorHeader title="Shift Schedule" subtitle="Upcoming shifts" onBack={goBack} />
            <FlatList
                data={shifts ?? []}
                keyExtractor={(item) => String(item.scheduleId)}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading && !!shifts} onRefresh={load} tintColor={Colors.orange} />}
                ListEmptyComponent={
                    isLoading && !shifts ? (
                        <ActivityIndicator color={Colors.orange} style={styles.loader} />
                    ) : (
                        <View style={styles.card}>
                            <Text style={styles.emptyText}>{error ?? 'No upcoming shifts. Your manager assigns shifts in the web portal.'}</Text>
                        </View>
                    )
                }
                renderItem={({ item }) => {
                    const label = dayLabel(item.date);
                    const isToday = label === 'Today';
                    return (
                        <View style={[styles.card, isToday && styles.today]}>
                            <View style={styles.top}>
                                <Text style={styles.day}>{isToday ? 'Today' : formatDate(`${item.date}T00:00:00`)}</Text>
                                <StatusPill label={isToday ? 'Today' : item.status} tone={isToday ? 'orange' : 'neutral'} />
                            </View>
                            <View style={styles.row}>
                                <Icon name="clock" color={Colors.textDarkSecondary} size={16} />
                                <Text style={styles.text}>{item.startTime} - {item.endTime}</Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="location" color={Colors.textDarkSecondary} size={16} />
                                <Text style={styles.text}>Route {item.routeNumber} · {item.routeName}</Text>
                            </View>
                            <View style={styles.row}>
                                <Icon name="bus" color={Colors.textDarkSecondary} size={16} />
                                <Text style={styles.text}>Bus {item.vehicleNumber}</Text>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    list: { padding: Spacing.five, gap: Spacing.three, paddingBottom: Spacing.twelve },
    loader: { marginTop: Spacing.ten },
    card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.two, ...Shadow.sm },
    today: { borderWidth: 2, borderColor: Colors.orange },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    day: { color: Colors.textDark, fontSize: FontSize.base, fontWeight: FontWeight.bold },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
    text: { color: Colors.textDark, fontSize: FontSize.sm },
    emptyText: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center' },
});
