import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ArchivedReservations = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/reservation-history', { state: { showArchived: true } });
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

export default ArchivedReservations;