/**
 * hooks/useKeyboardAwareFocus.js
 * Custom hook to improve input focus handling on Android.
 * Ensures inputs scroll into view when focused on mobile keyboards.
 */

export function useKeyboardAwareFocus(inputRef) {
  const handleFocus = () => {
    if (inputRef?.current) {
      // Scroll the input into view with smooth behavior
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  };

  return { handleFocus };
}
