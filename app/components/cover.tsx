import {ReactNode, useRef, useState} from "react";

export default function ScreenCover({children}: { children: ReactNode }) {
  const [covered, setCovered] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const buttonControl = () => {
    setShowButton(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowButton(false);
    }, 3000);
  }

  return (<div className="relative h-screen w-screen">
    {(showButton || !covered) ? <button
        className="z-50 absolute top-4 right-4 bg-transparent text-gray-800 border-2 border-gray-800 px-4 py-2 rounded"
        onClick={() => {
          setCovered(!covered);
          buttonControl();
        }}
    >
      Toggle Shades
    </button> : null}
    {children}
    {covered && (
        <div
            className="absolute inset-0 bg-black z-10 transition-opacity duration-300 cursor-default"
            onClick={buttonControl}
            role="none"
        />
    )}
  </div>);
}