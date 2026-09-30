import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { Button, Text } from '@/components/ui';
import {
    Colors,
    FontSize,
    FontWeight,
    Radius,
    Shadow,
    Spacing,
} from '@/constants/theme';
import { usePassenger } from '@/store/passengerStore';

type TokenType = 'QR' | 'Smartcard' | 'Barcode';

const TOKEN_TYPES: { type: TokenType; label: string; sublabel: string; icon: string }[] = [
    { type: 'QR', label: 'QR Code', sublabel: 'App Digital', icon: '⬛' },
    { type: 'Smartcard', label: 'Smartcard', sublabel: 'Physical Card', icon: '💳' },
    { type: 'Barcode', label: 'Barcode', sublabel: 'Printed Ticket', icon: '▇▇' },
];

export default function BuyScreen() {
    const { activateToken, tokenLoading, error, clearError } = usePassenger();

    const [selectedType, setSelectedType] = useState<TokenType>('QR');
    const [serial, setSerial] = useState('');
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleActivate = useCallback(async () => {
        if (!serial.trim()) return;
        clearError();
        setSuccessMsg(null);
        try {
            const msg = await activateToken({ tokenSerial: serial.trim(), tokenType: selectedType });
            setSuccessMsg(msg);
            setSerial('');
        } catch {
            // error already set in the store
        }
    }, [serial, selectedType]);

    return (
        <View style={styles.root}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Activate Your Token</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Success banner ───────────────────────────────────── */}
                {successMsg && (
                    <View style={styles.successBanner}>
                        <Text style={styles.successIcon}>✓</Text>
                        <Text style={styles.successText}>{successMsg}</Text>
                    </View>
                )}

                {/* ── Error banner ─────────────────────────────────────── */}
                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <Text style={styles.instruction}>
                    Select your token type and enter the serial number on the back of your
                    card or printed ticket.
                </Text>

                {/* ── Token type selector ──────────────────────────────── */}
                <View style={styles.typeGrid}>
                    {TOKEN_TYPES.map(({ type, label, sublabel, icon }) => {
                        const isActive = selectedType === type;
                        return (
                            <Pressable
                                key={type}
                                style={[styles.typeTile, isActive ? styles.typeTileActive : undefined]}
                                onPress={() => setSelectedType(type)}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: isActive }}
                            >
                                <View style={[styles.typeIconBg, isActive ? styles.typeIconBgActive : undefined]}>
                                    <Text style={styles.typeIcon}>{icon}</Text>
                                </View>
                                <Text style={isActive ? [styles.typeLabel, styles.typeLabelActive] : styles.typeLabel}>{label}</Text>
                                <Text style={styles.typeSublabel}>{sublabel}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* ── Serial input ─────────────────────────────────────── */}
                <Text style={styles.inputLabel}>TOKEN SERIAL NUMBER</Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        value={serial}
                        onChangeText={(t) => { setSerial(t.toUpperCase()); clearError(); setSuccessMsg(null); }}
                        placeholder="TK-88214"
                        placeholderTextColor={Colors.inputLightPlaceholder}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleActivate}
                    />
                </View>

                {/* ── Info box ─────────────────────────────────────────── */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>ℹ</Text>
                    <Text style={styles.infoText}>
                        Linking a token lets you instantly top-up online, track trip logs, and
                        export expense records directly to your Shattle profile.
                    </Text>
                </View>

                {/* ── Physical token note ──────────────────────────────── */}
                {selectedType !== 'QR' && (
                    <View style={styles.notAvailableBanner}>
                        <Text style={styles.notAvailableText}>
                            {selectedType} integration is coming soon. Please use a QR token for now.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* ── Sticky CTA ───────────────────────────────────────────── */}
            <View style={styles.footer}>
                {tokenLoading ? (
                    <ActivityIndicator color={Colors.orange} />
                ) : (
                    <Button
                        label="Link to Account"
                        onPress={handleActivate}
                        variant="primary"
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.surfaceLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gradientTop,
        paddingTop: 56,
        paddingBottom: Spacing.five,
        paddingHorizontal: Spacing.five,
        gap: Spacing.three,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    scroll: {
        padding: Spacing.five,
        gap: Spacing.four,
        paddingBottom: Spacing.twelve,
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6FAF2',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.success,
        padding: Spacing.three,
        gap: Spacing.two,
    },
    successIcon: {
        fontSize: FontSize.base,
        color: Colors.success,
        fontWeight: FontWeight.bold,
    },
    successText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.primaryDark,
        fontWeight: FontWeight.semibold,
    },
    errorBanner: {
        backgroundColor: '#FFF0F0',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.error,
        padding: Spacing.three,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.sm,
    },
    instruction: {
        fontSize: FontSize.sm,
        color: Colors.textDarkSecondary,
    },
    typeGrid: {
        flexDirection: 'row',
        gap: Spacing.three,
    },
    typeTile: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.three,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1.5,
        borderColor: Colors.inputLightBorder,
        ...Shadow.sm,
    },
    typeTileActive: {
        borderColor: Colors.primaryDark,
    },
    typeIconBg: {
        width: 48,
        height: 48,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeIconBgActive: {
        backgroundColor: '#E6FAF2',
    },
    typeIcon: {
        fontSize: FontSize.lg,
    },
    typeLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textDark,
    },
    typeLabelActive: {
        color: Colors.primaryDark,
    },
    typeSublabel: {
        fontSize: FontSize.xs,
        color: Colors.inputLightPlaceholder,
    },
    inputLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.inputLightLabel,
        letterSpacing: 1,
    },
    inputWrapper: {
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.inputLightBorder,
    },
    input: {
        height: 52,
        paddingHorizontal: Spacing.four,
        fontSize: FontSize.base,
        color: Colors.inputLightText,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EBF6FF',
        borderRadius: Radius.lg,
        padding: Spacing.four,
        gap: Spacing.two,
        alignItems: 'flex-start',
    },
    infoIcon: {
        fontSize: FontSize.base,
        color: '#1A73E8',
    },
    infoText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textDark,
    },
    notAvailableBanner: {
        backgroundColor: '#FFF8E6',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.orange,
        padding: Spacing.three,
    },
    notAvailableText: {
        fontSize: FontSize.sm,
        color: Colors.orange,
    },
    footer: {
        padding: Spacing.five,
        backgroundColor: Colors.white,
        borderTopWidth: 0.5,
        borderTopColor: Colors.inputLightBorder,
    },
});
