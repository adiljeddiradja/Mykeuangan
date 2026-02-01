
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING, SHADOWS } from '../constants/theme';
import { getTransactions, deleteTransaction } from '../utils/database';

const formatCurrency = (amount) => {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function HistoryScreen() {
    const [transactions, setTransactions] = useState([]);

    const loadData = async () => {
        const txs = await getTransactions();
        setTransactions(txs);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleDelete = async (id) => {
        // In real app, show confirmation alert first
        await deleteTransaction(id);
        loadData();
    };

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View style={[styles.catIcon, { backgroundColor: item.type === 'INCOME' ? COLORS.income : COLORS.expense }]}>
                <Ionicons
                    name={item.type === 'INCOME' ? 'wallet-outline' : 'cart-outline'}
                    size={20}
                    color="#FFF"
                />
            </View>
            <View style={styles.details}>
                <Text style={styles.category}>{item.note || item.category_name}</Text>
                <Text style={styles.date}>{item.date} • {item.category_name} • {item.account_name}</Text>
            </View>
            <View style={styles.rightSide}>
                <Text style={[styles.amount, { color: item.type === 'INCOME' ? COLORS.income : COLORS.expense }]}>
                    {item.type === 'INCOME' ? '+' : '-'} {formatCurrency(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} style={{ marginTop: 4, textAlign: 'right' }} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Riwayat Transaksi</Text>
            </View>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.empty}>Belum ada data history.</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        ...SHADOWS.light,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    listContent: {
        padding: SPACING.m,
        paddingBottom: 100,
        gap: SPACING.m,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: SIZES.radius,
        ...SHADOWS.light,
    },
    catIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    details: {
        flex: 1,
    },
    category: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    date: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    rightSide: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        color: COLORS.textSecondary,
    },
});
