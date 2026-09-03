import { useNavigate } from 'react-router-dom';
import RoleCompanionAssistant from '../components/features/ai-assistant/RoleCompanionAssistant';

const AIAssist = ({ role }) => {
    const navigate = useNavigate();
    const homePath = role === 'admin' ? '/admin/dashboard' : '/staff/dashboard';

    return (
        <section className="h-full min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <RoleCompanionAssistant role={role} onClose={() => navigate(homePath)} />
        </section>
    );
};

export default AIAssist;
