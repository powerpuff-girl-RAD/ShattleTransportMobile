import { StyleSheet, View } from 'react-native';

import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { Text } from '@/components/ui';
import { Colors, FontSize, Spacing } from '@/constants/theme';

/** Inspection History — placeholder until step 5 (list, filters, detail). */
export default function HistoryScreen() {
    return (
        <View style={styles.root}>
            <InspectorHeader title="Inspection History" />
            <Text style={styles.text}>Inspection history coming in step 5.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    text: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.six },
});
