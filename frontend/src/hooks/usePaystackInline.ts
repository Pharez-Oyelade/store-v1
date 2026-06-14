import { useEffect, useState } from "react";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export const usePaystackInline = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.PaystackPop) {
      setIsLoaded(true);
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed, though usually we keep it
    };
  }, []);

  const initializePayment = ({ key, email, amount, metadata, onSuccess, onClose }: { key: string, email: string, amount: number, metadata?: any, onSuccess?: (res: any) => void, onClose?: () => void }) => {
    if (!isLoaded || !window.PaystackPop) {
      console.error("Paystack inline script not loaded yet");
      return;
    }

    const handler = window.PaystackPop.setup({
      key,
      email,
      amount,
      metadata,
      callback: (response: any) => {
        if (onSuccess) onSuccess(response);
      },
      onClose: () => {
        if (onClose) onClose();
      },
    });

    handler.openIframe();
  };

  return { initializePayment, isLoaded };
};
