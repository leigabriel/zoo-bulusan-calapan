import PolicyPage from './PolicyPage';
import { COOKIE_POLICY_CONTENT } from './policyContent';

const CookiePolicy = () => (
    <PolicyPage
        title="Cookie Policy"
        lastUpdated="Last Updated: December 15, 2025"
        content={COOKIE_POLICY_CONTENT}
    />
);

export default CookiePolicy;