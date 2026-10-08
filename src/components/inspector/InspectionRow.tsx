import { Pressable, StyleSheet, View } from 'react-native';

import type { Inspection } from '@/api/inspectorApi';
import { Icon, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { timeAgo } from '@/utils/formatTime';

interface Props {
    inspection: Inspection;
    onPress?: () => void;
}

/**
 * One inspection in a list: result icon, token serial, route and relative time.
 * Shared by the dashboard's "Recent Inspections" and the History screen.
 */
export function InspectionRow({ inspection, onPress }: Props) {
    const isValid = inspection.result === 'Valid';

    return (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityLabel={`${inspection.tokenSerial}, ${inspection.result}`}
        >
            <View style={[styles.iconBox, { backgroundColor: isValid ? Colors.successTint : Colors.errorTint }]}>
                <Icon
                    name={isValid ? 'check' : 'cross'}
                    color={isValid ? Colors.primaryDark : Colors.error}
                    size={22}
                />
            </View>

            <View style={styles.body}>
                <Text style={styles.serial}>#{inspection.tokenSerial}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                    R-{inspection.routeNumber} {inspection.routeName} · {timeAgo(inspection.inspectedAt)}
                </Text>
            </View>

            {onPress ? <Icon name="chevronRight" color={Colors.inputLightPlaceholder} size={18} /> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.three,
        ...Shadow.sm,
    },
    pressed: { opacity: 0.7 },
    iconBox: {
        width: 40, height: 40, borderRadius: Radius.sm,
        alignItems: 'center', justifyContent: 'center',
    },
    body: { flex: 1 },
    serial: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textDark },
    meta: { fontSize: FontSize.xs, color: Colors.textDarkSecondary, marginTop: 2 },
});
