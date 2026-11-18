import { useEffect, useState } from "react";

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

export const usePaystackInline = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.PaystackPop) {
      setIsLoaded(true);
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(
      'script[src*="paystack.co/v1/inline.js"]'
    );
    if (!script) {
      script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const onLoad = () => setIsLoaded(true);
    script.addEventListener("load", onLoad, { once: true });

    const timer = setTimeout(() => {
      if (window.PaystackPop) setIsLoaded(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      script?.removeEventListener("load", onLoad);
    };
  }, []);

  const initializePayment = ({
    key,
    email,
    amount,
    ref,
    metadata,
    onSuccess,
    onClose,
  }: {
    key: string;
    email: string;
    amount: number;
    ref?: string;
    metadata?: any;
    onSuccess?: (res: any) => void;
    onClose?: () => void;
  }) => {
    if (typeof window === "undefined" || !window.PaystackPop) {
      console.error("Paystack inline script not loaded yet");
      if (onClose) onClose();
      return;
    }

    const config: any = {
      key,
      email,
      amount: Math.round(Number(amount)),
      metadata,
      callback: (response: any) => {
        if (onSuccess) onSuccess(response);
      },
      onClose: () => {
        if (onClose) onClose();
      },
    };

    if (ref) {
      config.ref = ref;
    }

    try {
      const handler = window.PaystackPop.setup(config);
      if (handler && typeof handler.openIframe === "function") {
        handler.openIframe();
      } else {
        throw new Error("Paystack handler could not be created");
      }
    } catch (err) {
      console.error("[Paystack Inline Setup Error]", err);
      if (onClose) onClose();
    }
  };

  return { initializePayment, isLoaded };
};
