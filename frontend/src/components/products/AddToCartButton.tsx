'use client';

import React, { useState } from 'react';
import type { Product, ProductSize } from '@tntrends/shared';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { Check, ShoppingCart } from 'lucide-react';
import { isProductInStock } from '@/lib/pricingUtils';

interface AddToCartButtonProps {
    product: Product;
    selectedSize: ProductSize | null;
    quantity: number;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
    product,
    selectedSize,
    quantity,
}) => {
    const { addItem } = useCartStore();
    const [addedToCart, setAddedToCart] = useState(false);

    // Compute stock status from stockBySize
    const inStock = isProductInStock(product);

    const handleAddToCart = () => {
        if (!selectedSize) {
            console.warn('Size selection required');
            return;
        }

        const currentStock = product.stockBySize[selectedSize] || 0;
        if (currentStock < quantity) {
            console.warn(`Low stock: Only ${currentStock} items available`);
            return;
        }

        addItem(product, selectedSize, quantity);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    return (
        <Button
            onClick={handleAddToCart}
            disabled={!inStock || !selectedSize}
            className="flex-1 h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            size="lg"
        >
            {addedToCart ? (
                <div className="flex items-center animate-in fade-in slide-in-from-bottom-1">
                    <Check className="w-6 h-6 mr-2" />
                    Added!
                </div>
            ) : (
                <div className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {inStock ? 'Add to Cart' : 'Sold Out'}
                </div>
            )}
        </Button>
    );
};
