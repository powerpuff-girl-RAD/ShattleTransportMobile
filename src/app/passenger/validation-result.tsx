import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

export default function ValidationResultScreen() {
    const params = useLocalSearchParams<{
        tokenSerial?: string;
        errorCode?: string;
        message?: string;
        remainingBalance?: string;
    }>();

    const tokenSerial = params.tokenSerial || 'TK-88214';
    const errorCode   = params.errorCode   || 'ERR-TK-4021';
    const remainingBalance = parseFloat(params.remainingBalance || '0') || 0;

    const handleSupport = () => {
        Alert.alert(
            'Shattel Support',
            'Transit Support Hotline: +94 11 234 5678\nEmail: support@shattle.com\nOperating Hours: 24/7',
            [{ text: 'Close' }]
        );
    };

    return (
        <View style={styles.container}>
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
                <Text style={styles.headerTitle}>Validation Result</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ── Red Error Hero Badge ─────────────────────────────── */}
                <View style={styles.heroSection}>
                    <View style={styles.crossCircleOuter}>
                        <View style={styles.crossCircleInner}>
                            <Text style={styles.crossIcon}>✕</Text>
                        </View>
                    </View>
                    <Text style={styles.headline}>Insufficient Credit</Text>
                    <Text style={styles.tokenText}>Token ID #{tokenSerial}</Text>
                </View>

                {/* ── Red Border Error Card ────────────────────────────── */}
                <View style={styles.errorCard}>
                    <Text style={styles.errorDescription}>
                        Your token could not be verified. This may be due to insufficient credit (
                        <Text style={styles.boldRedText}>LKR {remainingBalance.toFixed(0)} remaining</Text>
                        ) or an expired token.
                    </Text>
                    <Text style={styles.errorCodeText}>Error Code: {errorCode}</Text>
                </View>

                {/* ── Suggested Actions ────────────────────────────────── */}
                <View style={styles.actionsSection}>
                    <Text style={styles.actionsSectionTitle}>SUGGESTED ACTIONS</Text>

                    {/* Action 1: Top Up Instantly */}
                    <Pressable
                        style={styles.actionTile}
                        onPress={() => router.push('/passenger/topup')}
                        accessibilityRole="button"
                    >
                        <View style={styles.actionTileLeft}>
                            <View style={styles.actionIconBadgeOrange}>
                                <Text style={styles.actionIconOrange}>＋</Text>
                            </View>
                            <Text style={styles.actionTileLabel}>Top Up Instantly</Text>
                        </View>
                        <Text style={styles.actionArrow}>→</Text>
                    </Pressable>

                    {/* Action 2: Try Scanning Again */}
                    <Pressable
                        style={styles.actionTile}
                        onPress={() => router.replace('/passenger/gate-scanner')}
                        accessibilityRole="button"
                    >
                        <View style={styles.actionTileLeft}>
                            <View style={styles.actionIconBadgeGrey}>
                                <Text style={styles.actionIconGrey}>↻</Text>
                            </View>
                            <Text style={styles.actionTileLabel}>Try Scanning Again</Text>
                        </View>
                        <Text style={styles.actionArrow}>→</Text>
                    </Pressable>

                    {/* Action 3: Contact Support */}
                    <Pressable
                        style={styles.actionTile}
                        onPress={handleSupport}
                        accessibilityRole="button"
                    >
                        <View style={styles.actionTileLeft}>
                            <View style={styles.actionIconBadgeGrey}>
                                <Text style={styles.actionIconGrey}>ℹ</Text>
                            </View>
                            <Text style={styles.actionTileLabel}>Contact Support</Text>
                        </View>
                        <Text style={styles.actionArrow}>→</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnText: {
        color: Colors.white,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    scrollContent: {
        padding: Spacing.five,
        alignItems: 'center',
        gap: Spacing.six,
        paddingBottom: Spacing.twelve,
    },
    heroSection: {
        alignItems: 'center',
        paddingTop: Spacing.four,
        gap: Spacing.two,
    },
    crossCircleOuter: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#FDECEC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    crossCircleInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EB5757',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.sm,
    },
    crossIcon: {
        color: Colors.white,
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.black,
    },
    headline: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: '#D83A3A',
        marginTop: Spacing.one,
    },
    tokenText: {
        fontSize: FontSize.sm,
        color: Colors.textDarkSecondary,
    },
    errorCard: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        borderWidth: 1.5,
        borderColor: '#EB5757',
        padding: Spacing.five,
        gap: Spacing.three,
    },
    errorDescription: {
        fontSize: FontSize.sm,
        color: Colors.textDark,
        lineHeight: 22,
    },
    boldRedText: {
        color: '#D83A3A',
        fontWeight: FontWeight.bold,
    },
    errorCodeText: {
        fontSize: FontSize.xs,
        color: Colors.textDarkSecondary,
    },
    actionsSection: {
        width: '100%',
        gap: Spacing.three,
    },
    actionsSectionTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.inputLightLabel,
        letterSpacing: 1,
    },
    actionTile: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...Shadow.sm,
    },
    actionTileLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    actionIconBadgeOrange: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF4EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIconOrange: {
        color: Colors.orange,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    actionIconBadgeGrey: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIconGrey: {
        color: Colors.textDark,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    actionTileLabel: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.semibold,
        color: Colors.textDark,
    },
    actionArrow: {
        fontSize: FontSize.lg,
        color: Colors.textDarkSecondary,
        fontWeight: FontWeight.bold,
    },
});