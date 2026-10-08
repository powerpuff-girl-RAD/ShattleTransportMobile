import { StyleSheet, View } from 'react-native';

import type { InspectionResult } from '@/api/inspectorApi';
import { Icon, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface Props {
    result: InspectionResult;
    /** Short line under VALID / INVALID, e.g. the violation type. */
    caption?: string | null;
    size?: 'large' | 'small';
}

/** Big green tick / red cross with VALID or INVALID — the visual feedback of a scan. */
export function ResultBadge({ result, caption, size = 'large' }: Props) {
    const isValid = result === 'Valid';
    const circle = size === 'large' ? 112 : 72;
    const color = isValid ? Colors.primaryDark : Colors.error;

    return (
        <View style={styles.wrap}>
            <View
                style={[
                    styles.circle,
                    { width: circle, height: circle, borderRadius: circle / 2, backgroundColor: isValid ? Colors.successTint : Colors.errorTint },
                ]}
            >
                <Icon name={isValid ? 'check' : 'cross'} color={color} size={circle * 0.6} />
            </View>
            <Text style={[styles.result, { color }, size === 'small' && styles.resultSmall]}>
                {isValid ? 'Valid' : 'Invalid'}
            </Text>
            {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', gap: Spacing.two },
    circle: { alignItems: 'center', justifyContent: 'center' },
    result: {
        fontSize: FontSize['2xl'], fontWeight: FontWeight.black,
        textTransform: 'uppercase', letterSpacing: 2,
    },
    resultSmall: { fontSize: FontSize.lg },
    caption: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textDark, textAlign: 'center' },
});
