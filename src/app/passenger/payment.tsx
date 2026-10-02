import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { usePassenger } from '@/store/passengerStore';
import { useAuth } from '@/store/authStore';

type PaymentMode = 'Debit Card' | 'Credit Card';

export default function PaymentMethodScreen() {
    const { amount } = useLocalSearchParams<{ amount?: string }>();
    const topUpAmount = parseFloat(amount || '1000') || 1000;

    const { user } = useAuth();
    const { profile, topUpWallet } = usePassenger();

    const [paymentMode, setPaymentMode] = useState<PaymentMode>('Debit Card');
    const [cardNumber, setCardNumber]   = useState('4242 4242 4242 4242');
    const [expiry, setExpiry]           = useState('12/28');
    const [cvv, setCvv]                 = useState('123');
    const [cardholderName, setCardholderName] = useState(profile?.fullName || 'Passenger User');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const currentBalance = profile?.account?.balance ?? 0;
    const displayName = profile?.fullName || user?.email || 'Passenger';

    // Format card number with spaces (XXXX XXXX XXXX XXXX)
    const handleCardNumberChange = (text: string) => {
        const clean = text.replace(/[^0-9]/g, '').slice(0, 16);
        const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;
        setCardNumber(formatted);
        setErrorMessage(null);
    };

    // Format expiry date (MM/YY)
    const handleExpiryChange = (text: string) => {
        const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
        if (clean.length >= 3) {
            setExpiry(`${clean.slice(0, 2)}/${clean.slice(2, 4)}`);
        } else {
            setExpiry(clean);
        }
        setErrorMessage(null);
    };

    const handleFillTestCard = () => {
        setCardNumber('4242 4242 4242 4242');
        setExpiry('12/28');
        setCvv('123');
        setCardholderName(profile?.fullName || 'Nethum Dilchitha');
        setErrorMessage(null);
    };

    const handleProceedToPay = useCallback(async () => {
        setErrorMessage(null);

        const cleanCard = cardNumber.replace(/\s+/g, '');
        if (cleanCard.length < 12) {
            setErrorMessage('Please enter a valid 16-digit card number.');
            return;
        }

        if (!cvv || cvv.length < 3) {
            setErrorMessage('Please enter a valid 3-digit CVV.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await topUpWallet({
                amount: topUpAmount,
                paymentMethod: paymentMode,
                cardNumber: cleanCard,
                expiry,
                cvv,
                cardholderName,
            });

            // Redirect to Payment Success screen with transaction details
            router.replace({
                pathname: '/passenger/payment-success',
                params: {
                    transactionRef: res.transaction.transactionRef,
                    amount:         res.transaction.amount.toString(),
                    paymentMethod:  res.transaction.paymentMethod,
                    cardLast4:      res.transaction.cardLast4 || '4242',
                    newBalance:     res.newBalance.toString(),
                    createdAt:      res.transaction.createdAt,
                },
            });
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Payment processing failed.';
            setErrorMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    }, [topUpAmount, paymentMode, cardNumber, expiry, cvv, cardholderName, topUpWallet]);

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* ── Header ──────────────────────────────────────────── */}
                <View style={styles.header}>
                    <Pressable
                        style={styles.backBtn}
                        onPress={() => router.back()}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Text style={styles.backBtnText}>←</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>Choose Payment Method</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Current Balance Summary Card ────────────────── */}
                    <View style={styles.balanceCard}>
                        <View>
                            <Text style={styles.balanceLabel}>CURRENT TRAVEL BALANCE</Text>
                            <Text style={styles.balanceAmount}>
                                LKR {currentBalance.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarInitial}>
                                {(displayName[0] ?? 'P').toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* ── Mode Selection (Cards Only) ─────────────────── */}
                    <Text style={styles.sectionHeading}>SELECT TOP-UP MODE</Text>

                    {/* Debit Card Option */}
                    <Pressable
                        style={[
                            styles.modeCard,
                            paymentMode === 'Debit Card' ? styles.modeCardSelected : undefined,
                        ]}
                        onPress={() => setPaymentMode('Debit Card')}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: paymentMode === 'Debit Card' }}
                    >
                        <View style={styles.modeIconBg}>
                            <Text style={styles.modeIcon}>💳</Text>
                        </View>
                        <View style={styles.modeInfo}>
                            <Text style={styles.modeTitle}>Debit Card</Text>
                            <Text style={styles.modeSubtitle}>Visa / Mastercard instantly processed</Text>
                        </View>
                        <View style={[
                            styles.radioOuter,
                            paymentMode === 'Debit Card' ? styles.radioOuterSelected : undefined,
                        ]}>
                            {paymentMode === 'Debit Card' && <View style={styles.radioInner} />}
                        </View>
                    </Pressable>

                    {/* Credit Card Option */}
                    <Pressable
                        style={[
                            styles.modeCard,
                            paymentMode === 'Credit Card' ? styles.modeCardSelected : undefined,
                        ]}
                        onPress={() => setPaymentMode('Credit Card')}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: paymentMode === 'Credit Card' }}
                    >
                        <View style={styles.modeIconBg}>
                            <Text style={styles.modeIcon}>💳</Text>
                        </View>
                        <View style={styles.modeInfo}>
                            <Text style={styles.modeTitle}>Credit Card</Text>
                            <Text style={styles.modeSubtitle}>Direct secure payment</Text>
                        </View>
                        <View style={[
                            styles.radioOuter,
                            paymentMode === 'Credit Card' ? styles.radioOuterSelected : undefined,
                        ]}>
                            {paymentMode === 'Credit Card' && <View style={styles.radioInner} />}
                        </View>
                    </Pressable>

                    {/* ── Card Details Form ───────────────────────────── */}
                    <View style={styles.cardForm}>
                        <View style={styles.formHeaderRow}>
                            <Text style={styles.formHeading}>Card Details</Text>
                            <Pressable onPress={handleFillTestCard}>
                                <Text style={styles.fillTestLink}>Use Test Card</Text>
                            </Pressable>
                        </View>

                        {errorMessage && (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        )}

                        {/* Card Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CARD NUMBER</Text>
                            <TextInput
                                style={styles.input}
                                value={cardNumber}
                                onChangeText={handleCardNumberChange}
                                placeholder="4242 4242 4242 4242"
                                placeholderTextColor={Colors.inputLightPlaceholder}
                                keyboardType="numeric"
                                maxLength={19}
                            />
                        </View>

                        {/* Expiry & CVV Row */}
                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>EXPIRY (MM/YY)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={expiry}
                                    onChangeText={handleExpiryChange}
                                    placeholder="12/28"
                                    placeholderTextColor={Colors.inputLightPlaceholder}
                                    keyboardType="numeric"
                                    maxLength={5}
                                />
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>CVV</Text>
                                <TextInput
                                    style={styles.input}
                                    value={cvv}
                                    onChangeText={(t) => setCvv(t.replace(/[^0-9]/g, '').slice(0, 4))}
                                    placeholder="123"
                                    placeholderTextColor={Colors.inputLightPlaceholder}
                                    keyboardType="numeric"
                                    secureTextEntry
                                    maxLength={4}
                                />
                            </View>
                        </View>

                        {/* Cardholder Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CARDHOLDER NAME</Text>
                            <TextInput
                                style={styles.input}
                                value={cardholderName}
                                onChangeText={setCardholderName}
                                placeholder="Nethum Dilchitha"
                                placeholderTextColor={Colors.inputLightPlaceholder}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.securityBadge}>
                            <Text style={styles.securityIcon}>🔒</Text>
                            <Text style={styles.securityText}>
                                256-Bit Encrypted Secure Test Payment Gateway
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* ── Sticky Bottom Checkout CTA ───────────────────────── */}
                <View style={styles.footer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Amount to Top-Up</Text>
                        <Text style={styles.summaryAmount}>LKR {topUpAmount.toLocaleString('en-LK')}</Text>
                    </View>

                    {isSubmitting ? (
                        <View style={styles.submittingWrapper}>
                            <ActivityIndicator size="small" color={Colors.orange} />
                            <Text style={styles.submittingText}>Processing Secure Payment...</Text>
                        </View>
                    ) : (
                        <Button
                            label="Proceed to Pay"
                            variant="primary"
                            onPress={handleProceedToPay}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surfaceLight,
    },
    keyboardView: {
        flex: 1,
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
        gap: Spacing.four,
        paddingBottom: Spacing.twelve,
    },
    balanceCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        padding: Spacing.five,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Shadow.sm,
    },
    balanceLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.inputLightLabel,
        letterSpacing: 0.5,
        marginBottom: Spacing.one,
    },
    balanceAmount: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.black,
        color: Colors.orange,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.orange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    sectionHeading: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.inputLightLabel,
        letterSpacing: 1,
        marginTop: Spacing.one,
    },
    modeCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        borderWidth: 1.5,
        borderColor: Colors.inputLightBorder,
        ...Shadow.sm,
    },
    modeCardSelected: {
        borderColor: Colors.orange,
        backgroundColor: '#FFFBF5',
    },
    modeIconBg: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeIcon: {
        fontSize: FontSize.lg,
    },
    modeInfo: {
        flex: 1,
    },
    modeTitle: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
        marginBottom: 2,
    },
    modeSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.textDarkSecondary,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Colors.inputLightPlaceholder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: Colors.orange,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.orange,
    },
    cardForm: {
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        padding: Spacing.five,
        gap: Spacing.three,
        ...Shadow.sm,
    },
    formHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    formHeading: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    fillTestLink: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.orange,
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
    inputGroup: {
        gap: Spacing.one,
    },
    inputRow: {
        flexDirection: 'row',
        gap: Spacing.three,
    },
    inputLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.inputLightLabel,
        letterSpacing: 0.5,
    },
    input: {
        height: 48,
        backgroundColor: Colors.surfaceLight,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.inputLightBorder,
        paddingHorizontal: Spacing.four,
        fontSize: FontSize.base,
        color: Colors.inputLightText,
        fontWeight: FontWeight.medium,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.two,
        marginTop: Spacing.one,
    },
    securityIcon: {
        fontSize: FontSize.xs,
    },
    securityText: {
        fontSize: FontSize.xs,
        color: Colors.inputLightPlaceholder,
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
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: FontSize.sm,
        color: Colors.textDarkSecondary,
        fontWeight: FontWeight.medium,
    },
    summaryAmount: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.orange,
    },
    submittingWrapper: {
        height: 54,
        borderRadius: Radius.full,
        backgroundColor: '#FFF4EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.three,
    },
    submittingText: {
        color: Colors.orange,
        fontWeight: FontWeight.bold,
        fontSize: FontSize.base,
    },
});