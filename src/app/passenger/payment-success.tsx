import React, { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

export default function PaymentSuccessScreen() {
    const params = useLocalSearchParams<{
        transactionRef?: string;
        amount?: string;
        paymentMethod?: string;
        cardLast4?: string;
        newBalance?: string;
        createdAt?: string;
    }>();

    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const transactionRef = params.transactionRef || 'TXN-20250919-001';
    const amountVal      = parseFloat(params.amount || '1000') || 1000;
    const paymentMethod  = params.paymentMethod || 'Debit Card';
    const cardLast4      = params.cardLast4 || '4582';
    const newBalanceVal  = parseFloat(params.newBalance || '23320') || 23320;
    const createdAtRaw   = params.createdAt;

    const dateFormatted = createdAtRaw
        ? new Date(createdAtRaw).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          }) + ' · ' +
          new Date(createdAtRaw).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
          })
        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' +
          new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const handleBackHome = useCallback(() => {
        router.replace('/passenger');
    }, []);

    const handleViewReceipt = useCallback(() => {
        setShowReceiptModal(true);
    }, []);

    return (
        <View style={styles.container}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backBtn}
                    onPress={handleBackHome}
                    accessibilityRole="button"
                    accessibilityLabel="Back to Home"
                >
                    <Text style={styles.backBtnText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Payment Success</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Success Hero ────────────────────────────────────── */}
                <View style={styles.heroWrapper}>
                    <View style={styles.checkCircleOuter}>
                        <View style={styles.checkCircleInner}>
                            <Text style={styles.checkIcon}>✓</Text>
                        </View>
                    </View>

                    <Text style={styles.successTitle}>Top-Up Successful!</Text>
                    <Text style={styles.successSubtitle}>
                        Your account balance has been updated instantly.
                    </Text>
                </View>

                {/* ── Transaction Details Card ─────────────────────────── */}
                <View style={styles.detailsCard}>
                    <Text style={styles.cardHeader}>TRANSACTION DETAILS</Text>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount Added</Text>
                        <Text style={styles.amountValue}>
                            LKR {amountVal.toLocaleString('en-LK', { minimumFractionDigits: 0 })}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Method</Text>
                        <Text style={styles.detailValue}>{paymentMethod} ****{cardLast4}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Transaction ID</Text>
                        <Text style={styles.detailValue}>#{transactionRef}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date & Time</Text>
                        <Text style={styles.detailValue}>{dateFormatted}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceRowLabel}>New Balance</Text>
                        <View style={styles.balanceBadge}>
                            <Text style={styles.balanceBadgeText}>
                                LKR {newBalanceVal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* ── Bottom Action Buttons ───────────────────────────────── */}
            <View style={styles.footer}>
                <Button
                    label="Back to Home"
                    variant="primary"
                    onPress={handleBackHome}
                />
                <Button
                    label="View Receipt"
                    variant="outline"
                    onPress={handleViewReceipt}
                    style={styles.outlineBtn}
                />
            </View>

            {/* ── Receipt Modal ───────────────────────────────────────── */}
            <Modal
                visible={showReceiptModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReceiptModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.receiptHeader}>
                            <Text style={styles.receiptBrand}>SHATTEL TRANSPORT</Text>
                            <Text style={styles.receiptTitle}>Official E-Receipt</Text>
                        </View>

                        <View style={styles.receiptDashedLine} />

                        <View style={styles.receiptBody}>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Transaction No:</Text>
                                <Text style={styles.receiptVal}>#{transactionRef}</Text>
                            </View>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Date & Time:</Text>
                                <Text style={styles.receiptVal}>{dateFormatted}</Text>
                            </View>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Payment Type:</Text>
                                <Text style={styles.receiptVal}>{paymentMethod}</Text>
                            </View>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Card Number:</Text>
                                <Text style={styles.receiptVal}>**** **** **** {cardLast4}</Text>
                            </View>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Status:</Text>
                                <Text style={[styles.receiptVal, { color: Colors.success, fontWeight: FontWeight.bold }]}>
                                    COMPLETED
                                </Text>
                            </View>

                            <View style={styles.receiptDashedLine} />

                            <View style={styles.receiptRow}>
                                <Text style={[styles.receiptLabel, { fontSize: FontSize.md, fontWeight: FontWeight.bold }]}>
                                    Total Paid:
                                </Text>
                                <Text style={[styles.receiptVal, { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.orange }]}>
                                    LKR {amountVal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        </View>

                        <Button
                            label="Close Receipt"
                            variant="primary"
                            onPress={() => setShowReceiptModal(false)}
                            style={{ marginTop: Spacing.four }}
                        />
                    </View>
                </View>
            </Modal>
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
        gap: Spacing.six,
        paddingBottom: Spacing.twelve,
    },
    heroWrapper: {
        alignItems: 'center',
        paddingTop: Spacing.four,
        gap: Spacing.two,
    },
    checkCircleOuter: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#E6FAF2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.two,
    },
    checkCircleInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.md,
    },
    checkIcon: {
        color: Colors.white,
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
    },
    successTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textDarkSecondary,
        textAlign: 'center',
    },
    detailsCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius['2xl'],
        padding: Spacing.six,
        gap: Spacing.three,
        ...Shadow.md,
    },
    cardHeader: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.inputLightPlaceholder,
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.surfaceLight,
        marginVertical: Spacing.one,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    detailLabel: {
        fontSize: FontSize.sm,
        color: Colors.inputLightLabel,
    },
    detailValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textDark,
    },
    amountValue: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.one,
    },
    balanceRowLabel: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    balanceBadge: {
        backgroundColor: '#E6FAF2',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,
        borderRadius: Radius.md,
    },
    balanceBadgeText: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.primaryDark,
    },
    footer: {
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.inputLightBorder,
        paddingHorizontal: Spacing.five,
        paddingTop: Spacing.four,
        paddingBottom: Platform.OS === 'ios' ? Spacing.eight : Spacing.five,
        gap: Spacing.three,
    },
    outlineBtn: {
        borderColor: Colors.inputLightBorder,
        backgroundColor: Colors.white,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.five,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: Colors.white,
        borderRadius: Radius['2xl'],
        padding: Spacing.six,
        ...Shadow.lg,
    },
    receiptHeader: {
        alignItems: 'center',
        gap: 4,
    },
    receiptBrand: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.primaryDark,
        letterSpacing: 2,
    },
    receiptTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    receiptDashedLine: {
        borderTopWidth: 1,
        borderTopColor: Colors.inputLightBorder,
        borderStyle: 'dashed',
        marginVertical: Spacing.four,
    },
    receiptBody: {
        gap: Spacing.two,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    receiptLabel: {
        fontSize: FontSize.xs,
        color: Colors.inputLightPlaceholder,
    },
    receiptVal: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.textDark,
    },
});