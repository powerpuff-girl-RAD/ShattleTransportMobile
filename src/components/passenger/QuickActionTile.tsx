import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

interface Props {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
}

/**
 * Square quick-action tile used on the passenger home screen.
 * Matches the "Buy a token", "My tickets", "Show QR" tiles in the Figma design.
 */
export function QuickActionTile({ icon, label, onPress }: Props) {
    return (
        <Pressable
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <View style={styles.iconWrapper}>{icon}</View>
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    tile: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        paddingVertical: Spacing.four,
        gap: Spacing.two,
        ...Shadow.sm,
    },
    tilePressed: {
        opacity: 0.7,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.textDark,
        textAlign: 'center',
    },
});

