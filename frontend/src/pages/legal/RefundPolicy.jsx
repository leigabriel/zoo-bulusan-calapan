import PolicyPage from './PolicyPage';
import { REFUND_POLICY_CONTENT } from './policyContent';

const RefundPolicy = () => (
    <PolicyPage
        title="Refund Policy"
        lastUpdated="Last Updated: December 15, 2025"
        content={REFUND_POLICY_CONTENT}
    />
);

export default RefundPolicy;