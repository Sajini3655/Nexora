export function blurActiveElement() {
  if (typeof window === "undefined") return;

  const activeElement = window.document?.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}

export function closeWithBlur(closeAction) {
  blurActiveElement();
  closeAction?.();
}