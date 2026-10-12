'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { comboApi } from '@/lib/api';
import { ComboOffer } from '@orchids/shared';
import { useToast } from '@/context/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RefreshCw, Plus } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

function CombosPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const refreshKey = searchParams.get('refresh');
    const { showToast } = useToast();
    const [combos, setCombos] = useState<ComboOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const fetchCombos = useCallback(async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const response = await comboApi.admin.getAll();
            setCombos(response.data || []);
            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCombos();
    }, [fetchCombos, refreshKey]);

    useEffect(() => {
        const handleCustomRefresh = () => fetchCombos(true);
        const handleFocus = () => fetchCombos(true);

        window.addEventListener('admin:refresh-combos', handleCustomRefresh);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('admin:refresh-combos', handleCustomRefresh);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchCombos]);

    const handleToggleActive = async (comboId: string, currentStatus: boolean) => {
        try {
            await comboApi.admin.update(comboId, { active: !currentStatus });
            await fetchCombos(true);
            showToast(`Combo ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        } catch (err: any) {
            showToast(`Failed to update combo: ${err.message}`, 'error');
        }
    };

    const handleDelete = async (comboId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Combo',
            message: 'Are you sure you want to delete this combo?',
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await comboApi.admin.delete(comboId);
                    await fetchCombos(true);
                    showToast('Combo deleted successfully', 'success');
                } catch (err: any) {
                    showToast(`Failed to delete combo: ${err.message}`, 'error');
                }
            }
        });
    };

    const getComboStatus = (combo: ComboOffer) => {
        if (!combo.active) return { label: 'Inactive', color: 'bg-gray-500' };

        const now = new Date();
        const start = new Date(combo.startDate);
        const end = combo.endDate ? new Date(combo.endDate) : null;

        if (start > now) return { label: 'Scheduled', color: 'bg-primary' };
        if (end && end < now) return { label: 'Expired', color: 'bg-red-500' };
        return { label: 'Active', color: 'bg-green-500' };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Combo Offers</h1>
                    <p className="text-gray-600 mt-1">Manage quantity-based combo pricing</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchCombos(true)}
                        disabled={refreshing || loading}
                        className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                        title="Refresh combos"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
                        <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                    {!loading && (
                        <button
                            onClick={() => router.push('/admin/combos/new')}
                            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-sm shadow-primary/20 flex items-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Create New Combo
                        </button>
                    )}
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    Error: {error}
                </div>
            ) : loading ? (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50/50 border-b border-gray-100 h-10 w-full" />
                    {[1, 2, 3, 4].map((i) => (
                        <TableRowSkeleton key={i} columns={6} />
                    ))}
                </div>
            ) : (
                <>
                    {/* Combos List */}
                    {combos.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 text-lg mb-4">No combos created yet</div>
                    <button
                        onClick={() => router.push('/admin/combos/new')}
                        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Create Your First Combo
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Combo Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Offer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dates
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Performance
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combos.map((combo) => {
                                const status = getComboStatus(combo);
                                return (
                                    <tr key={combo.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {combo.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                Buy {combo.minimumQuantity} for ₹{combo.comboPrice}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color} text-white`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{new Date(combo.startDate).toLocaleDateString()}</div>
                                            {combo.endDate && (
                                                <div className="text-xs text-gray-400">
                                                    to {new Date(combo.endDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {combo.usageCount || 0} orders
                                            {combo.totalRevenue && (
                                                <div className="text-xs text-gray-400">
                                                    ₹{combo.totalRevenue.toLocaleString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleToggleActive(combo.id, combo.active)}
                                                className={`${combo.active ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'
                                                    }`}
                                            >
                                                {combo.active ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => router.push(`/admin/combos/${combo.id}`)}
                                                className="text-primary hover:text-primary-dark"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(combo.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    )}
    
    <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
    />
</div>
);
}

export default function CombosPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    {[1, 2, 3, 4].map((i) => (
                        <TableRowSkeleton key={i} columns={6} />
                    ))}
                </div>
            </div>
        }>
            <CombosPageContent />
        </Suspense>
    );
}

