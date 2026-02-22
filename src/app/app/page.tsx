"use client";

import dynamic from 'next/dynamic';
import StatsPanel from '@/components/StatsPanel';
import BuyPanel from '@/components/BuyPanel';
import PrizeDistribution from '@/components/PrizeDistribution';
import Leaderboard from '@/components/Leaderboard';
import ActivityFeed from '@/components/ActivityFeed';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ReferralLink from '@/components/ReferralLink';

const PlanetMap = dynamic(() => import('@/components/PlanetMap'), { ssr: false });

export default function AppPage() {
    const { isConnected } = useWallet();
    const router = useRouter();

    // Redirect to landing if not connected
    useEffect(() => {
        if (!isConnected) {
            router.push('/');
        }
    }, [isConnected, router]);

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-spin">🌍</div>
                    <div className="text-white/40 text-sm">Redirigiendo...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-3">
            {/* Stats Bar */}
            <StatsPanel />

            {/* Main Grid: Leaderboard | Map | Buy Panel */}
            <div id="map" className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Left Column */}
                <div className="lg:col-span-3 flex flex-col gap-3 order-2 lg:order-1">
                    <Leaderboard />
                    <PrizeDistribution />
                </div>

                {/* Center: The Interactive Map */}
                <div className="lg:col-span-6 order-1 lg:order-2">
                    <PlanetMap />
                </div>

                {/* Right: Buy & Activity */}
                <div className="lg:col-span-3 flex flex-col gap-3 order-3">
                    <BuyPanel />
                    <ReferralLink />
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}
