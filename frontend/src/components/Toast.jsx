import React, { useEffect, useState } from "react";

export default function Toast({ message, type = "success", onClose }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
        const hideTimer = setTimeout(() => setShow(false), 4800);
        const removeTimer = setTimeout(() => onClose(), 5300);
        return () => {
            clearTimeout(hideTimer);
            clearTimeout(removeTimer);
        };
    }, [onClose]);

    // const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';
    const outerColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';

    return (
        <div
            className={` transition-all duration-500
                ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                max-w-sm rounded-none
            `}
    >
      <div className={`pl-2 pr-0 pt-0 pb-0 ${outerColor}`}>
        <div className="bg-white text-black text-sm shadow border border-gray-200 p-8\">
            <p className="m-4">{message}</p>
        </div>
      </div>
    </div>
  );
}