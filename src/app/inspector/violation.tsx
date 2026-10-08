import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { getInspection } from '@/api/inspectorApi';
import type { InspectionDetail, InspectionLocation, Violation, ViolationType } from '@/api/inspectorApi';
import { Card } from '@/components/inspector/Card';
import { ChipGroup, type ChipOption } from '@/components/inspector/ChipGroup';
import { InfoRow } from '@/components/inspector/InfoRow';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { Button, Icon, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { messageFrom, useInspector } from '@/store/inspectorStore';
import { formatDateTime } from '@/utils/formatTime';

const VIOLATION_TYPES: ChipOption<ViolationType>[] = [
    { label: 'No Boarding Scan', value: 'No Boarding Scan' },
    { label: 'Expired Token', value: 'Expired Token' },
    { label: 'Insufficient Credit', value: 'Insufficient Credit' },
    { label: 'Invalid Token', value: 'Invalid Token' },
    { label: 'Invalid Journey', value: 'Invalid Journey' },
    { label: 'Other', value: 'Other' },
];

const LOCATIONS: ChipOption<InspectionLocation>[] = [
    { label: 'En Route', value: 'En Route' },
    { label: 'At Stop', value: 'At Stop' },
    { label: 'Terminal', value: 'Terminal' },
];

const MAX_NOTES = 500;

/**
 * Record Violation — opened from the Result screen or an inspection's detail.
 * The inspector picks the type and location and adds notes; token, route,
 * bus and time come from the saved inspection, so they can't be typed wrong.
 */
export default function ViolationScreen() {
    const { inspectionId } = useLocalSearchParams<{ inspectionId: string }>();
    const id = Number(inspectionId);

    const [inspection, setInspection] = useState<InspectionDetail | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Tabs keep hidden screens mounted, so reload whenever a different inspection is opened
    useEffect(() => {
        let active = true;
        setInspection(null);
        setLoadError(null);
        getInspection(id)
            .then((data) => { if (active) setInspection(data); })
            .catch((err) => { if (active) setLoadError(messageFrom(err, 'Could not load the inspection')); });
        return () => { active = false; };
    }, [id]);

    const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/inspector/history'));

    return (
        <View style={styles.root}>
            <InspectorHeader title="Record Violation" subtitle={inspection ? `Token #${inspection.tokenSerial}` : undefined} onBack={goBack} />
            {loadError ? (
                <Text style={styles.centerText}>{loadError}</Text>
            ) : !inspection ? (
                <ActivityIndicator color={Colors.orange} style={styles.loader} />
            ) : (
                // key: start with a fresh form for every inspection
                <ViolationForm key={inspection.id} inspection={inspection} />
            )}
        </View>
    );
}

function ViolationForm({ inspection }: { inspection: InspectionDetail }) {
    const { recordViolation } = useInspector();

    const [violationType, setViolationType] = useState<ViolationType>(inspection.reason ?? 'Other');
    const [location, setLocation] = useState<InspectionLocation>('En Route');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState<Violation | null>(inspection.violation);

    const submit = async () => {
        if (violationType === 'Other' && !notes.trim()) {
            setError('Add a note describing the violation.');
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const violation = await recordViolation({ inspectionId: inspection.id, violationType, location, notes: notes.trim() });
            setSaved(violation);
        } catch (err) {
            setError(messageFrom(err, 'Could not record the violation. Please try again.'));
        } finally {
            setIsSaving(false);
        }
    };

    // ── Saved: confirmation ──
    if (saved) {
        return (
            <ScrollView contentContainerStyle={styles.scroll}>
                <Card style={styles.savedCard}>
                    <View style={styles.savedIcon}>
                        <Icon name="check" color={Colors.primaryDark} size={44} />
                    </View>
                    <Text style={styles.savedTitle}>Violation Recorded</Text>
                    <Text style={styles.savedSub}>Violation #{saved.id} has been saved for managers to review.</Text>
                </Card>
                <Card title="Violation">
                    <InfoRow label="Type" value={saved.violationType} />
                    <InfoRow label="Location" value={saved.location} />
                    <InfoRow label="Route" value={`Route ${saved.routeNumber}`} />
                    <InfoRow label="Bus" value={saved.busNumber} />
                    <InfoRow label="Recorded" value={formatDateTime(saved.recordedAt)} />
                    {saved.notes ? <Text style={styles.notesText}>{saved.notes}</Text> : null}
                </Card>
                <Button label="Scan Next" onPress={() => router.navigate('/inspector/scan')} />
            </ScrollView>
        );
    }

    // ── Form ──
    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <Card title="Inspection">
                    <InfoRow label="Token" value={`#${inspection.tokenSerial}`} />
                    <InfoRow label="Route" value={`Route ${inspection.routeNumber} · ${inspection.routeName}`} />
                    <InfoRow label="Bus" value={inspection.busNumber} />
                    <InfoRow label="Time" value={formatDateTime(inspection.inspectedAt)} />
                    <InfoRow label="Result" value={inspection.reason ?? inspection.result} valueColor={Colors.error} />
                </Card>

                <Card title="Violation Type">
                    <ChipGroup options={VIOLATION_TYPES} selected={violationType} onChange={setViolationType} />
                </Card>

                <Card title="Location">
                    <ChipGroup options={LOCATIONS} selected={location} onChange={setLocation} />
                </Card>

                <Card title="Notes">
                    <TextInput
                        style={styles.notes}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="What happened? e.g. passenger refused to show token"
                        placeholderTextColor={Colors.inputLightPlaceholder}
                        multiline
                        maxLength={MAX_NOTES}
                        textAlignVertical="top"
                    />
                    <Text style={styles.counter}>{notes.length}/{MAX_NOTES}</Text>
                </Card>

                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button label="Save Violation" onPress={submit} loading={isSaving} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    flex: { flex: 1 },
    scroll: { padding: Spacing.five, gap: Spacing.four, paddingBottom: Spacing.twelve },
    loader: { marginTop: Spacing.ten },
    centerText: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.six },

    notes: {
        minHeight: 100, borderWidth: 1.5, borderColor: Colors.inputLightBorder, borderRadius: Radius.md,
        padding: Spacing.three, fontSize: FontSize.base, color: Colors.inputLightText,
    },
    counter: { alignSelf: 'flex-end', marginTop: Spacing.one, fontSize: FontSize.xs, color: Colors.textDarkSecondary },
    error: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },

    savedCard: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
    savedIcon: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.successTint,
        alignItems: 'center', justifyContent: 'center',
    },
    savedTitle: { color: Colors.textDark, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
    savedSub: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center' },
    notesText: { color: Colors.textDark, fontSize: FontSize.sm, marginTop: Spacing.two, fontWeight: FontWeight.regular },
});
