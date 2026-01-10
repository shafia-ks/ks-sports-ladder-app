import { MapPin, Users, Swords } from "lucide-react";
import { SportIcon, formatSportName } from "@/lib/utils/sport-icons";
import Image from "next/image";

interface LadderInfoSidebarProps {
    sport: string;
    location: string | null;
    memberCount: number;
    activeChallenges: number;
    profilePictureUrl?: string | null;
    organizers: Array<{
        id: string;
        full_name: string | null;
        email: string | null;
    }>;
}

export function LadderInfoSidebar({
    sport,
    location,
    memberCount,
    activeChallenges,
    profilePictureUrl,
    organizers
}: LadderInfoSidebarProps) {
    return (
        <div className="space-y-4">
            {/* Ladder Profile Picture */}
            {profilePictureUrl && (
                <div className="card p-5">
                    <div className="flex justify-center">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-brand-100">
                            <Image
                                src={profilePictureUrl}
                                alt="Ladder profile"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Ladder Info Card */}
            <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Ladder Info</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                        <SportIcon sport={sport} className="h-5 w-5 text-brand-600" />
                        <span>{formatSportName(sport)}</span>
                    </div>
                    {location && (
                        <div className="flex items-center gap-2 text-slate-700">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{location}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-700">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>{memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                        <Swords className="h-4 w-4 text-slate-400" />
                        <span>{activeChallenges} active challenges</span>
                    </div>
                </div>
            </div>

            {/* Organizers Card */}
            {organizers.length > 0 && (
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Organizers</h3>
                    <div className="space-y-2">
                        {organizers.slice(0, 3).map((organizer) => (
                            <div key={organizer.id} className="text-sm text-slate-700">
                                {organizer.full_name || organizer.email}
                            </div>
                        ))}
                        {organizers.length > 3 && (
                            <p className="text-xs text-slate-500">+{organizers.length - 3} more</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
