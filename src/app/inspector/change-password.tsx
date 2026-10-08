import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { changePassword } from '@/api/inspectorApi';
import { Card } from '@/components/inspector/Card';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { Button, Icon, Input, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { messageFrom } from '@/store/inspectorStore';

const MIN_LENGTH = 8;

/** Change Password — the backend checks the current password before saving the new one. */
export default function ChangePasswordScreen() {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    // Never leave passwords sitting in a hidden screen
    useFocusEffect(
        useCallback(() => () => {
            setCurrent(''); setNext(''); setConfirm('');
            setError(null); setDone(false); setShowPasswords(false);
        }, [])
    );

    const goBack = () => router.navigate('/inspector/profile');

    const submit = async () => {
        // Same rules as the backend, checked here first so the user gets instant feedback
        if (!current || !next || !confirm) return setError('Fill in all three fields.');
        if (next.length < MIN_LENGTH) return setError(`New password must be at least ${MIN_LENGTH} characters.`);
        if (next !== confirm) return setError('New passwords do not match.');
        if (next === current) return setError('New password must be different from the current one.');

        setIsSaving(true);
        setError(null);
        try {
            await changePassword(current, next);
            setDone(true);
        } catch (err) {
            setError(messageFrom(err, 'Could not change the password. Please try again.'));
        } finally {
            setIsSaving(false);
        }
    };

    const eye = (
        <Pressable onPress={() => setShowPasswords((s) => !s)} accessibilityRole="button" accessibilityLabel={showPasswords ? 'Hide passwords' : 'Show passwords'}>
            <Icon name={showPasswords ? 'eyeOff' : 'eye'} color={Colors.textDarkSecondary} size={20} />
        </Pressable>
    );

    return (
        <View style={styles.root}>
            <InspectorHeader title="Change Password" onBack={goBack} />

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {done ? (
                        <Card style={styles.doneCard}>
                            <View style={styles.doneIcon}>
                                <Icon name="check" color={Colors.primaryDark} size={44} />
                            </View>
                            <Text style={styles.doneTitle}>Password Updated</Text>
                            <Text style={styles.hint}>Use your new password the next time you log in.</Text>
                            <Button label="Back to Profile" onPress={goBack} style={styles.doneButton} />
                        </Card>
                    ) : (
                        <Card>
                            <View style={styles.form}>
                                <Input
                                    variant="light"
                                    label="Current Password"
                                    value={current}
                                    onChangeText={setCurrent}
                                    secureTextEntry={!showPasswords}
                                    autoCapitalize="none"
                                    rightIcon={eye}
                                />
                                <Input
                                    variant="light"
                                    label="New Password"
                                    value={next}
                                    onChangeText={setNext}
                                    secureTextEntry={!showPasswords}
                                    autoCapitalize="none"
                                />
                                <Input
                                    variant="light"
                                    label="Confirm New Password"
                                    value={confirm}
                                    onChangeText={setConfirm}
                                    secureTextEntry={!showPasswords}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    onSubmitEditing={submit}
                                />
                                <Text style={styles.hint}>At least {MIN_LENGTH} characters.</Text>
                                {error ? <Text style={styles.error}>{error}</Text> : null}
                                <Button label="Update Password" onPress={submit} loading={isSaving} />
                            </View>
                        </Card>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    flex: { flex: 1 },
    scroll: { padding: Spacing.five, paddingBottom: Spacing.twelve },
    form: { gap: Spacing.three },
    hint: { color: Colors.textDarkSecondary, fontSize: FontSize.xs, textAlign: 'center' },
    error: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },

    doneCard: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.six },
    doneIcon: {
        width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.successTint,
        alignItems: 'center', justifyContent: 'center',
    },
    doneTitle: { color: Colors.textDark, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
    doneButton: { alignSelf: 'stretch', marginTop: Spacing.two },
});
