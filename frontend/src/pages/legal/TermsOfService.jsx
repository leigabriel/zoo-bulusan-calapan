import PolicyPage from './PolicyPage';
import { TERMS_OF_SERVICE_CONTENT } from './policyContent';

const TermsOfService = () => (
    <PolicyPage
        title="Terms of Service"
        lastUpdated="Last Updated: December 15, 2025"
        content={TERMS_OF_SERVICE_CONTENT}
    />
);

export default TermsOfService;
