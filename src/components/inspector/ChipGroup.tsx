import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export interface ChipOption<T> {
    label: string;
    value: T;
}

interface Props<T> {
    options: ChipOption<T>[];
    selected: T;
    onChange: (value: T) => void;
    /** One scrolling row (filters) instead of wrapping onto several lines (forms). */
    scroll?: boolean;
}

/**
 * Single-choice chips. Generic over the value type, so the same component
 * picks a date, a route, a result, a violation type or a stats period.
 */
export function ChipGroup<T extends string | number | null>({ options, selected, onChange, scroll = false }: Props<T>) {
    const chips = options.map((option) => {
        const active = option.value === selected;
        return (
            <Pressable
                key={String(option.value)}
                style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
                onPress={() => onChange(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
            >
                <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
            </Pressable>
        );
    });

    if (scroll) {
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {chips}
            </ScrollView>
        );
    }
    return <View style={[styles.row, styles.wrap]}>{chips}</View>;
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: Spacing.two },
    wrap: { flexWrap: 'wrap' },
    chip: {
        paddingHorizontal: Spacing.three + 2, paddingVertical: Spacing.two,
        borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.inputLightBorder,
        backgroundColor: Colors.white,
    },
    chipActive: { backgroundColor: Colors.gradientTop, borderColor: Colors.gradientTop },
    pressed: { opacity: 0.75 },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textDarkSecondary },
    labelActive: { color: Colors.white },
});
