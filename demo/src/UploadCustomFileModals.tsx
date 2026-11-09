import { useEffect, type ReactNode } from "react";

import { createPortal } from "react-dom";

import type { FieldType } from "./types";

type ModalProps = {
  onClose: () => void;
};

const Modal = ({
  onClose,
  children,
}: ModalProps & {
  children: ReactNode;
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          ×
        </button>

        {children}
      </div>
    </div>,
    document.body,
  );
};

export const ErrorModal = ({ onClose }: ModalProps) => (
  <Modal onClose={onClose}>
    <h2>Invalid file</h2>

    <p>
      The uploaded file does not follow the expected{" "}
      <a href="https://en.wikipedia.org/wiki/GRIB" target="_blank">
        GRIB
      </a>{" "}
      format. Please refer to the documentation for the correct structure.
    </p>

    <p>
      For vector variables (wind), the file must include both components of the
      vector.
    </p>
  </Modal>
);

const FIELD_TYPES: FieldType[] = ["wind", "temperature"];

type UploadFileModalProps = ModalProps & {
  onSelect: (value: FieldType) => void;
};

export const UploadFileModal = ({
  onClose,
  onSelect,
}: UploadFileModalProps) => {
  const handleSelect = (value: FieldType) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <p>What variable does this file contain?</p>

      {FIELD_TYPES.map((fieldType) => (
        <button
          key={fieldType}
          className="action-button modal-button"
          onClick={() => handleSelect(fieldType)}
        >
          {fieldType}
        </button>
      ))}
    </Modal>
  );
};
