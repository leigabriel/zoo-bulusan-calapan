import MessageWorkspace from '../../components/management/MessageWorkspace';
import { messageAPI } from '../../services/api-client';
const adminMessageApi = {
    getMessages: messageAPI.getAllMessages,
    getAppeals: messageAPI.getAppeals,
    markRead: messageAPI.markAsRead,
    markAllRead: messageAPI.markAllAsRead,
    respond: messageAPI.respondToMessage,
    delete: messageAPI.deleteMessage
};

const AdminMessages = ({ globalSearch = '' }) => (
    <MessageWorkspace globalSearch={globalSearch} api={adminMessageApi} roleLabel="an administrator" />
);

export default AdminMessages;
