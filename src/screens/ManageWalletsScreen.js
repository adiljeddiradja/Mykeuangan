
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING, SHADOWS } from '../constants/theme';
import { getAccounts, addAccount, deleteAccount } from '../utils/database';

const AVAILABLE_ICONS = [
    'wallet', 'card', 'cash', 'business',
    'home', 'briefcase', 'piggy-bank', 'stats-chart',
    'logo-bitcoin', 'phone-portrait', 'cart', 'gift'
];

export default function ManageWalletsScreen() {
    const navigation = useNavigation();
    const [accounts, setAccounts] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState('BANK');
    const [icon, setIcon] = useState('card');
    const [balance, setBalance] = useState('');

    const loadData = async () => {
        const data = await getAccounts();
        setAccounts(data);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleAdd = async () => {
        if (!name) {
            Alert.alert('Eits!', 'Nama dompet harus diisi.');
            return;
        }

        try {
            await addAccount({
                name,
                type,
                icon,
                initialBalance: parseFloat(balance) || 0
            });
            setModalVisible(false);
            resetForm();
            loadData();
        } catch (error) {
            Alert.alert('Error', 'Gagal menambah dompet.');
        }
    };

    const handleDelete = async (id) => {
        Alert.alert(
            "Hapus Dompet?",
            "Ini akan menghapus dompet dari list (transaksi tetap ada tapi tanpa nama dompet).",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus", style: "destructive", onPress: async () => {
                        await deleteAccount(id);
                        loadData();
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setName('');
        setType('BANK');
        setIcon('card');
        setBalance('');
    };

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={24} color={COLORS.primary} />
            </View>
            <View style={styles.details}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.type}>{item.type}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: SPACING.m }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Atur Dompet</Text>
            </View>

            <FlatList
                data={accounts}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Add Wallet Modal */}
            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Tambah Dompet Baru</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nama Dompet (contoh: Bank Jago)"
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Saldo Awal (Opsional)"
                            keyboardType="numeric"
                            value={balance}
                            onChangeText={setBalance}
                        />

                        <Text style={styles.label}>Pilih Ikon:</Text>
                        <View style={styles.iconGrid}>
                            {AVAILABLE_ICONS.map(ic => (
                                <TouchableOpacity
                                    key={ic}
                                    style={[styles.iconItem, icon === ic && styles.selectedIcon]}
                                    onPress={() => setIcon(ic)}
                                >
                                    <Ionicons name={ic} size={24} color={icon === ic ? '#FFF' : COLORS.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAdd} style={styles.saveBtn}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Simpan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.m, backgroundColor: COLORS.surface },
    title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    list: { padding: SPACING.m },
    item: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
        padding: SPACING.m, marginBottom: SPACING.s, borderRadius: SIZES.radius
    },
    iconCircle: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF',
        justifyContent: 'center', alignItems: 'center', marginRight: SPACING.m
    },
    details: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    type: { fontSize: 12, color: COLORS.textSecondary },
    fab: {
        position: 'absolute', bottom: 24, right: 24,
        width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary,
        justifyContent: 'center', alignItems: 'center', elevation: 5
    },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.m
    },
    modalContent: {
        backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SPACING.l
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.m, textAlign: 'center' },
    input: {
        backgroundColor: COLORS.background, padding: SPACING.m, borderRadius: SIZES.radius, marginBottom: SPACING.m
    },
    label: { marginBottom: SPACING.s, fontWeight: '600' },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.l, justifyContent: 'center' },
    iconItem: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background,
        justifyContent: 'center', alignItems: 'center'
    },
    selectedIcon: { backgroundColor: COLORS.primary },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.m },
    cancelBtn: { padding: SPACING.m },
    saveBtn: { backgroundColor: COLORS.primary, padding: SPACING.m, borderRadius: SIZES.radius }
});
