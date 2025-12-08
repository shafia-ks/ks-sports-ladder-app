import { Check, Clock, X, AlertCircle } from "lucide-react";
import { ChallengeStatus, MatchStatus } from "@/types/domain";

interface StatusBadgeProps {
  status: ChallengeStatus | MatchStatus | string;
  type?: "challenge" | "match" | "generic";
}

const challengeStatusConfig: Record<ChallengeStatus, { variant: string; icon: any }> = {
  Pending: { variant: "warning", icon: Clock },
  Accepted: { variant: "success", icon: Check },
  Declined: { variant: "danger", icon: X },
  Completed: { variant: "success", icon: Check },
  Expired: { variant: "neutral", icon: AlertCircle },
  Cancelled: { variant: "neutral", icon: X },
};

const matchStatusConfig: Record<MatchStatus, { variant: string; icon: any }> = {
  Submitted: { variant: "warning", icon: Clock },
  Confirmed: { variant: "success", icon: Check },
  Disputed: { variant: "danger", icon: AlertCircle },
};

export function StatusBadge({ status, type = "generic" }: StatusBadgeProps) {
  let config = { variant: "neutral", icon: null };

  if (type === "challenge" && status in challengeStatusConfig) {
    config = challengeStatusConfig[status as ChallengeStatus];
  } else if (type === "match" && status in matchStatusConfig) {
    config = matchStatusConfig[status as MatchStatus];
  }

  const Icon = config.icon;

  return (
    <span className={`badge badge-${config.variant}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {status}
    </span>
  );
}
