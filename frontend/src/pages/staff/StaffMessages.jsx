import MessageWorkspace from '../../components/management/MessageWorkspace';
import { staffAPI } from '../../services/api-client';

const staffMessageApi = {
    getAppeals: staffAPI.getAppeals,
    reviewAppeal: staffAPI.reviewAppeal,
    unsuspendUser: staffAPI.unsuspendUser
};

const StaffMessages = ({ globalSearch = '' }) => (
    <MessageWorkspace globalSearch={globalSearch} api={staffMessageApi} role="staff" roleLabel="a staff member" />
);

export default StaffMessages;
