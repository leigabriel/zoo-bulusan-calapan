import { Mascot } from 'page-mascot';

const DeeraMascot = ({ size = 40, className = '' }) => (
    <Mascot
        directions="/mascots/deer-directions.webp"
        reactions="/mascots/deer-reactions.webp"
        size={size}
        label="Deera AI assistant"
        className={className}
    />
);

export default DeeraMascot;
