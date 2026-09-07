import MessageWorkspace from '../../components/management/MessageWorkspace';
import { messageAPI, adminAPI } from '../../services/api-client';
const adminMessageApi = {
    getAppeals: messageAPI.getAppeals,
    reviewAppeal: adminAPI.reviewAppeal,
    unsuspendUser: adminAPI.unsuspendUser
};

const AdminMessages = ({ globalSearch = '' }) => (
    <MessageWorkspace globalSearch={globalSearch} api={adminMessageApi} role="admin" roleLabel="an administrator" />
);

export default AdminMessages;
