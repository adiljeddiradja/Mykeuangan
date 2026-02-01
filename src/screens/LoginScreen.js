
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SPACING, SHADOWS } from '../constants/theme';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Eits!', 'Email dan Password harus diisi.');
            return;
        }

        setLoading(true);
        try {
            if (isRegistering) {
                // Register
                await createUserWithEmailAndPassword(auth, email, password);
                Alert.alert('Berhasil!', 'Akun Anda berhasil dibuat. Silakan login.');
                setIsRegistering(false); // Switch back to login
            } else {
                // Login
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log('Logged in with:', user.email);
                // Navigation will be handled by Auth Listener in App.js or manually
                navigation.replace('Main'); // For now direct replace
            }
        } catch (error) {
            console.error(error);
            let msg = 'Terjadi kesalahan.';
            if (error.code === 'auth/invalid-email') msg = 'Email tidak valid.';
            if (error.code === 'auth/user-not-found') msg = 'Akun tidak ditemukan. Daftar dulu?';
            if (error.code === 'auth/wrong-password') msg = 'Password salah.';
            if (error.code === 'auth/email-already-in-use') msg = 'Email sudah terdaftar.';
            if (error.code === 'auth/weak-password') msg = 'Password terlalu lemah (min 6 karakter).';

            Alert.alert('Gagal', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Ionicons name="wallet" size={80} color={COLORS.primary} />
                        <Text style={styles.title}>MyKeuangan</Text>
                        <Text style={styles.subtitle}>{isRegistering ? 'Buat Akun Baru' : 'Masuk ke Akun Anda'}</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="contoh@email.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="******"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Loading...' : (isRegistering ? 'Daftar Sekarang' : 'Masuk')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.switchButton}
                            onPress={() => setIsRegistering(!isRegistering)}
                        >
                            <Text style={styles.switchText}>
                                {isRegistering ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={() => navigation.replace('Main')}
                        >
                            <Text style={styles.skipText}>Lewati (Mode Offline)</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.l,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: SPACING.m,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    form: {
        backgroundColor: COLORS.surface,
        padding: SPACING.l,
        borderRadius: SIZES.radius,
        ...SHADOWS.medium,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        color: COLORS.text,
    },
    input: {
        backgroundColor: COLORS.background,
        padding: SPACING.m,
        borderRadius: SIZES.radius,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.gray,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        marginTop: SPACING.s,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchButton: {
        marginTop: SPACING.m,
        alignItems: 'center',
    },
    switchText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    skipButton: {
        marginTop: SPACING.l,
        alignItems: 'center',
    },
    skipText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textDecorationLine: 'underline',
    }
});
