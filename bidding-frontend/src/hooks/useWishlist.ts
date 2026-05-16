import { useState, useEffect } from 'react';
import api from '@/lib/api';

export const useWishlist = () => {
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWishlist = async () => {
        try {
            const res = await api.get('/profile/wishlist');
            // Assuming the backend returns an array of car objects, we extract IDs
            setWishlist(res.data.map((car: any) => car._id || car.id));
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    };

    const toggleWishlist = async (carId: string) => {
        const user = localStorage.getItem('user');
        if (!user) {
            window.location.href = '/login';
            return;
        }

        try {
            const res = await api.post(`/profile/wishlist/${carId}`);
            // Update local state with the new wishlist IDs
            setWishlist(res.data.map((id: any) => id.toString()));
        } catch (error) {
            console.error('Error toggling wishlist:', error);
        }
    };

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            fetchWishlist();
        }
    }, []);

    return { wishlist, toggleWishlist, fetchWishlist };
};
