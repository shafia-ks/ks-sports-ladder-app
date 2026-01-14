// Sport icon component that loads SVG icons from /public/icons/sports/
import Image from "next/image";

export type SportType = "badminton" | "tennis" | "squash" | "padel" | "table-tennis" | "pickleball" | "racquetball";

interface SportIconProps {
    sport: string; // Accept any string to handle database values
    size?: number;
    className?: string;
}

// Map sport names to icon filenames
function getSportIconPath(sport: string): string {
    const sportLower = sport.toLowerCase().replace(/\s+/g, "-");

    // Map common variations
    const iconMap: Record<string, string> = {
        "badminton": "badminton",
        "tennis": "tennis",
        "squash": "squash",
        "padel": "padel",
        "table-tennis": "table-tennis",
        "table tennis": "table-tennis",
        "tabletennis": "table-tennis",
        "pickleball": "pickleball",
        "racquetball": "tennis", // Use tennis icon as fallback
        "racketball": "tennis",
    };

    return iconMap[sportLower] || "tennis"; // Default to tennis icon
}

export function SportIcon({ sport, size = 24, className = "" }: SportIconProps) {
    const iconName = getSportIconPath(sport);
    const iconPath = `/icons/sports/${iconName}.svg`;

    return (
        <Image
            src={iconPath}
            alt={`${sport} icon`}
            width={size}
            height={size}
            className={className}
        />
    );
}

// Helper to get sport display name
export function getSportDisplayName(sport: string): string {
    const names: Record<string, string> = {
        "badminton": "Badminton",
        "tennis": "Tennis",
        "squash": "Squash",
        "padel": "Padel",
        "table-tennis": "Table Tennis",
        "table tennis": "Table Tennis",
        "pickleball": "Pickleball",
        "racquetball": "Racquetball",
    };
    return names[sport.toLowerCase()] || sport;
}
