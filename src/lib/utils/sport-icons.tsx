import {
    Trophy,
    Dumbbell,
    Bike,
    Waves,
    Wind,
    Target,
    Circle,
    Zap,
    Swords
} from "lucide-react";

export type SportType =
    | "tennis"
    | "squash"
    | "badminton"
    | "table-tennis"
    | "pickleball"
    | "racquetball"
    | "basketball"
    | "volleyball"
    | "soccer"
    | "football"
    | "baseball"
    | "golf"
    | "swimming"
    | "running"
    | "cycling"
    | "fitness"
    | "other";

interface SportIconProps {
    sport: string;
    className?: string;
}

export function getSportIcon(sport: string): React.ComponentType<{ className?: string }> {
    const sportLower = sport.toLowerCase().replace(/[^a-z]/g, "");

    // Map sports to appropriate icons
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
        tennis: Swords,
        squash: Swords,
        badminton: Swords,
        tabletennis: Swords,
        pingpong: Swords,
        pickleball: Swords,
        racquetball: Swords,
        basketball: Circle,
        volleyball: Circle,
        soccer: Circle,
        football: Circle,
        baseball: Circle,
        golf: Target,
        swimming: Waves,
        running: Wind,
        cycling: Bike,
        fitness: Dumbbell,
        gym: Dumbbell,
        workout: Dumbbell,
    };

    return iconMap[sportLower] || Trophy;
}

export function SportIcon({ sport, className = "h-5 w-5" }: SportIconProps) {
    const Icon = getSportIcon(sport);
    return <Icon className={className} />;
}

export function formatSportName(sport: string): string {
    // Convert sport IDs to display names
    const nameMap: Record<string, string> = {
        "table-tennis": "Table Tennis",
        "ping-pong": "Ping Pong",
    };

    const sportLower = sport.toLowerCase();
    if (nameMap[sportLower]) {
        return nameMap[sportLower];
    }

    // Capitalize first letter of each word
    return sport
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}
