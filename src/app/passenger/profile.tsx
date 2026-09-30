import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
    Alert,
} from 'react-native';

import { Button, Text } from '@/components/ui';
import {
    Colors,
    FontSize,
    FontWeight,
    Radius,
    Shadow,
    Spacing,
} from '@/constants/theme';
import { usePassenger } from '@/store/passengerStore';
import { useAuth } from '@/store/authStore';

type EditMode = 'profile' | 'password' | null;

export default function ProfileScreen() {
    const { user } = useAuth();
    const {
        profile,
        isLoading,
        error,
        loadProfile,
        updateProfile,
        changePassword,
        clearError,
    } = usePassenger();

    const [editMode, setEditMode] = useState<EditMode>(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [nic, setNic] = useState('');
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [localSuccess, setLocalSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    // Seed form fields from loaded profile
    useEffect(() => {
        if (profile) {
            setFullName(profile.fullName ?? '');
            setPhone(profile.phone ?? '');
            setAddress(profile.address ?? '');
            setNic(profile.nic ?? '');
        }
    }, [profile]);

    const handleSaveProfile = useCallback(async () => {
        clearError();
        setLocalSuccess(null);
        try {
            await updateProfile({ fullName, phone, address, nic });
            setLocalSuccess('Profile updated successfully.');
            setEditMode(null);
        } catch {
            // error in store
        }
    }, [fullName, phone, address, nic]);

    const handleChangePassword = useCallback(async () => {
        clearError();
        setLocalSuccess(null);
        if (newPwd !== confirmPwd) {
            Alert.alert('Passwords do not match', 'Please make sure both new passwords are the same.');
            return;
        }
        try {
            await changePassword(currentPwd, newPwd);
            setLocalSuccess('Password changed successfully.');
            setEditMode(null);
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        } catch {
            // error in store
        }
    }, [currentPwd, newPwd, confirmPwd]);

    if (isLoading && !profile) {
        return (
            <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.orange} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarInitial}>
                        {(profile?.fullName?.[0] ?? user?.email?.[0] ?? 'P').toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.headerName}>{profile?.fullName ?? user?.email}</Text>
                <View style={styles.balancePill}>
                    <Text style={styles.balanceText}>
                        LKR {(profile?.account.balance ?? 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Success banner ───────────────────────────────────── */}
                {localSuccess && (
                    <View style={styles.successBanner}>
                        <Text style={styles.successText}>✓  {localSuccess}</Text>
                    </View>
                )}

                {/* ── Error banner ─────────────────────────────────────── */}
                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* ── Account details card ─────────────────────────────── */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Contact Details</Text>
                        {editMode !== 'profile' && (
                            <Text style={styles.editLink} onPress={() => { setEditMode('profile'); clearError(); }}>
                                Edit
                            </Text>
                        )}
                    </View>

                    {editMode === 'profile' ? (
                        <>
                            <Field label="Full Name">
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Nethum Dilchitha"
                                    placeholderTextColor={Colors.inputLightPlaceholder}
                                />
                            </Field>
                            <Field label="Phone">
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="+94 77 000 0000"
                                    placeholderTextColor={Colors.inputLightPlaceholder}
                                    keyboardType="phone-pad"
                                />
                            </Field>
                            <Field label="Address">
                                <TextInput
                                    style={[styles.input, styles.inputMultiline]}
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="No. 1, Main St, Colombo"
                                    placeholderTextColor={Colors.inputLightPlaceholder}
                                    multiline
                                />
                            </Field>
                            <Field label="NIC">
                                <TextInput
                                    style={styles.input}
                                    value={nic}
                                    onChangeText={setNic}
                                    placeholder="200012345678"
                                    placeholderTextColor={Colors.inputLightPlaceholder}
                                />
                            </Field>
                            <View style={styles.editActions}>
                                <Button variant="ghost" label="Cancel" onPress={() => setEditMode(null)} />
                                <Button variant="primary" label="Save" onPress={handleSaveProfile} />
                            </View>
                        </>
                    ) : (
                        <>
                            <InfoRow label="Email" value={profile?.email ?? user?.email ?? '—'} />
                            <InfoRow label="Phone" value={profile?.phone ?? '—'} />
                            <InfoRow label="Address" value={profile?.address ?? '—'} />
                            <InfoRow label="NIC" value={profile?.nic ?? '—'} />
                            <InfoRow label="Member since" value={
                                profile?.memberSince
                                    ? new Date(profile.memberSince).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
                                    : '—'
                            } />
                        </>
                    )}
                </View>

                {/* ── Change password card ─────────────────────────────── */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Security</Text>
                        {editMode !== 'password' && (
                            <Text style={styles.editLink} onPress={() => { setEditMode('password'); clearError(); }}>
                                Change Password
                            </Text>
                        )}
                    </View>

                    {editMode === 'password' ? (
                        <>
                            <Field label="Current Password">
                                <TextInput
                                    style={styles.input}
                                    value={currentPwd}
                                    onChangeText={setCurrentPwd}
                                    secureTextEntry
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.inputLightPlaceholder}
                                />
                            </Field>
                            <Field label="New Password">
                                <TextInput
                                    style={styles.input}
                                    value={newPwd}
                                    onChangeText={setNewPwd}
                                    secureTextEntry
                                    placeholder="Min. 8 characters"
                                    placeholderTextColor={Colors.inputLightPlaceholder}
                                />
                            </Field>
                            <Field label="Confirm New Password">
                                <TextInput
                                    style={styles.input}
                                    value={confirmPwd}
                                    onChangeText={setConfirmPwd}
                                    secureTextEntry
                                    placeholder="Repeat new password"
                                    placeholderTextColor={Colors.inputLightPlaceholder}
                                />
                            </Field>
                            <View style={styles.editActions}>
                                <Button variant="ghost" label="Cancel" onPress={() => setEditMode(null)} />
                                {isLoading
                                    ? <ActivityIndicator color={Colors.orange} />
                                    : <Button variant="primary" label="Update" onPress={handleChangePassword} />
                                }
                            </View>
                        </>
                    ) : (
                        <InfoRow label="Password" value="••••••••" />
                    )}
                </View>

                {/* ── Role & Account ───────────────────────────────────── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Account</Text>
                    <InfoRow label="Role" value={profile?.role ?? user?.role ?? '—'} />
                    <InfoRow label="Account Status" value={profile?.account.status ?? '—'} />
                    <InfoRow label="Currency" value={profile?.account.currency ?? 'LKR'} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.surfaceLight,
    },
    header: {
        alignItems: 'center',
        backgroundColor: Colors.gradientTop,
        paddingTop: 56,
        paddingBottom: Spacing.seven,
        gap: Spacing.two,
    },
    avatarLarge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.orange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        color: Colors.white,
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
    },
    headerName: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    balancePill: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.one,
    },
    balanceText: {
        color: Colors.white,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.base,
    },
    scroll: {
        padding: Spacing.five,
        gap: Spacing.four,
        paddingBottom: Spacing.twelve,
    },
    successBanner: {
        backgroundColor: '#E6FAF2',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.success,
        padding: Spacing.three,
    },
    successText: {
        color: Colors.primaryDark,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    errorBanner: {
        backgroundColor: '#FFF0F0',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.error,
        padding: Spacing.three,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.sm,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        padding: Spacing.five,
        gap: Spacing.three,
        ...Shadow.sm,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.bold,
        color: Colors.textDark,
    },
    editLink: {
        fontSize: FontSize.sm,
        color: Colors.orange,
        fontWeight: FontWeight.semibold,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    infoLabel: {
        fontSize: FontSize.sm,
        color: Colors.inputLightPlaceholder,
    },
    infoValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.textDark,
        maxWidth: '60%',
        textAlign: 'right',
    },
    field: { gap: Spacing.one },
    fieldLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.inputLightLabel,
    },
    input: {
        height: 48,
        backgroundColor: Colors.surfaceLight,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.inputLightBorder,
        paddingHorizontal: Spacing.three,
        fontSize: FontSize.sm,
        color: Colors.inputLightText,
    },
    inputMultiline: {
        height: 80,
        paddingTop: Spacing.two,
        textAlignVertical: 'top',
    },
    editActions: {
        flexDirection: 'row',
        gap: Spacing.three,
        justifyContent: 'flex-end',
        marginTop: Spacing.one,
    },
});

