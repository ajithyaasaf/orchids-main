'use client';

import { useEffect, useState } from 'react';
import { comboApi } from '@/lib/api';
import { ComboOffer } from '@tntrends/shared';

export default function ComboBadge() {
    const [activeCombos, setActiveCombos] = useState<ComboOffer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveCombos();
    }, []);

    const fetchActiveCombos = async () => {
        try {
            const response = await comboApi.getActiveCombos();
            setActiveCombos(response.data || []);
        } catch (err) {
            console.error('Failed to fetch active combos:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || activeCombos.length === 0) {
        return null;
    }

    // Show the best/most prominent combo
    const bestCombo = activeCombos[0];

    return (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg inline-flex items-center gap-1.5 animate-pulse">
            <span className="text-sm">🎁</span>
            <span>Buy {bestCombo.minimumQuantity} for ₹{bestCombo.comboPrice}</span>
        </div>
    );
}
