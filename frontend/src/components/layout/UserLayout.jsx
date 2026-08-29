import Header from '../Header';
import Footer from '../Footer';
import AIChatAssistant from '../features/ai-assistant/AIChatAssistant';

const UserLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
            <AIChatAssistant />
        </div>
    );
};

export default UserLayout;