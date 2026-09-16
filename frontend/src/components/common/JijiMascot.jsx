import { Mascot } from 'page-mascot';

const JijiMascot = ({ size = 40, className = '' }) => (
    <Mascot
        directions="/mascots/deer-directions.webp"
        reactions="/mascots/deer-reactions.webp"
        size={size}
        label="Jiji AI assistant"
        className={className}
    />
);

export default JijiMascot;
