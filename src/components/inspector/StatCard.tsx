import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

interface Props {
    value: number | string;
    label: string;
    valueColor?: string;
}

/** Compact KPI tile — "47 INSPECTIONS", "39 VALID", "8 VIOLATIONS". */
export function StatCard({ value, label, valueColor = Colors.textDark }: Props) {
    return (
        <View style={styles.card}>
            <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        paddingVertical: Spacing.four,
        alignItems: 'center',
        gap: 2,
        ...Shadow.sm,
    },
    value: { fontSize: FontSize.xl, lineHeight: FontSize.xl * 1.3, fontWeight: FontWeight.bold },
    label: {
        fontSize: FontSize.xs - 1,
        fontWeight: FontWeight.semibold,
        color: Colors.textDarkSecondary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
