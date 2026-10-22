import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { getInspection } from '@/api/inspectorApi';
import type { InspectionDetail } from '@/api/inspectorApi';
import { Card } from '@/components/inspector/Card';
import { InfoRow } from '@/components/inspector/InfoRow';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { ResultBadge } from '@/components/inspector/ResultBadge';
import { Button, Text } from '@/components/ui';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { messageFrom } from '@/store/inspectorStore';
import { formatDateTime } from '@/utils/formatTime';

/** One inspection from History: result, where / when, and its violation record. */
export default function InspectionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [inspection, setInspection] = useState<InspectionDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Reload on focus: coming back from "Record Violation" shows the new record
    useFocusEffect(
        useCallback(() => {
            let active = true;
            setError(null);
            getInspection(Number(id))
                .then((data) => { if (active) setInspection(data); })
                .catch((err) => { if (active) setError(messageFrom(err, 'Could not load the inspection')); });
            return () => { active = false; };
        }, [id])
    );

    const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/inspector/history'));

    // Ignore a previous inspection still in state while the new one loads
    const current = inspection && String(inspection.id) === id ? inspection : null;

    return (
        <View style={styles.root}>
            <InspectorHeader title="Inspection" subtitle={current ? `Token #${current.tokenSerial}` : undefined} onBack={goBack} />

            {error ? (
                <Text style={styles.centerText}>{error}</Text>
            ) : !current ? (
                <ActivityIndicator color={Colors.orange} style={styles.loader} />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Card style={styles.hero}>
                        <ResultBadge result={current.result} caption={current.reason} size="small" />
                        <Text style={styles.message}>{current.message}</Text>
                    </Card>

                    <Card title="Details">
                        <InfoRow label="Token" value={`#${current.tokenSerial}`} />
                        <InfoRow label="Scanned By" value={current.method === 'QR' ? 'QR code' : 'Manual entry'} />
                        <InfoRow label="Route" value={`Route ${current.routeNumber} · ${current.routeName}`} />
                        <InfoRow label="Bus" value={current.busNumber} />
                        <InfoRow label="Time" value={formatDateTime(current.inspectedAt)} />
                    </Card>

                    {current.violation ? (
                        <Card title="Violation Record">
                            <InfoRow label="Violation #" value={String(current.violation.id)} />
                            <InfoRow label="Type" value={current.violation.violationType} valueColor={Colors.error} />
                            <InfoRow label="Location" value={current.violation.location} />
                            <InfoRow label="Recorded" value={formatDateTime(current.violation.recordedAt)} />
                            {current.violation.notes ? <Text style={styles.notes}>{current.violation.notes}</Text> : null}
                        </Card>
                    ) : current.result === 'Invalid' ? (
                        <Button
                            label="Record Violation"
                            onPress={() => router.push({ pathname: '/inspector/violation', params: { inspectionId: String(current.id) } })}
                        />
                    ) : null}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    scroll: { padding: Spacing.five, gap: Spacing.four, paddingBottom: Spacing.twelve },
    loader: { marginTop: Spacing.ten },
    centerText: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.six },
    hero: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.five },
    message: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center' },
    notes: { color: Colors.textDark, fontSize: FontSize.sm, marginTop: Spacing.two },
});
