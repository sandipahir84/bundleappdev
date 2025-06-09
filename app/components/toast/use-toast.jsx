import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [toastAction, setToastAction] = useState(null);
  const [toastType, setToastType] = useState("success");

  const hideToast = useCallback(() => {
    setToastActive(false);
    setToastContent("");
    setToastAction(null);
    setToastType("success");
  }, []);

  const showToast = useCallback(({ message, action, status = "success" }) => {
    setToastContent(message);
    setToastAction(() => action); // optional undo or retry action
    setToastType(status); // 'success' | 'warning' | 'critical'
    setToastActive(true);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toastActive,
        toastContent,
        toastAction,
        toastType,
        showToast,
        hideToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export default function useToast() {
  return useContext(ToastContext);
}
