/**
 * Binds a clipboard copy event to a trigger element.
 * @param {HTMLElement} trigger - The element that initiates the copy.
 * @param {HTMLElement} source - The element containing the text to copy.
 */
export function bindCopyAction(trigger, source) {
  trigger.addEventListener("click", function () {
    const textToCopy = source.innerText || source.value;

    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = trigger.innerText;
      trigger.innerText = "COPIED!";
      setTimeout(() => (trigger.innerText = originalText), 2000);
    });
  });
}
