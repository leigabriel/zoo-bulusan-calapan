import PolicyPage from './PolicyPage';
import { PRIVACY_POLICY_CONTENT } from './policyContent';

const PrivacyPolicy = () => (
    <PolicyPage
        title="Privacy Policy"
        lastUpdated="Last Updated: December 15, 2025"
        content={PRIVACY_POLICY_CONTENT}
    />
);

export default PrivacyPolicy;
