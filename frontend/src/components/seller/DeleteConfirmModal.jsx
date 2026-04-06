import Modal from "../common/Modal";

export default function DeleteConfirmModal({
  isOpen,
  fruitName,
  onClose,
  onConfirm,
}) {
  return (
    <Modal isOpen={isOpen} title="Confirm deletion" onClose={onClose}>
      <p style={{ marginBottom: "20px" }}>
        Are you sure you want to delete{" "}
        <strong>{fruitName || "this fruit"}</strong>?
      </p>

      <div className="button-group">
        <button
          type="button"
          className="button-secondary"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          className="button-danger"
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
        >
          Confirm delete
        </button>
      </div>
    </Modal>
  );
}