import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
    className = '', 
    variant = 'rectangular' 
}) => {
    const baseClass = 'animate-pulse bg-gray-200';
    
    const variantClasses = {
        text: 'h-4 w-full rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-2xl',
    };

    return (
        <div className={`${baseClass} ${variantClasses[variant]} ${className}`} />
    );
};

export const TableRowSkeleton = ({ columns }: { columns: number }) => (
    <div className="flex items-center space-x-4 py-4 px-6 border-b border-gray-50">
        {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className={`flex-1 ${i === 0 ? 'flex-[2]' : ''}`}>
                <Skeleton variant="text" className={i === 0 ? 'w-3/4' : 'w-1/2'} />
            </div>
        ))}
    </div>
);

export const StatCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50 h-32 flex flex-col justify-between">
        <Skeleton variant="text" className="w-24 h-3 mb-2" />
        <Skeleton variant="text" className="w-32 h-8" />
    </div>
);

export const FormSkeleton = () => (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
        <div className="space-y-2">
            <Skeleton variant="text" className="w-1/4 h-8" />
            <Skeleton variant="text" className="w-1/2 h-4" />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                    <Skeleton variant="text" className="w-32 h-4" />
                    <Skeleton variant="rectangular" className="w-full h-12 rounded-xl" />
                </div>
            ))}
            <div className="flex gap-4 pt-4 border-t border-gray-50">
                <Skeleton variant="rectangular" className="flex-1 h-12 rounded-xl" />
                <Skeleton variant="rectangular" className="w-32 h-12 rounded-xl" />
            </div>
        </div>
    </div>
);

export const BoxSkeleton = ({ className = "" }: { className?: string }) => (
    <div className={`bg-white rounded-2xl border border-gray-50 shadow-sm p-6 ${className}`}>
        <Skeleton variant="rectangular" className="w-full h-full rounded-xl" />
    </div>
);
