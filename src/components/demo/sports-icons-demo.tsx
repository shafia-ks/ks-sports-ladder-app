"use client";

import {
    Swords,      // For general sports/competition
    Trophy,      // Achievement
    Target,      // Precision sports
    Zap,         // Fast-paced sports
    Activity,    // General activity
    Circle,      // Ball sports
    Disc,        // Disc sports
    Dumbbell,    // Fitness
    Heart,       // Cardio
    Flame        // Intensity
} from "lucide-react";

export function SportsIconsDemo() {
    const iconMapping = [
        { sport: "Badminton", icon: Zap, color: "text-green-600", bg: "bg-green-50", description: "Fast-paced, quick movements" },
        { sport: "Tennis", icon: Circle, color: "text-yellow-600", bg: "bg-yellow-50", description: "Ball sport" },
        { sport: "Squash", icon: Target, color: "text-blue-600", bg: "bg-blue-50", description: "Precision and strategy" },
        { sport: "Padel", icon: Disc, color: "text-purple-600", bg: "bg-purple-50", description: "Paddle sport" },
        { sport: "Table Tennis", icon: Activity, color: "text-red-600", bg: "bg-red-50", description: "Quick reflexes" },
        { sport: "Pickleball", icon: Swords, color: "text-teal-600", bg: "bg-teal-50", description: "Competitive paddle sport" },
    ];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-2">Lucide React Icons - Sports Mapping</h2>
                <p className="text-slate-600">Using existing Lucide icons with sport-specific colors</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {iconMapping.map(({ sport, icon: Icon, color, bg, description }) => (
                    <div key={sport} className={`${bg} border-2 border-slate-200 rounded-xl p-6 text-center space-y-3`}>
                        <div className="flex justify-center">
                            <div className={`${bg} p-4 rounded-full`}>
                                <Icon className={`h-12 w-12 ${color}`} strokeWidth={2} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{sport}</h3>
                            <p className="text-xs text-slate-600 mt-1">{description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t pt-8">
                <h3 className="text-xl font-bold mb-4">Alternative Icon Options</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                    {[
                        { Icon: Swords, name: "Swords", color: "text-brand-600" },
                        { Icon: Trophy, name: "Trophy", color: "text-yellow-600" },
                        { Icon: Target, name: "Target", color: "text-blue-600" },
                        { Icon: Zap, name: "Zap", color: "text-green-600" },
                        { Icon: Activity, name: "Activity", color: "text-red-600" },
                        { Icon: Circle, name: "Circle", color: "text-orange-600" },
                        { Icon: Disc, name: "Disc", color: "text-purple-600" },
                        { Icon: Dumbbell, name: "Dumbbell", color: "text-slate-600" },
                        { Icon: Heart, name: "Heart", color: "text-pink-600" },
                        { Icon: Flame, name: "Flame", color: "text-orange-600" },
                    ].map(({ Icon, name, color }) => (
                        <div key={name} className="text-center space-y-2">
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <Icon className={`h-8 w-8 ${color} mx-auto`} />
                            </div>
                            <p className="text-xs text-slate-600">{name}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 mb-2">💡 Recommendation</h3>
                <p className="text-blue-800 text-sm">
                    Use <strong>color-coded Lucide icons</strong> for a clean, professional look. Each sport gets:
                </p>
                <ul className="list-disc list-inside text-blue-800 text-sm mt-2 space-y-1">
                    <li>A unique icon that represents its characteristics</li>
                    <li>A distinctive color (green, yellow, blue, purple, red, teal)</li>
                    <li>Consistent styling across the app</li>
                    <li>Lightweight SVGs (no image files needed)</li>
                </ul>
            </div>
        </div>
    );
}
