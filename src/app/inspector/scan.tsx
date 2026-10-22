import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { InspectInput } from '@/api/inspectorApi';
import { Button, Icon, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useInspector } from '@/store/inspectorStore';

const FRAME_SIZE = 240;

/**
 * Scan Passenger Token.
 * QR codes are read with the camera; smartcards and barcode tickets are
 * typed in by serial ("Enter token ID manually"). Both go to the same
 * backend endpoint, POST /api/inspector/inspect.
 */
export default function ScanScreen() {
    const insets = useSafeAreaInsets();
    const { shift, inspectToken } = useInspector();
    const [permission, requestPermission] = useCameraPermissions();

    const [isFocused, setIsFocused] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showManual, setShowManual] = useState(false);
    const [serial, setSerial] = useState('');

    // The camera reports the same QR code many times per second.
    // This lock makes sure one scan is sent to the backend only once.
    const scanLock = useRef(false);

    // Run the camera only while this tab is on screen (saves battery and
    // frees the camera). Coming back from the Result screen unlocks scanning.
    useFocusEffect(
        useCallback(() => {
            setIsFocused(true);
            setError(null);
            scanLock.current = false;
            return () => {
                setIsFocused(false);
                setTorchOn(false);
            };
        }, [])
    );

    const runInspection = useCallback(async (input: InspectInput) => {
        setIsChecking(true);
        setError(null);
        try {
            await inspectToken(input);
            setShowManual(false);
            setSerial('');
            router.push('/inspector/result');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Could not reach the server. Please try again.');
            scanLock.current = false;
        } finally {
            setIsChecking(false);
        }
    }, [inspectToken]);

    const handleBarcodeScanned = useCallback(({ data }: BarcodeScanningResult) => {
        if (scanLock.current) return;
        scanLock.current = true;
        runInspection({ qrPayload: data });
    }, [runInspection]);

    const submitSerial = useCallback(() => {
        const value = serial.trim();
        if (value.length < 4) {
            setError('Enter the token ID printed on the card or ticket, e.g. TK-10001');
            return;
        }
        runInspection({ tokenSerial: value });
    }, [serial, runInspection]);

    // ── Guard: inspections only during an active shift (same rule as backend) ──
    if (!shift?.onDuty) {
        return (
            <CenteredMessage
                icon="lock"
                title="Shift not started"
                message="Start your shift on the Home tab before scanning tokens."
                actionLabel="Go to Home"
                onAction={() => router.navigate('/inspector')}
            />
        );
    }

    // ── Camera permission ──
    if (!permission) {
        return <View style={styles.root}><ActivityIndicator color={Colors.orange} style={styles.flex} /></View>;
    }
    if (!permission.granted) {
        return (
            <CenteredMessage
                icon="scan"
                title="Camera access needed"
                message="Allow camera access to scan passenger QR codes."
                actionLabel="Allow Camera"
                onAction={requestPermission}
            />
        );
    }

    return (
        <View style={styles.root}>
            {isFocused ? (
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={torchOn}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={isChecking ? undefined : handleBarcodeScanned}
                />
            ) : null}

            {/* ── Top bar ─────────────────────────────────────────────── */}
            <View style={[styles.topBar, { paddingTop: insets.top + Spacing.three }]}>
                <Text style={styles.title}>Scan Passenger Token</Text>
                <Pressable
                    style={[styles.roundButton, torchOn && styles.roundButtonOn]}
                    onPress={() => setTorchOn((on) => !on)}
                    accessibilityRole="button"
                    accessibilityLabel={torchOn ? 'Turn torch off' : 'Turn torch on'}
                >
                    <Icon name="flash" color={torchOn ? Colors.gradientTop : Colors.white} size={20} />
                </Pressable>
            </View>

            {/* ── Scanning frame ──────────────────────────────────────── */}
            <View style={styles.center} pointerEvents="none">
                <View style={styles.frame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                    {isChecking ? <ActivityIndicator color={Colors.white} size="large" /> : null}
                </View>
                <Text style={styles.hint}>
                    {isChecking ? 'Checking token…' : "Point the camera at the passenger's QR code"}
                </Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            {/* ── Bottom panel ────────────────────────────────────────── */}
            <View style={[styles.bottomPanel, { paddingBottom: Spacing.five }]}>
                <Button
                    variant="outline"
                    label="Enter token ID manually"
                    onPress={() => { setError(null); setShowManual(true); }}
                    disabled={isChecking}
                />
                <View style={styles.routeRow}>
                    <Icon name="location" color={Colors.textSecondary} size={16} />
                    <Text style={styles.routeText}>
                        Route {shift.routeNumber} · {shift.routeName} · Bus {shift.vehicleNumber}
                    </Text>
                </View>
            </View>

            {/* ── Manual entry (smartcard / barcode ticket) ───────────── */}
            <Modal visible={showManual} transparent animationType="slide" onRequestClose={() => setShowManual(false)}>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>Enter Token ID</Text>
                        <Text style={styles.sheetSubtitle}>
                            For smartcards and barcode tickets, type the ID printed on the token.
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={serial}
                            onChangeText={setSerial}
                            placeholder="TK-10001"
                            placeholderTextColor={Colors.inputLightPlaceholder}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            autoFocus
                            returnKeyType="search"
                            onSubmitEditing={submitSerial}
                        />
                        {error ? <Text style={styles.sheetError}>{error}</Text> : null}
                        <Button label="Check Token" onPress={submitSerial} loading={isChecking} />
                        <Pressable onPress={() => setShowManual(false)} style={styles.cancel} accessibilityRole="button">
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

/** Full-screen message with one action — used for "shift not started" and "camera permission". */
function CenteredMessage({ icon, title, message, actionLabel, onAction }: {
    icon: 'lock' | 'scan';
    title: string;
    message: string;
    actionLabel: string;
    onAction: () => void;
}) {
    return (
        <View style={[styles.root, styles.messageWrap]}>
            <View style={styles.messageIcon}>
                <Icon name={icon} color={Colors.white} size={32} />
            </View>
            <Text style={styles.messageTitle}>{title}</Text>
            <Text style={styles.messageText}>{message}</Text>
            <Button label={actionLabel} onPress={onAction} style={styles.messageButton} />
        </View>
    );
}

const CORNER = 28;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.black },
    flex: { flex: 1 },

    topBar: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.five, paddingBottom: Spacing.three,
        backgroundColor: 'rgba(8,60,47,0.85)',
    },
    title: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
    roundButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
    },
    roundButtonOn: { backgroundColor: Colors.white },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four, paddingHorizontal: Spacing.six },
    frame: { width: FRAME_SIZE, height: FRAME_SIZE, alignItems: 'center', justifyContent: 'center' },
    corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: Colors.orange },
    topLeft: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: Radius.md },
    topRight: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: Radius.md },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: Radius.md },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: Radius.md },
    hint: { color: Colors.white, fontSize: FontSize.sm, textAlign: 'center' },
    error: {
        color: Colors.white, fontSize: FontSize.sm, textAlign: 'center',
        backgroundColor: 'rgba(229,57,53,0.85)', borderRadius: Radius.sm,
        paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, overflow: 'hidden',
    },

    bottomPanel: {
        paddingHorizontal: Spacing.five, paddingTop: Spacing.four, gap: Spacing.three,
        backgroundColor: 'rgba(8,60,47,0.85)',
    },
    routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
    routeText: { color: Colors.textSecondary, fontSize: FontSize.xs },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
    sheet: {
        backgroundColor: Colors.white, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
        padding: Spacing.six, gap: Spacing.three,
    },
    sheetTitle: { color: Colors.textDark, fontSize: FontSize.lg, lineHeight: FontSize.lg * 1.3, fontWeight: FontWeight.bold },
    sheetSubtitle: { color: Colors.textDarkSecondary, fontSize: FontSize.sm },
    input: {
        height: 52, borderWidth: 1.5, borderColor: Colors.inputLightBorder, borderRadius: Radius.md,
        paddingHorizontal: Spacing.four, fontSize: FontSize.md, color: Colors.inputLightText,
        letterSpacing: 1,
    },
    sheetError: { color: Colors.error, fontSize: FontSize.sm },
    cancel: { alignItems: 'center', paddingVertical: Spacing.two },
    cancelText: { color: Colors.textDarkSecondary, fontSize: FontSize.base, fontWeight: FontWeight.semibold },

    messageWrap: { alignItems: 'center', justifyContent: 'center', padding: Spacing.eight, gap: Spacing.three, backgroundColor: Colors.gradientTop },
    messageIcon: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two,
    },
    messageTitle: { color: Colors.white, fontSize: FontSize.lg, lineHeight: FontSize.lg * 1.3, fontWeight: FontWeight.bold },
    messageText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' },
    messageButton: { alignSelf: 'stretch', marginTop: Spacing.four },
});
