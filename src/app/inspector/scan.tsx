import { StyleSheet, View } from 'react-native';

import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { Text } from '@/components/ui';
import { Colors, FontSize, Spacing } from '@/constants/theme';

/** Scan Passenger Token — placeholder until step 2 (camera + manual entry). */
export default function ScanScreen() {
    return (
        <View style={styles.root}>
            <InspectorHeader title="Scan Passenger Token" />
            <Text style={styles.text}>QR scanner coming in step 2.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    text: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.six },
});
