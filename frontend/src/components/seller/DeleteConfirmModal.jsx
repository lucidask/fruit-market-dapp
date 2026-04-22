import Modal from "../common/Modal";

export default function DeleteConfirmModal({
  isOpen,
  fruitName,
  onClose,
  onConfirm,
  isDeleting,
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
          disabled={isDeleting}
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
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Confirm delete"}
        </button>
      </div>
    </Modal>
  );
}
