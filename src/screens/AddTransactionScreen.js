
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SPACING } from '../constants/theme';
import { addTransaction, getCategories, getAccounts } from '../utils/database';

export default function AddTransactionScreen() {
    const navigation = useNavigation();
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('EXPENSE'); // 'EXPENSE' or 'INCOME'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [note, setNote] = useState('');

    // Data from DB
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        loadData();
    }, [type]); // Reload categories when type changes

    const loadData = async () => {
        const cats = await getCategories(type);
        setCategories(cats);

        // Only load accounts once or if empty
        if (accounts.length === 0) {
            const accs = await getAccounts();
            setAccounts(accs);
            if (accs.length > 0) setSelectedAccount(accs[0]);
        }
    };

    const handleSave = async () => {
        if (!amount || !selectedCategory || !selectedAccount) {
            Alert.alert('Eits!', 'Isi nominal, kategori, dan dompet dulu.');
            return;
        }

        try {
            await addTransaction({
                amount: parseFloat(amount),
                type,
                categoryId: selectedCategory.id,
                categoryName: selectedCategory.name,
                categoryIcon: selectedCategory.icon,
                accountId: selectedAccount.id,
                note,
                date: new Date().toISOString().split('T')[0]
            });
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Gagal menyimpan transaksi.');
            console.error(error);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Amount Input */}
                <View style={styles.amountContainer}>
                    <Text style={styles.currencyPrefix}>Rp</Text>
                    <TextInput
                        style={[styles.amountInput, { color: type === 'EXPENSE' ? COLORS.expense : COLORS.income }]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        placeholderTextColor={COLORS.gray}
                        autoFocus
                    />
                </View>

                {/* Type Switcher */}
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeButton, type === 'EXPENSE' && { backgroundColor: COLORS.expense }]}
                        onPress={() => { setType('EXPENSE'); setSelectedCategory(null); }}
                    >
                        <Text style={[styles.typeText, type === 'EXPENSE' && styles.activeTypeText]}>Pengeluaran</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, type === 'INCOME' && { backgroundColor: COLORS.income }]}
                        onPress={() => { setType('INCOME'); setSelectedCategory(null); }}
                    >
                        <Text style={[styles.typeText, type === 'INCOME' && styles.activeTypeText]}>Pemasukan</Text>
                    </TouchableOpacity>
                </View>

                {/* Account Selection (Source) */}
                <Text style={styles.sectionTitle}>Sumber Dana (Dompet)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
                    {accounts.map((acc) => (
                        <TouchableOpacity
                            key={acc.id}
                            style={[
                                styles.accountItem,
                                selectedAccount?.id === acc.id && { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' }
                            ]}
                            onPress={() => setSelectedAccount(acc)}
                        >
                            <Ionicons name={acc.icon || 'wallet'} size={20} color={selectedAccount?.id === acc.id ? COLORS.primary : COLORS.textSecondary} />
                            <Text style={[
                                styles.accountText,
                                selectedAccount?.id === acc.id && { color: COLORS.primary, fontWeight: 'bold' }
                            ]}>{acc.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Categories Grid */}
                <Text style={styles.sectionTitle}>Pilih Kategori</Text>
                <View style={styles.grid}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.catItem,
                                selectedCategory?.id === cat.id && { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Ionicons
                                name={cat.icon}
                                size={24}
                                color={selectedCategory?.id === cat.id ? COLORS.primary : COLORS.textSecondary}
                            />
                            <Text style={[
                                styles.catText,
                                selectedCategory?.id === cat.id && { color: COLORS.primary, fontWeight: 'bold' }
                            ]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Note (Optional) */}
                <TextInput
                    style={styles.noteInput}
                    placeholder="Catatan (Opsional)"
                    value={note}
                    onChangeText={setNote}
                />

                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Simpan</Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    scrollContent: {
        padding: SPACING.m,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: SPACING.l, // Reduced slightly
    },
    currencyPrefix: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
        marginRight: SPACING.s,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: 'bold',
        minWidth: 100,
        textAlign: 'center',
    },
    typeContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: SIZES.radius,
        padding: 4,
        marginBottom: SPACING.l,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: SIZES.radius - 4,
    },
    typeText: {
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    activeTypeText: {
        color: '#FFF',
    },
    sectionTitle: {
        fontSize: 14, // Smaller
        fontWeight: 'bold',
        marginBottom: SPACING.s,
        color: COLORS.textSecondary,
        marginTop: SPACING.s,
    },
    accountScroll: {
        marginBottom: SPACING.l,
        flexGrow: 0,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.m,
        backgroundColor: COLORS.background,
        borderRadius: SIZES.radius,
        marginRight: SPACING.s,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    accountText: {
        marginLeft: SPACING.s,
        color: COLORS.text,
        fontSize: 14,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.m,
        marginBottom: SPACING.l,
    },
    catItem: {
        width: '22%',
        aspectRatio: 1,
        backgroundColor: COLORS.background,
        borderRadius: SIZES.radius,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    catText: {
        fontSize: 10,
        marginTop: SPACING.xs,
        color: COLORS.textSecondary,
    },
    noteInput: {
        backgroundColor: COLORS.background,
        borderRadius: SIZES.radius,
        padding: SPACING.m,
        fontSize: 16,
        marginBottom: SPACING.l,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: SIZES.radius,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
