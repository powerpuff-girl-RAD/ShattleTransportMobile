import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface Props {
    label: string;
    value?: string;
    valueColor?: string;
    /** Custom right-hand content (e.g. a value + StatusPill). */
    children?: React.ReactNode;
}

/** Label-on-the-left / value-on-the-right row used in info cards. */
export function InfoRow({ label, value, valueColor = Colors.textDark, children }: Props) {
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            {children ?? (
                <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
                    {value}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.three,
        paddingVertical: Spacing.one + 2,
    },
    label: { fontSize: FontSize.sm, color: Colors.textDarkSecondary },
    value: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, flexShrink: 1, textAlign: 'right' },
});
