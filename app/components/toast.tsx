import {ReactNode, useEffect, useState} from "react";

interface BaseToastProps {
  duration?: number;
  children?: ReactNode;
}

export function BaseToast({ duration = 3000, children }: BaseToastProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeDelay = setTimeout(() => setFading(true), duration);
    const removeDelay = setTimeout(() => setVisible(false), duration + 300);

    return () => {
      clearTimeout(fadeDelay);
      clearTimeout(removeDelay);
    };
  }, [duration]);

  if (!visible) return null;

  return (
      <div
          className={`
        flex items-center w-full max-w-sm p-4 mb-4 
        fixed bottom-4 right-4 z-50
        text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800
        transition-opacity duration-300
        ${fading ? 'opacity-0' : 'opacity-100'}
      `}
      >
        {children}
      </div>
  );
}



export function WarnToast({ children, duration = 3000 } : { children : string, duration?: number }) {
  return (<BaseToast duration={duration}>
    <div
        className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-orange-500 bg-orange-100 rounded-lg dark:bg-orange-700 dark:text-orange-200">
      <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
           viewBox="0 0 20 20">
        <path
            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
      </svg>
      <span className="sr-only">Warning icon</span>
    </div>
    <div className="ms-3 font-normal text-sm">{children}</div>
  </BaseToast>);
}

export function ErrorToast({ children, duration = 3000 } : { children : string, duration?: number }) {
  return (<BaseToast duration={duration}>
    <div
        className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
      <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
           viewBox="0 0 20 20">
        <path
            d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
      </svg>
      <span className="sr-only">Error icon</span>
    </div>
    <div className="ms-3 text-sm font-normal">{children}</div>
  </BaseToast>);
}