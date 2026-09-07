import MessageWorkspace from '../../components/management/MessageWorkspace';
import { messageAPI, adminAPI } from '../../services/api-client';
const adminMessageApi = {
    getMessages: messageAPI.getAllMessages,
    getAppeals: messageAPI.getAppeals,
    markRead: messageAPI.markAsRead,
    markAllRead: messageAPI.markAllAsRead,
    respond: messageAPI.respondToMessage,
    delete: messageAPI.deleteMessage,
    reviewAppeal: adminAPI.reviewAppeal,
    unsuspendUser: adminAPI.unsuspendUser
};

const AdminMessages = ({ globalSearch = '' }) => (
    <MessageWorkspace globalSearch={globalSearch} api={adminMessageApi} roleLabel="an administrator" />
);

export default AdminMessages;
