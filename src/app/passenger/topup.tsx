import React, { useCallback, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

const PRESET_AMOUNTS = [
    500, 1000, 1500,
    2000, 3000, 5000,
    7500, 10000, 20000,
];

export default function TopUpScreen() {
    const [selectedAmount, setSelectedAmount] = useState<number>(1000);
    const [customAmountText, setCustomAmountText] = useState<string>('1000');

    const handleSelectPreset = useCallback((amt: number) => {
        setSelectedAmount(amt);
        setCustomAmountText(amt.toString());
    }, []);

    const handleCustomChange = useCallback((text: string) => {
        const clean = text.replace(/[^0-9]/g, '');
        setCustomAmountText(clean);
        const parsed = parseInt(clean, 10);
        if (!isNaN(parsed)) {
            setSelectedAmount(parsed);
        } else {
            setSelectedAmount(0);
        }
    }, []);

    const handleHelp = useCallback(() => {
        Alert.alert(
            'Top-Up Information',
            'You can top-up your Shattel travel wallet using any Debit or Credit card.\n\nMinimum top-up: LKR 100\nMaximum top-up: LKR 50,000 per transaction.\n\nFunds are added instantly to your wallet for public transit rides.',
            [{ text: 'Got it' }]
        );
    }, []);

    const handleProcessPayment = useCallback(() => {
        if (!selectedAmount || selectedAmount < 100) {
            Alert.alert('Invalid Amount', 'Minimum top-up amount is LKR 100.');
            return;
        }
        if (selectedAmount > 50000) {
            Alert.alert('Limit Exceeded', 'Maximum top-up amount is LKR 50,000 per transaction.');
            return;
        }

        router.push({
            pathname: '/passenger/payment',
            params: { amount: selectedAmount.toString() },
        });
    }, [selectedAmount]);

    return (
        <LinearGradient
            colors={[Colors.gradientTop, Colors.gradientMid, '#074836']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* ── Top Header ──────────────────────────────────────── */}
                <View style={styles.header}>
                    <Pressable
                        style={styles.headerBtn}
                        onPress={() => router.back()}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Text style={styles.headerBtnText}>←</Text>
                    </Pressable>

                    <Text style={styles.headerTitle}>Top-Up Balance</Text>

                    <Pressable
                        style={styles.headerBtn}
                        onPress={handleHelp}
                        accessibilityRole="button"
                        accessibilityLabel="Help"
                    >
                        <Text style={styles.headerHelpText}>?</Text>
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── 3x3 Preset Amounts Grid ──────────────────────── */}
                    <View style={styles.grid}>
                        {PRESET_AMOUNTS.map((amt) => {
                            const isSelected = selectedAmount === amt;
                            return (
                                <Pressable
                                    key={amt}
                                    style={styles.gridTileWrapper}
                                    onPress={() => handleSelectPreset(amt)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: isSelected }}
                                >
                                    {isSelected ? (
                                        <LinearGradient
                                            colors={['#0DC87A', '#0A9A5F']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={[styles.gridTile, styles.gridTileSelected]}
                                        >
                                            <Text style={styles.tileAmountSelected}>
                                                {amt.toLocaleString('en-LK')}
                                            </Text>
                                            <Text style={styles.tileCurrencySelected}>LKR</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={styles.gridTile}>
                                            <Text style={styles.tileAmount}>
                                                {amt.toLocaleString('en-LK')}
                                            </Text>
                                            <Text style={styles.tileCurrency}>LKR</Text>
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* ── Custom Amount Input ─────────────────────────── */}
                    <Text style={styles.sectionHeading}>Or Enter Custom Amount</Text>
                    <View style={styles.customInputCard}>
                        <Text style={styles.currencyPrefix}>LKR</Text>
                        <TextInput
                            style={styles.customInput}
                            value={customAmountText}
                            onChangeText={handleCustomChange}
                            placeholder="0"
                            placeholderTextColor={Colors.inputLightPlaceholder}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                        <Text style={styles.editIcon}>✏️</Text>
                    </View>

                    {/* ── Limit Notice ────────────────────────────────── */}
                    <View style={styles.infoBanner}>
                        <Text style={styles.infoBannerIcon}>?</Text>
                        <Text style={styles.infoBannerText}>
                            Maximum top-up amount is LKR 50,000 per transaction.
                        </Text>
                    </View>
                </ScrollView>

                {/* ── Bottom Sticky Bar ──────────────────────────────── */}
                <View style={styles.bottomBar}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount to Pay</Text>
                        <Text style={styles.totalAmount}>
                            LKR {selectedAmount > 0 ? selectedAmount.toLocaleString('en-LK') : '0'}
                        </Text>
                    </View>

                    <Button
                        label="Process Payment"
                        variant="primary"
                        onPress={handleProcessPayment}
                        disabled={selectedAmount <= 0}
                    />
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 56,
        paddingBottom: Spacing.four,
        paddingHorizontal: Spacing.five,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBtnText: {
        color: Colors.white,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    headerHelpText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    scrollContent: {
        paddingHorizontal: Spacing.five,
        paddingTop: Spacing.three,
        paddingBottom: Spacing.twelve,
        gap: Spacing.four,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.three,
        justifyContent: 'space-between',
    },
    gridTileWrapper: {
        width: '31%',
    },
    gridTile: {
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        paddingVertical: Spacing.four,
        paddingHorizontal: Spacing.two,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 88,
        ...Shadow.sm,
    },
    gridTileSelected: {
        backgroundColor: Colors.primary,
        borderWidth: 2,
        borderColor: '#E6FAF2',
        ...Shadow.md,
    },
    tileAmount: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
        marginBottom: 2,
    },
    tileCurrency: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.textDarkSecondary,
    },
    tileAmountSelected: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.black,
        color: Colors.white,
        marginBottom: 2,
    },
    tileCurrencySelected: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    sectionHeading: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.white,
        marginTop: Spacing.two,
    },
    customInputCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.five,
        height: 56,
        ...Shadow.sm,
    },
    currencyPrefix: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
        marginRight: Spacing.three,
    },
    customInput: {
        flex: 1,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
        paddingVertical: 0,
    },
    editIcon: {
        fontSize: FontSize.base,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        gap: Spacing.three,
    },
    infoBannerIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        color: Colors.white,
        textAlign: 'center',
        lineHeight: 20,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    infoBannerText: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: FontSize.xs,
        lineHeight: 16,
    },
    bottomBar: {
        backgroundColor: 'rgba(5, 42, 33, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: Spacing.five,
        paddingTop: Spacing.four,
        paddingBottom: Platform.OS === 'ios' ? Spacing.eight : Spacing.five,
        gap: Spacing.three,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        color: Colors.white,
        fontSize: FontSize.base,
        fontWeight: FontWeight.semibold,
    },
    totalAmount: {
        color: Colors.orange,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.black,
    },
});