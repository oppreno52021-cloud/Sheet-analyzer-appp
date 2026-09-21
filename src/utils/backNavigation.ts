import { useEffect, useRef } from 'react';

type BackHandler = () => boolean; // return true if handled
type VoidHandler = () => void;

interface ModalEntry {
  id: string;
  priority: number;
  onClose: () => void;
}

const modalStack: ModalEntry[] = [];
let globalTabBackHandler: BackHandler | null = null;
let globalExitHandler: VoidHandler | null = null;
let isInitialized = false;

function initGlobalBackListeners() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  window.addEventListener('popstate', (e) => {
    // 1. Check if any modal is open on the stack (highest priority first)
    if (modalStack.length > 0) {
      const topModal = modalStack.pop();
      if (topModal) {
        topModal.onClose();
        return;
      }
    }

    // 2. Check tab back handler (e.g., from 'analyze' to 'home')
    if (globalTabBackHandler) {
      const handled = globalTabBackHandler();
      if (handled) return;
    }

    // 3. Fallback to exit handler (e.g., press back again to exit)
    if (globalExitHandler) {
      globalExitHandler();
    }
  });
}

/**
 * Hook to link a modal with browser/mobile back navigation.
 */
export function useBackModal(
  isOpen: boolean,
  onClose: () => void,
  modalId: string = 'modal',
  priority: number = 20
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    initGlobalBackListeners();

    if (!isOpen) {
      // Remove from stack if closed externally
      const idx = modalStack.findIndex((m) => m.id === modalId);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
      }
      return;
    }

    // Push history state so back button triggers popstate
    try {
      window.history.pushState({ modalId }, '');
    } catch (_) {}

    const entry: ModalEntry = {
      id: modalId,
      priority,
      onClose: () => onCloseRef.current()
    };

    modalStack.push(entry);
    modalStack.sort((a, b) => a.priority - b.priority);

    return () => {
      const idx = modalStack.findIndex((m) => m.id === modalId);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
      }
    };
  }, [isOpen, modalId, priority]);
}

export function setGlobalTabBackHandler(handler: BackHandler | null): void {
  initGlobalBackListeners();
  globalTabBackHandler = handler;
}

export function setGlobalExitHandler(handler: VoidHandler | null): void {
  initGlobalBackListeners();
  globalExitHandler = handler;
}

export function pushNavigationState(tab: string): void {
  try {
    window.history.pushState({ tab }, '');
  } catch (_) {}
}

export function exitApp(): void {
  try {
    window.close();
  } catch (_) {}
}
