import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Gradient, Radius, Spacing } from '@/constants/theme';
import type { DigitalToken } from '@/api/tokenApi';

interface Props {
    token: DigitalToken | null;
    onPress: () => void;
}

/**
 * Home-screen card showing the active token summary.
 * Matches the orange→yellow gradient card from the Figma home design.
 */
export function TokenSummaryCard({ token, onPress }: Props) {
    if (!token) {
        return (
            <Pressable style={styles.emptyCard} onPress={onPress}>
                <Text variant="body" style={styles.emptyText}>
                    No active token.{' '}
                </Text>
                <Text variant="body" style={styles.emptyLink}>
                    Tap to activate one →
                </Text>
            </Pressable>
        );
    }

    const isActive = token.status === 'Active';

    return (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="View token details">
            <LinearGradient
                colors={['#E07820', '#F5A623', '#F5CE42']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                {/* ── Top row ─────────────────────────────────── */}
                <View style={styles.topRow}>
                    <View style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>TOKEN</Text>
                    </View>
                    <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
                        <View style={[styles.statusDot, { backgroundColor: isActive ? Colors.success : Colors.error }]} />
                        <Text style={styles.statusText}>{token.status.toUpperCase()}</Text>
                    </View>
                </View>

                {/* ── Token serial ─────────────────────────────── */}
                <Text style={styles.tokenSerial}>#{token.serial}</Text>
                <Text style={styles.tokenType}>{token.type} Token</Text>

                {/* ── Dashed divider ───────────────────────────── */}
                <View style={styles.divider} />

                {/* ── Footer info ──────────────────────────────── */}
                <View style={styles.footer}>
                    <View style={styles.footerItem}>
                        <Text style={styles.footerLabel}>TYPE</Text>
                        <Text style={styles.footerValue}>{token.type}</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Text style={styles.footerLabel}>ACTIVATED</Text>
                        <Text style={styles.footerValue}>
                            {new Date(token.activatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Text style={styles.footerLabel}>TOKEN ID</Text>
                        <Text style={styles.footerValue}>#{token.serial}</Text>
                    </View>
                </View>

                {/* ── CTA ──────────────────────────────────────── */}
                <Text style={styles.cta}>View ticket & QR code →</Text>
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius['2xl'],
        padding: Spacing.five,
        gap: Spacing.two,
    },
    emptyCard: {
        borderRadius: Radius['2xl'],
        borderWidth: 1.5,
        borderColor: Colors.orange,
        borderStyle: 'dashed',
        padding: Spacing.six,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surfaceLight,
        gap: Spacing.one,
    },
    emptyText: {
        color: Colors.textDark,
        fontSize: FontSize.base,
    },
    emptyLink: {
        color: Colors.orange,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.base,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.one,
    },
    routeBadge: {
        backgroundColor: Colors.white,
        borderRadius: Radius.sm,
        paddingHorizontal: Spacing.two,
        paddingVertical: 2,
    },
    routeBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.orange,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.sm,
        paddingHorizontal: Spacing.two,
        paddingVertical: 2,
        gap: 4,
    },
    statusActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
    statusInactive: { backgroundColor: 'rgba(0,0,0,0.15)' },
    statusDot: {
        width: 6, height: 6, borderRadius: 3,
    },
    statusText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    tokenSerial: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.black,
        color: Colors.white,
    },
    tokenType: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.8)',
    },
    divider: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.45)',
        borderStyle: 'dashed',
        marginVertical: Spacing.two,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerItem: { gap: 2 },
    footerLabel: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.65)',
        fontWeight: FontWeight.semibold,
    },
    footerValue: {
        fontSize: FontSize.sm,
        color: Colors.white,
        fontWeight: FontWeight.bold,
    },
    cta: {
        marginTop: Spacing.two,
        color: Colors.white,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
        textDecorationLine: 'underline',
    },
});
