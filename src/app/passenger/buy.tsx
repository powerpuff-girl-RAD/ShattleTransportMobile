import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { router } from 'expo-router';
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
import { getFareEstimate } from '@/api/journeyApi';

type PlanTab = 'Distance' | 'DayPasses' | 'Visitor' | 'ActivateToken';

interface PassItem {
    id: string;
    title: string;
    priceLabel: string;
    description: string;
    price: number;
}

const DAY_PASSES: PassItem[] = [
    {
        id: 'daily',
        title: 'Daily Pass',
        priceLabel: 'LKR 500',
        description: 'Unlimited travel on any Shattle bus for 24 hours',
        price: 500,
    },
    {
        id: 'weekly',
        title: 'Weekly Pass',
        priceLabel: 'LKR 2,500',
        description: '7-day unlimited network-wide commuter travel',
        price: 2500,
    },
    {
        id: 'monthly',
        title: 'Monthly Pass',
        priceLabel: 'LKR 8,000',
        description: '30-day unlimited commuting with highest savings',
        price: 8000,
    },
];

const VISITOR_PASSES: PassItem[] = [
    {
        id: 'tourist-3day',
        title: '3-Day Tourist Pass',
        priceLabel: 'LKR 1,200',
        description: 'Unlimited travel across Western Province transit routes',
        price: 1200,
    },
    {
        id: 'explorer-7day',
        title: '7-Day Island Explorer',
        priceLabel: 'LKR 3,500',
        description: 'Network-wide unlimited express and standard services',
        price: 3500,
    },
];

const DISTANCE_TIERS = [
    { range: '0 - 5 km', fare: 'LKR 30.00', desc: 'Short neighborhood hops' },
    { range: '5 - 10 km', fare: 'LKR 45.00', desc: 'Suburban connectors' },
    { range: '10 - 20 km', fare: 'LKR 75.00', desc: 'Inter-district routes' },
    { range: '20 - 30 km', fare: 'LKR 120.00', desc: 'Long distance transit' },
    { range: '30 - 50 km', fare: 'LKR 170.00', desc: 'Negombo to Colombo Fort express' },
    { range: '50+ km', fare: 'LKR 230.00', desc: 'Provincial cross-corridor transit' },
];

const STATIONS = [
    'Negombo Bus Stand',
    'Katunayake Airport Junction',
    'Ja-Ela Interchange',
    'Peliyagoda Central',
    'Colombo Fort',
];

type TokenType = 'QR' | 'Smartcard' | 'Barcode';
const TOKEN_TYPES: { type: TokenType; label: string; sublabel: string; icon: string }[] = [
    { type: 'QR', label: 'QR Code', sublabel: 'App Digital', icon: '⬛' },
    { type: 'Smartcard', label: 'Smartcard', sublabel: 'Physical Card', icon: '💳' },
    { type: 'Barcode', label: 'Barcode', sublabel: 'Printed Ticket', icon: '▇▇' },
];

export default function BuyScreen() {
    const { profile, activateToken, tokenLoading, error, clearError } = usePassenger();

    const [activeTab, setActiveTab] = useState<PlanTab>('DayPasses');

    // Fare Calculator State
    const [fromStation, setFromStation] = useState('Negombo Bus Stand');
    const [toStation, setToStation] = useState('Colombo Fort');
    const [isPeak, setIsPeak] = useState(true);
    const [estimatedFare, setEstimatedFare] = useState<number>(170);
    const [isCalculating, setIsCalculating] = useState(false);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Token Activation State
    const [selectedTokenType, setSelectedTokenType] = useState<TokenType>('QR');
    const [serial, setSerial] = useState('');
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Fetch fare estimate when stations or peak toggle change
    useEffect(() => {
        let isMounted = true;
        const calculate = async () => {
            setIsCalculating(true);
            try {
                const res = await getFareEstimate({
                    routeId: 1,
                    fromStation,
                    toStation,
                    isPeak,
                });
                if (isMounted && res) {
                    setEstimatedFare(res.estimatedFare);
                }
            } catch {
                if (isMounted) {
                    setEstimatedFare(isPeak ? 170 : 150);
                }
            } finally {
                if (isMounted) setIsCalculating(false);
            }
        };

        calculate();
        return () => {
            isMounted = false;
        };
    }, [fromStation, toStation, isPeak]);

    const handleBuyPass = (pass: PassItem) => {
        const balance = profile?.account?.balance || 0;
        if (balance < pass.price) {
            Alert.alert(
                'Insufficient Credit',
                `You need ${pass.priceLabel} to purchase this pass. Your current balance is LKR ${balance.toFixed(2)}. Would you like to top up now?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Top Up', onPress: () => router.push('/passenger/topup') },
                ]
            );
        } else {
            Alert.alert(
                'Confirm Pass Purchase',
                `Purchase ${pass.title} for ${pass.priceLabel}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Confirm',
                        onPress: () => {
                            Alert.alert('Success', `${pass.title} activated successfully on your digital token!`);
                        },
                    },
                ]
            );
        }
    };

    const handleActivateToken = useCallback(async () => {
        if (!serial.trim()) return;
        clearError();
        setSuccessMsg(null);
        try {
            const msg = await activateToken({ tokenSerial: serial.trim(), tokenType: selectedTokenType });
            setSuccessMsg(msg);
            setSerial('');
        } catch {
            // Error captured in store
        }
    }, [serial, selectedTokenType]);

    return (
        <View style={styles.root}>
            {/* ── Top Header ──────────────────────────────────────────── */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backBtn}
                    onPress={() => router.replace('/passenger')}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backBtnText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Fare Plans & Passes</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Pill Tabs ─────────────────────────────────────────── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabContainer}
                >
                    <Pressable
                        style={[styles.pillTab, activeTab === 'Distance' ? styles.pillTabActive : undefined]}
                        onPress={() => setActiveTab('Distance')}
                    >
                        <Text style={[styles.pillTabText, activeTab === 'Distance' ? styles.pillTabTextActive : undefined]}>
                            Distance Based
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[styles.pillTab, activeTab === 'DayPasses' ? styles.pillTabActive : undefined]}
                        onPress={() => setActiveTab('DayPasses')}
                    >
                        <Text style={[styles.pillTabText, activeTab === 'DayPasses' ? styles.pillTabTextActive : undefined]}>
                            Day Passes
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[styles.pillTab, activeTab === 'Visitor' ? styles.pillTabActive : undefined]}
                        onPress={() => setActiveTab('Visitor')}
                    >
                        <Text style={[styles.pillTabText, activeTab === 'Visitor' ? styles.pillTabTextActive : undefined]}>
                            Visitor Passes
                        </Text>
                    </Pressable>

                    {/* Activate Token tab hidden / commented as requested
                    <Pressable
                        style={[styles.pillTab, activeTab === 'ActivateToken' ? styles.pillTabActive : undefined]}
                        onPress={() => setActiveTab('ActivateToken')}
                    >
                        <Text style={[styles.pillTabText, activeTab === 'ActivateToken' ? styles.pillTabTextActive : undefined]}>
                            Activate Token
                        </Text>
                    </Pressable>
                    */}
                </ScrollView>

                {/* ── Tab Content: Day Passes ───────────────────────────── */}
                {activeTab === 'DayPasses' && (
                    <View style={styles.passesList}>
                        {DAY_PASSES.map((pass) => (
                            <View key={pass.id} style={styles.passCard}>
                                <View style={styles.passInfoWrap}>
                                    <View style={styles.passTitleRow}>
                                        <Text style={styles.passTitle}>{pass.title}</Text>
                                        <View style={styles.passPriceBadge}>
                                            <Text style={styles.passPriceBadgeText}>{pass.priceLabel}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.passDesc}>{pass.description}</Text>
                                </View>
                                <Pressable
                                    style={styles.buyButton}
                                    onPress={() => handleBuyPass(pass)}
                                >
                                    <Text style={styles.buyButtonText}>Buy</Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Tab Content: Visitor Passes ───────────────────────── */}
                {activeTab === 'Visitor' && (
                    <View style={styles.passesList}>
                        {VISITOR_PASSES.map((pass) => (
                            <View key={pass.id} style={styles.passCard}>
                                <View style={styles.passInfoWrap}>
                                    <View style={styles.passTitleRow}>
                                        <Text style={styles.passTitle}>{pass.title}</Text>
                                        <View style={styles.passPriceBadge}>
                                            <Text style={styles.passPriceBadgeText}>{pass.priceLabel}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.passDesc}>{pass.description}</Text>
                                </View>
                                <Pressable
                                    style={styles.buyButton}
                                    onPress={() => handleBuyPass(pass)}
                                >
                                    <Text style={styles.buyButtonText}>Buy</Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Tab Content: Distance Based ───────────────────────── */}
                {activeTab === 'Distance' && (
                    <View style={styles.passesList}>
                        <View style={styles.tierContainer}>
                            {DISTANCE_TIERS.map((tier, idx) => (
                                <View key={idx} style={styles.tierRow}>
                                    <View>
                                        <Text style={styles.tierRange}>{tier.range}</Text>
                                        <Text style={styles.tierDesc}>{tier.desc}</Text>
                                    </View>
                                    <Text style={styles.tierFare}>{tier.fare}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Tab Content: Token Activation (commented as requested) ───────
                {activeTab === 'ActivateToken' && (
                    <View style={styles.activationCard}>
                        {successMsg && (
                            <View style={styles.successBanner}>
                                <Text style={styles.successIcon}>✓</Text>
                                <Text style={styles.successText}>{successMsg}</Text>
                            </View>
                        )}
                        {error && (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                        <Text style={styles.instruction}>
                            Select your token type and enter the serial number on the back of your card or printed ticket.
                        </Text>
                        <View style={styles.typeGrid}>
                            {TOKEN_TYPES.map(({ type, label, sublabel, icon }) => {
                                const isActive = selectedTokenType === type;
                                return (
                                    <Pressable
                                        key={type}
                                        style={[styles.typeTile, isActive ? styles.typeTileActive : undefined]}
                                        onPress={() => setSelectedTokenType(type)}
                                    >
                                        <Text style={styles.typeIcon}>{icon}</Text>
                                        <Text style={[styles.typeLabel, isActive ? styles.typeLabelActive : undefined]}>{label}</Text>
                                        <Text style={styles.typeSublabel}>{sublabel}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <TextInput
                            style={styles.serialInput}
                            placeholder="e.g. TK-88214"
                            placeholderTextColor={Colors.gray400}
                            value={serial}
                            onChangeText={setSerial}
                            autoCapitalize="characters"
                        />
                        <Button
                            label="Activate Token"
                            onPress={handleActivateToken}
                            loading={tokenLoading}
                            style={styles.activateBtn}
                        />
                    </View>
                )}
                */}

                {/* ── FARE CALCULATOR ────────────────────────────────────── */}
                <Text style={styles.sectionHeader}>FARE CALCULATOR</Text>

                <View style={styles.calculatorCard}>
                    {/* FROM STATION */}
                    <Text style={styles.calcFieldLabel}>FROM STATION</Text>
                    <Pressable
                        style={styles.stationInputBox}
                        onPress={() => setShowFromPicker(!showFromPicker)}
                    >
                        <Text style={styles.stationInputText}>{fromStation}</Text>
                        <Text style={styles.pickerArrow}>▾</Text>
                    </Pressable>
                    {showFromPicker && (
                        <View style={styles.pickerDropdown}>
                            {STATIONS.map((s) => (
                                <Pressable
                                    key={s}
                                    style={[styles.pickerItem, fromStation === s ? styles.pickerItemActive : undefined]}
                                    onPress={() => {
                                        setFromStation(s);
                                        setShowFromPicker(false);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, fromStation === s ? styles.pickerItemTextActive : undefined]}>
                                        {s}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {/* TO STATION */}
                    <Text style={[styles.calcFieldLabel, { marginTop: Spacing.md }]}>TO STATION</Text>
                    <Pressable
                        style={styles.stationInputBox}
                        onPress={() => setShowToPicker(!showToPicker)}
                    >
                        <Text style={styles.stationInputText}>{toStation}</Text>
                        <Text style={styles.pickerArrow}>▾</Text>
                    </Pressable>
                    {showToPicker && (
                        <View style={styles.pickerDropdown}>
                            {STATIONS.map((s) => (
                                <Pressable
                                    key={s}
                                    style={[styles.pickerItem, toStation === s ? styles.pickerItemActive : undefined]}
                                    onPress={() => {
                                        setToStation(s);
                                        setShowToPicker(false);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, toStation === s ? styles.pickerItemTextActive : undefined]}>
                                        {s}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {/* Peak / Off-Peak Toggle Pills */}
                    <View style={styles.peakToggleRow}>
                        <Pressable
                            style={[styles.peakBtn, isPeak ? styles.peakBtnActive : undefined]}
                            onPress={() => setIsPeak(true)}
                        >
                            <Text style={[styles.peakBtnText, isPeak ? styles.peakBtnTextActive : undefined]}>
                                Peak Hours
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.peakBtn, !isPeak ? styles.peakBtnActive : undefined]}
                            onPress={() => setIsPeak(false)}
                        >
                            <Text style={[styles.peakBtnText, !isPeak ? styles.peakBtnTextActive : undefined]}>
                                Off-Peak
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.calcDivider} />

                    {/* Estimated Fare Display */}
                    <View style={styles.fareResultRow}>
                        <Text style={styles.fareResultLabel}>Estimated Fare</Text>
                        {isCalculating ? (
                            <ActivityIndicator size="small" color="#0A9A5F" />
                        ) : (
                            <Text style={styles.fareResultValue}>
                                LKR {estimatedFare.toFixed(2)}
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F3F6F8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F6B56',
        paddingHorizontal: Spacing.md,
        paddingTop: Platform.OS === 'ios' ? 54 : 36,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    backBtnText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        marginTop: -2,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: '#FFFFFF',
    },
    scroll: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    tabContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    pillTab: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pillTabActive: {
        backgroundColor: '#E67E22',
        borderColor: '#E67E22',
    },
    pillTabText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: '#64748B',
    },
    pillTabTextActive: {
        color: Colors.white,
    },
    passesList: {
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    passCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        ...Shadow.sm,
    },
    passInfoWrap: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    passTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: 4,
    },
    passTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    passPriceBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    passPriceBadgeText: {
        color: '#0A9A5F',
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    passDesc: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
        lineHeight: 16,
    },
    buyButton: {
        backgroundColor: '#E67E22',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 10,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyButtonText: {
        color: Colors.white,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    tierContainer: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        ...Shadow.sm,
    },
    tierRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tierRange: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    tierDesc: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
    },
    tierFare: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#0A9A5F',
    },
    sectionHeader: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#334155',
        letterSpacing: 0.8,
        marginBottom: Spacing.sm,
    },
    calculatorCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        ...Shadow.sm,
    },
    calcFieldLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#475569',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    stationInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
    },
    stationInputText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.text,
    },
    pickerArrow: {
        color: '#64748B',
        fontSize: FontSize.sm,
    },
    pickerDropdown: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: Radius.md,
        marginTop: 4,
        overflow: 'hidden',
    },
    pickerItem: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    pickerItemActive: {
        backgroundColor: '#E0F2FE',
    },
    pickerItemText: {
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    pickerItemTextActive: {
        fontWeight: FontWeight.bold,
        color: '#0369A1',
    },
    peakToggleRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    peakBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: Radius.md,
        backgroundColor: '#EDF2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    peakBtnActive: {
        backgroundColor: '#E67E22',
    },
    peakBtnText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#64748B',
    },
    peakBtnTextActive: {
        color: Colors.white,
    },
    calcDivider: {
        height: 1,
        backgroundColor: '#EDF2F7',
        marginVertical: Spacing.md,
    },
    fareResultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fareResultLabel: {
        fontSize: FontSize.sm,
        color: '#64748B',
        fontWeight: FontWeight.medium,
    },
    fareResultValue: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: '#0A9A5F',
    },
    activationCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        ...Shadow.sm,
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: Radius.md,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    successIcon: {
        color: '#0A9A5F',
        fontWeight: FontWeight.bold,
        marginRight: 6,
    },
    successText: {
        color: '#065F46',
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        flex: 1,
    },
    errorBanner: {
        backgroundColor: '#FEF2F2',
        borderRadius: Radius.md,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    errorText: {
        color: '#B91C1C',
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    instruction: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        marginBottom: Spacing.sm,
    },
    typeGrid: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    typeTile: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.sm,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    typeTileActive: {
        borderColor: '#0A9A5F',
        backgroundColor: '#ECFDF5',
    },
    typeIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    typeLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.gray600,
    },
    typeLabelActive: {
        color: '#0A9A5F',
    },
    typeSublabel: {
        fontSize: 10,
        color: Colors.gray400,
    },
    serialInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        fontSize: FontSize.sm,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    activateBtn: {
        backgroundColor: '#0F6B56',
    },
});