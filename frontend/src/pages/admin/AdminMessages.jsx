import MessageWorkspace from '../../components/management/MessageWorkspace';
import { messageAPI, adminAPI } from '../../services/api-client';
const adminMessageApi = {
    getSupportMessages: messageAPI.getAllMessages,
    markSupportRead: (id) => messageAPI.markAsRead(id, 'admin'),
    markAllSupportRead: () => messageAPI.markAllAsRead('admin'),
    respondToSupport: (id, response) => messageAPI.respondToMessage(id, response, 'admin'),
    deleteSupport: (id) => messageAPI.deleteMessage(id, 'admin'),
    closeSupport: (id) => messageAPI.closeMessageCase(id, 'admin'),
    getAppeals: messageAPI.getAppeals,
    reviewAppeal: adminAPI.reviewAppeal,
    unsuspendUser: adminAPI.unsuspendUser
};

const AdminMessages = ({ globalSearch = '' }) => (
    <MessageWorkspace globalSearch={globalSearch} api={adminMessageApi} role="admin" roleLabel="an administrator" />
);

export default AdminMessages;
