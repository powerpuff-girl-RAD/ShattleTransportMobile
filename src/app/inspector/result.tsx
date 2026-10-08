import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/inspector/Card';
import { InfoRow } from '@/components/inspector/InfoRow';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { ResultBadge } from '@/components/inspector/ResultBadge';
import { StatusPill } from '@/components/inspector/StatusPill';
import { Button, Icon, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useScanFeedback } from '@/hooks/use-scan-feedback';
import { useInspector } from '@/store/inspectorStore';
import { formatClock, formatDateTime } from '@/utils/formatTime';

/**
 * Inspection Result — shown straight after a scan.
 * VALID / INVALID with the reason (visual), a beep + vibration (audio / haptic),
 * the list of checks the backend ran, and the passenger's journey.
 */
export default function ResultScreen() {
    const { lastOutcome } = useInspector();
    useScanFeedback(lastOutcome?.inspection.id, lastOutcome?.inspection.result);

    const scanNext = () => router.navigate('/inspector/scan');

    if (!lastOutcome) {
        return (
            <View style={styles.root}>
                <InspectorHeader title="Inspection Result" onBack={scanNext} />
                <Text style={styles.empty}>No inspection yet. Scan a passenger token first.</Text>
            </View>
        );
    }

    const { inspection, message, checks, passenger, journey } = lastOutcome;
    const isValid = inspection.result === 'Valid';

    return (
        <View style={styles.root}>
            <InspectorHeader title="Inspection Result" subtitle={`Token #${inspection.tokenSerial}`} onBack={scanNext} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Valid / Invalid + reason ─────────────────────────── */}
                <Card style={styles.hero}>
                    <ResultBadge result={inspection.result} caption={inspection.reason} />
                    <Text style={styles.message}>{message}</Text>
                </Card>

                {/* ── Checks the backend ran (Pipe and Filter) ─────────── */}
                <Card title="Checks">
                    {checks.map((check) => (
                        <View key={check.name} style={styles.checkRow}>
                            <Icon
                                name={check.passed ? 'check' : 'cross'}
                                color={check.passed ? Colors.primaryDark : Colors.error}
                                size={18}
                            />
                            <Text style={[styles.checkText, !check.passed && styles.checkFailed]}>{check.name}</Text>
                        </View>
                    ))}
                </Card>

                {/* ── Passenger and journey ────────────────────────────── */}
                <Card title="Passenger">
                    {passenger ? (
                        <>
                            <InfoRow label="Name" value={passenger.name ?? 'Not provided'} />
                            <InfoRow
                                label="Balance"
                                value={`LKR ${passenger.balance.toFixed(2)}`}
                                valueColor={passenger.balance > 0 ? Colors.textDark : Colors.error}
                            />
                        </>
                    ) : (
                        <Text style={styles.muted}>Token not registered to a passenger.</Text>
                    )}
                    {journey ? (
                        <>
                            <InfoRow label="Boarded Route" value={`Route ${journey.routeNumber}`} />
                            <InfoRow label="Boarding Stop" value={journey.boardingStop ?? '—'} />
                            <InfoRow label="Boarded At" value={formatClock(journey.boardedAt)} />
                        </>
                    ) : passenger ? (
                        <InfoRow label="Journey">
                            <StatusPill label="No boarding scan" tone="error" />
                        </InfoRow>
                    ) : null}
                </Card>

                {/* ── Where and when (what gets saved) ─────────────────── */}
                <Card title="Inspection">
                    <InfoRow label="Route" value={`Route ${inspection.routeNumber} · ${inspection.routeName}`} />
                    <InfoRow label="Bus" value={inspection.busNumber} />
                    <InfoRow label="Time" value={formatDateTime(inspection.inspectedAt)} />
                </Card>

                {/* ── Actions ──────────────────────────────────────────── */}
                {!isValid && !inspection.hasViolation ? (
                    <Button
                        label="Record Violation"
                        onPress={() => router.push({ pathname: '/inspector/violation', params: { inspectionId: String(inspection.id) } })}
                    />
                ) : null}
                {!isValid && inspection.hasViolation ? (
                    <View style={styles.recorded}>
                        <Icon name="check" color={Colors.primaryDark} size={18} />
                        <Text style={styles.recordedText}>Violation recorded</Text>
                    </View>
                ) : null}
                <Button
                    label="Scan Next"
                    onPress={scanNext}
                    style={isValid || inspection.hasViolation ? undefined : styles.secondaryButton}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    scroll: { padding: Spacing.five, gap: Spacing.four, paddingBottom: Spacing.twelve },
    empty: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.six },

    hero: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.six },
    message: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center' },

    checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
    checkText: { color: Colors.textDark, fontSize: FontSize.sm },
    checkFailed: { color: Colors.error, fontWeight: FontWeight.bold },

    muted: { color: Colors.textDarkSecondary, fontSize: FontSize.sm },

    recorded: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
    recordedText: { color: Colors.primaryDark, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    secondaryButton: { backgroundColor: Colors.gradientTop },
});
