// // context/ModalContext.tsx
// "use client";

// import { createContext, useContext, useState, ReactNode } from "react";

// interface ModalContextType {
//   isAnyModalOpen: boolean;
//   openModal: () => void;
//   closeModal: () => void;
// }

// const ModalContext = createContext<ModalContextType | undefined>(undefined);

// export function ModalProvider({ children }: { children: ReactNode }) {
//   const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

//   const openModal = () => setIsAnyModalOpen(true);
//   const closeModal = () => setIsAnyModalOpen(false);

//   return (
//     <ModalContext.Provider value={{ isAnyModalOpen, openModal, closeModal }}>
//       {children}
//     </ModalContext.Provider>
//   );
// }

// export function useModal() {
//   const context = useContext(ModalContext);
//   if (!context) {
//     throw new Error("useModal must be used within ModalProvider");
//   }
//   return context;
// }

// context/ModalContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  content?: ReactNode;
}

interface ModalContextType {
  openModal: (props: { title?: string; content: ReactNode }) => void;
  closeModal: () => void;
  isModalOpen: boolean;
  modalContent: ReactNode | null;
  modalTitle?: string;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);

  // const openModal = ({ title, content }: { title?: string; content: ReactNode }) => {
  //   setModalTitle(title);
  //   setModalContent(content);
  //   setIsModalOpen(true);
  // };

  // context/ModalContext.tsx
const openModal = ({ title, content }: { title?: string; content?: ReactNode } = {}) => {
  if (!content) {
    console.warn("openModal called without content");
    return;
  }

  setModalTitle(title);
  setModalContent(content);
  setIsModalOpen(true);
};

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setModalTitle(undefined);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isModalOpen, modalContent, modalTitle }}>
      {children}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full p-6">
            {modalTitle && <h2 className="text-xl font-semibold mb-4">{modalTitle}</h2>}
            {modalContent}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};
