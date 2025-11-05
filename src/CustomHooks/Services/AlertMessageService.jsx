import { toast } from "react-toastify";

export const AlertMessageService = (message, type = "info", autoClose = false) => {
  // Set default toast options based on type
  const toastOptions = {
    autoClose: autoClose ? 3000 : false,
    closeOnClick: autoClose,
    draggable: autoClose,
    hideProgressBar: !autoClose, // Show progress bar only when autoClose is true
    progress: undefined,
  };

  let toastType = toast.info;

  if (type === "success") {
    toastType = toast.success;
  } else if (type === "error") {
    toastType = toast.error;
  } else if (type === "warning") {
    toastType = toast.warning;
  }

  const id = toastType(message, toastOptions);

  if (!autoClose) {
    let lastEventTime = Date.now();
    let timerSet = false; // Flag to track if the timer has been set

    const handleEvent = () => {
      const currentTime = Date.now();
      if (currentTime - lastEventTime < 1000) {
        return; // Don't close if next event is within 1 second
      }
      lastEventTime = currentTime; // Update last event time

      if (!timerSet) { // Check if the timer has already been set
        timerSet = true; // Set the flag to true
        window.removeEventListener("keydown", handleEvent);
        window.removeEventListener("mousemove", handleEvent);

        // Update toast with progress bar when closing
        toast.update(id, {
          hideProgressBar: false,
          autoClose: 2000,
          closeOnClick: true,
          draggable: true,
        });
      }
    };

    window.addEventListener("click", handleEvent);
    window.addEventListener("keydown", handleEvent);
    window.addEventListener("mousemove", handleEvent);
  }
};

// Wrapper functions for different toast types
export const success = (message, autoClose = false) => AlertMessageService(message, "success", autoClose);
export const error = (message, autoClose = false) => AlertMessageService(message, "error", autoClose);
export const info = (message, autoClose = false) => AlertMessageService(message, "info", autoClose);
export const warning = (message, autoClose = false) => AlertMessageService(message, "warning", autoClose);
