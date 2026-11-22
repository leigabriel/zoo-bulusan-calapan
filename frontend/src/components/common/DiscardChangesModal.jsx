import ConfirmationModal from './ConfirmationModal';

/**
 * Confirmation shown when an edit form is closed with unsaved values.
 * `subject` names what is about to be lost, e.g. "animal changes".
 */
const DiscardChangesModal = ({ isOpen, subject = 'changes', onDiscard, onKeepEditing }) => (
    <ConfirmationModal
        isOpen={isOpen}
        title="Discard changes?"
        message={`Are you sure you want to discard your unsaved ${subject}? This cannot be undone.`}
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        danger
        onConfirm={onDiscard}
        onClose={onKeepEditing}
    />
);

export default DiscardChangesModal;
