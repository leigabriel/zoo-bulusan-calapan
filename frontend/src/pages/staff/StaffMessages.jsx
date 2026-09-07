import MessageWorkspace from '../../components/management/MessageWorkspace';
import { staffAPI } from '../../services/api-client';

const staffMessageApi = {
    getMessages: staffAPI.getMessages,
    getAppeals: staffAPI.getAppeals,
    markRead: staffAPI.markMessageRead,
    markAllRead: staffAPI.markAllMessagesRead,
    respond: staffAPI.respondToMessage,
    delete: staffAPI.deleteMessage,
    reviewAppeal: staffAPI.reviewAppeal,
    unsuspendUser: staffAPI.unsuspendUser
};

const StaffMessages = ({ globalSearch = '' }) => (
    <MessageWorkspace globalSearch={globalSearch} api={staffMessageApi} roleLabel="a staff member" />
);

export default StaffMessages;
