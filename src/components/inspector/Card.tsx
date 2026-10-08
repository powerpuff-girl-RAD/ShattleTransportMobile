import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';

interface Props {
    title?: string;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

/** White rounded card with an optional uppercase title — used on every inspector screen. */
export function Card({ title, children, style }: Props) {
    return (
        <View style={[styles.card, style]}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.four, ...Shadow.sm },
    title: {
        fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textDark,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two,
    },
});
