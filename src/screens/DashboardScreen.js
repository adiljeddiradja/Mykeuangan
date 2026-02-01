
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING, SHADOWS } from '../constants/theme';
import { getSummary, getTransactions, initDB, getAccounts, getMonthlySummary } from '../utils/database';

const formatCurrency = (amount) => {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function DashboardScreen() {
    const navigation = useNavigation();
    const [summary, setSummary] = useState({ income: 0, expense: 0, totalBalance: 0 });
    const [monthlySummary, setMonthlySummary] = useState({ income: 0, expense: 0, surplus: 0 });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            await initDB();
            const sum = await getSummary();
            const mSum = await getMonthlySummary();
            const txs = await getTransactions();
            const accs = await getAccounts();

            setSummary(sum);
            setMonthlySummary(mSum);
            setRecentTransactions(txs.slice(0, 5));
            setAccounts(accs);
        } catch (error) {
            console.error(error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Halo, Boss!</Text>
                    <Text style={styles.subtitle}>Keuanganmu hari ini</Text>
                </View>

                {/* Main Balance Card (Aggregate) */}
                <View style={[styles.card, styles.balanceCard]}>
                    <Text style={styles.balanceLabel}>Total Harta (Net Worth)</Text>
                    <Text style={styles.balanceValue}>{formatCurrency(summary.totalBalance)}</Text>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                <Ionicons name="arrow-down" size={16} color={COLORS.income} />
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>Pemasukan</Text>
                                <Text style={[styles.summaryValue, { color: COLORS.income }]}>{formatCurrency(summary.income)}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryItem}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                <Ionicons name="arrow-up" size={16} color={COLORS.expense} />
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>Pengeluaran</Text>
                                <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{formatCurrency(summary.expense)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Monthly Recap Card */}
                <View style={[styles.card, { backgroundColor: COLORS.surface, marginBottom: SPACING.l }]}>
                    <Text style={styles.sectionTitle}>Rekap Bulan Ini</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.s }}>
                        <View>
                            <Text style={styles.summaryLabel}>Surplus/Defisit</Text>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: monthlySummary.surplus >= 0 ? COLORS.income : COLORS.expense
                            }}>
                                {monthlySummary.surplus >= 0 ? '+' : ''} {formatCurrency(monthlySummary.surplus)}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>Total Keluar</Text>
                            <Text style={{ fontSize: 16, color: COLORS.expense, fontWeight: '600' }}>
                                {formatCurrency(monthlySummary.expense)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Wallets / Accounts Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Dompet Saya</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ManageWallets')}>
                        <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Horizontal Wallet List */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
                    {accounts.map(acc => (
                        <View key={acc.id} style={styles.walletCard}>
                            <View style={styles.walletHeader}>
                                <Ionicons name={acc.icon || 'wallet'} size={24} color={COLORS.primary} />
                                <Text style={styles.walletType}>{acc.type}</Text>
                            </View>
                            <Text style={styles.walletName}>{acc.name}</Text>
                            <Text style={styles.walletBalance}>{formatCurrency(acc.balance)}</Text>
                        </View>
                    ))}
                    {/* Add Wallet Placeholder */}
                    <TouchableOpacity
                        style={[styles.walletCard, styles.addWalletCard]}
                        onPress={() => navigation.navigate('ManageWallets')}
                    >
                        <Ionicons name="add" size={32} color={COLORS.textSecondary} />
                        <Text style={styles.addWalletText}>Tambah</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Recent Transactions Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Terbaru</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('History')}>
                        <Text style={styles.seeAll}>Lihat Semua</Text>
                    </TouchableOpacity>
                </View>

                {/* List */}
                <View style={styles.listContainer}>
                    {recentTransactions.map((item) => (
                        <View key={item.id} style={styles.transactionItem}>
                            <View style={[styles.catIcon, { backgroundColor: item.type === 'INCOME' ? COLORS.income : COLORS.expense }]}>
                                <Ionicons
                                    name={item.type === 'INCOME' ? 'wallet-outline' : 'cart-outline'} // Fallback if icon missing
                                    size={20}
                                    color="#FFF"
                                />
                            </View>
                            <View style={styles.txDetailsWrapper}>
                                <View style={styles.txDetails}>
                                    <Text style={styles.txCategory} numberOfLines={1}>{item.note || item.category_name}</Text>
                                    <View style={styles.txMeta}>
                                        <Text style={styles.txDate}>{item.date}</Text>
                                        <Text style={styles.txAccount} numberOfLines={1} ellipsizeMode="tail"> • {item.account_name}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.txAmount, { color: item.type === 'INCOME' ? COLORS.income : COLORS.expense }]}>
                                    {item.type === 'INCOME' ? '+' : '-'} {formatCurrency(item.amount)}
                                </Text>
                            </View>
                        </View>
                    ))}
                    {recentTransactions.length === 0 && (
                        <Text style={styles.emptyText}>Belum ada transaksi</Text>
                    )}
                </View>

            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddTransaction')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: 130, // Space for FAB + Tabs
    },
    header: {
        marginBottom: SPACING.l,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        padding: SPACING.m,
        ...SHADOWS.medium,
        marginBottom: SPACING.l,
    },
    balanceCard: {
        backgroundColor: COLORS.surface,
    },
    balanceLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.gray,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    seeAll: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    walletScroll: {
        marginBottom: SPACING.l,
        overflow: 'visible',
    },
    walletCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        padding: SPACING.m,
        width: 170, // Increased width to fit larger numbers
        height: 100,
        marginRight: SPACING.m,
        justifyContent: 'space-between',
        ...SHADOWS.light,
    },
    addWalletCard: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6', // Light gray
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: COLORS.textSecondary,
    },
    addWalletText: {
        marginTop: SPACING.xs,
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletType: {
        fontSize: 10,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
    },
    walletName: {
        fontWeight: '600',
        color: COLORS.text,
        fontSize: 14,
    },
    walletBalance: {
        fontWeight: 'bold',
        color: COLORS.primary,
        fontSize: 16,
    },
    listContainer: {
        gap: SPACING.m,
    },
    transactionItem: {
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
    txDetailsWrapper: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    txDetails: {
        flex: 1,
        marginRight: SPACING.s,
    },
    txCategory: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    txMeta: {
        flexDirection: 'row',
    },
    txDate: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    txAccount: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
        flex: 1, // Allow shrinking/truncating
    },
    txAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 80, // Prevent shrinking
        textAlign: 'right',
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        marginTop: SPACING.l,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24, // Or center it
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
        elevation: 8,
        zIndex: 999, // Ensure it's on top
    },
});
