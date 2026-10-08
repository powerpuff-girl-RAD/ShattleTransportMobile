import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text, type IconName } from '@/components/ui';
import { Colors, FontSize, FontWeight, Gradient, LetterSpacing, Radius, Spacing } from '@/constants/theme';

interface Props {
    title: string;
    subtitle?: string;
    /** Optional round icon button on the right (notifications, filters, export…). */
    action?: { icon: IconName; label: string; onPress: () => void };
    /** Shows a back arrow instead of the shield tile (screens opened from another screen). */
    onBack?: () => void;
}

/**
 * Gradient header used across the inspector screens:
 * shield tile (or back arrow) + uppercase title + subtitle + optional action button.
 */
export function InspectorHeader({ title, subtitle, action, onBack }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={Gradient.brand.colors}
            locations={Gradient.brand.locations}
            start={Gradient.brand.start}
            end={Gradient.brand.end}
            style={[styles.header, { paddingTop: insets.top + Spacing.four }]}
        >
            <View style={styles.left}>
                {onBack ? (
                    <Pressable
                        style={({ pressed }) => [styles.tile, pressed && styles.actionPressed]}
                        onPress={onBack}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Icon name="back" color={Colors.white} size={22} />
                    </Pressable>
                ) : (
                    <View style={styles.tile}>
                        <Icon name="shield" color={Colors.white} size={24} />
                    </View>
                )}
                <View style={styles.titles}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
            </View>

            {action ? (
                <Pressable
                    style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                    onPress={action.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                >
                    <Icon name={action.icon} color={Colors.white} size={20} />
                </Pressable>
            ) : null}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.five,
        paddingBottom: Spacing.five,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1 },
    tile: {
        width: 44, height: 44, borderRadius: Radius.md,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center', justifyContent: 'center',
    },
    titles: { flex: 1 },
    title: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.black,
        color: Colors.white,
        letterSpacing: LetterSpacing.normal,
        textTransform: 'uppercase',
    },
    subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    action: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center', justifyContent: 'center',
    },
    actionPressed: { opacity: 0.7 },
});
