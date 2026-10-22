import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

export type PillTone = 'success' | 'error' | 'orange' | 'neutral';

const TONES: Record<PillTone, { bg: string; fg: string }> = {
    success: { bg: Colors.successTint, fg: Colors.primaryDark },
    error: { bg: Colors.errorTint, fg: Colors.error },
    orange: { bg: Colors.orangeTint, fg: Colors.orange },
    neutral: { bg: Colors.surfaceLight, fg: Colors.textDarkSecondary },
};

/** Small uppercase status badge — "ON DUTY", "ACTIVE", "INVALID"… */
export function StatusPill({ label, tone = 'success' }: { label: string; tone?: PillTone }) {
    const { bg, fg } = TONES[tone];
    return (
        <View style={[styles.pill, { backgroundColor: bg }]}>
            <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.two + 2,
        paddingVertical: 3,
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: FontSize.xs - 1,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
