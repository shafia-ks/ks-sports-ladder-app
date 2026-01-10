"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
    content: string;
    children?: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="cursor-help"
            >
                {children || <HelpCircle className="h-4 w-4 text-slate-400 hover:text-brand-600 transition-colors" />}
            </div>

            {isVisible && (
                <div
                    className={`absolute z-50 ${positionClasses[position]} w-64 px-3 py-2 text-xs text-white bg-slate-900 rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95`}
                    role="tooltip"
                >
                    {content}
                    <div
                        className={`absolute w-2 h-2 bg-slate-900 transform rotate-45 ${position === "top" ? "bottom-[-4px] left-1/2 -translate-x-1/2" :
                                position === "bottom" ? "top-[-4px] left-1/2 -translate-x-1/2" :
                                    position === "left" ? "right-[-4px] top-1/2 -translate-y-1/2" :
                                        "left-[-4px] top-1/2 -translate-y-1/2"
                            }`}
                    />
                </div>
            )}
        </div>
    );
}

interface HelpTooltipProps {
    content: string;
    position?: "top" | "bottom" | "left" | "right";
}

export function HelpTooltip({ content, position = "top" }: HelpTooltipProps) {
    return (
        <Tooltip content={content} position={position}>
            <HelpCircle className="h-4 w-4 text-slate-400 hover:text-brand-600 transition-colors" />
        </Tooltip>
    );
}
