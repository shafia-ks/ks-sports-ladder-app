"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
    Search,
    Users,
    Trophy,
    Settings,
    Swords,
    Target,
    Shield,
    BookOpen,
    HelpCircle,
    ChevronRight,
    Award,
    Clock,
    CheckCircle,
    Smartphone,
    Share,
    MoreVertical,
    PlusSquare,
    Menu
} from "lucide-react";

interface HelpSection {
    id: string;
    title: string;
    icon: any;
    description: string;
    articles: HelpArticle[];
}

interface HelpArticle {
    id: string;
    title: string;
    content: string;
    tags: string[];
}

const helpSections: HelpSection[] = [
    {
        id: "getting-started",
        title: "Getting Started",
        icon: BookOpen,
        description: "New to KS Sports Ladder? Start here!",
        articles: [
            {
                id: "what-is-ladder",
                title: "What is a Sports Ladder?",
                tags: ["basics", "overview"],
                content: `
A sports ladder is a competitive ranking system where players challenge each other to climb the rankings.

**Key Concepts:**
- **Rankings**: Players are ordered by skill/performance
- **Challenges**: Lower-ranked players challenge higher-ranked players
- **Matches**: Play the match and submit results
- **Rank Changes**: Winners move up, losers may move down

**Example:**
If you're ranked #5, you can challenge players ranked #1-4. If you win, you swap positions or gain points depending on the ladder's ranking system.
        `
            },
            {
                id: "creating-account",
                title: "Creating Your Account",
                tags: ["signup", "account"],
                content: `
**Step 1: Sign Up**
1. Click "Sign Up" in the top navigation
2. Enter your email and create a password
3. Accept the GDPR and Code of Conduct
4. Check your email for verification link
5. Click the link to verify your account

**Step 2: Complete Your Profile**
1. Go to Profile page
2. Add your full name
3. Upload a profile picture (optional)
4. Save changes

**Step 3: Join a Ladder**
1. Browse available ladders
2. Click "Join Ladder"
3. Wait for organizer approval (if required)
4. Start challenging!
        `
            },
            {
                id: "joining-ladder",
                title: "Joining Your First Ladder",
                tags: ["ladder", "join"],
                content: `
**Finding Ladders:**
- Browse public ladders on the Ladders page
- Or join via invitation link from an organizer

**Joining Process:**
1. Click "Join Ladder" button
2. Your request is sent to organizers
3. Wait for approval (usually within 24 hours)
4. You'll receive a notification when approved
5. You'll be assigned an initial rank

**Initial Ranking:**
- New members typically start at the bottom
- Some ladders may assess your skill level first
- You can climb by winning challenges!
        `
            }
        ]
    },
    {
        id: "mobile-app",
        title: "Mobile App",
        icon: Smartphone,
        description: "Install the app on your phone",
        articles: [
            {
                id: "install-ios",
                title: "Install on iOS (iPhone/iPad)",
                tags: ["mobile", "ios", "iphone", "install"],
                content: `
**Step 1: Open in Safari**
Open **KS Sports Ladder** in the Safari browser. 
*(Note: Chrome on iOS also supports this, but Safari is recommended)*

**Step 2: Tap Share**
Look for the **Share** icon (square with arrow up) at the bottom of the screen.

**Step 3: Add to Home Screen**
Scroll down the menu and find **"Add to Home Screen"** (square with plus sign).

**Step 4: Confirm**
Tap **Add** in the top right corner.

**Done!**
The app icon will appear on your home screen like a native app. It will open in full-screen mode without browser bars.
        `
            },
            {
                id: "install-android",
                title: "Install on Android",
                tags: ["mobile", "android", "install"],
                content: `
**Step 1: Open in Chrome**
Open **KS Sports Ladder** in the Chrome browser.

**Step 2: Tap Menu**
Tap the **Menu** icon (three vertical dots) in the top right corner.

**Step 3: Install**
Look for **"Install app"** or **"Add to Home screen"** in the menu.

**Step 4: Confirm**
Follow the prompt to install.

**Done!**
The app will be added to your app drawer and home screen. It runs like a native app.
        `
            }
        ]
    },
    {
        id: "roles",
        title: "Roles & Permissions",
        icon: Shield,
        description: "Understanding user roles and what they can do",
        articles: [
            {
                id: "player-role",
                title: "Player Role",
                tags: ["roles", "player"],
                content: `
**Players** are standard members who participate in ladders.

**What Players Can Do:**
✅ Join ladders (with approval)
✅ Challenge other players
✅ Accept/decline challenges
✅ Submit match results
✅ View rankings and stats
✅ Receive notifications
✅ Update their profile

**What Players Cannot Do:**
❌ Create ladders
❌ Approve new members
❌ Change ladder settings
❌ Delete matches
❌ Manage other users

**Becoming an Organizer:**
Players can request organizer status for specific ladders. Admins review and approve these requests.
        `
            },
            {
                id: "organizer-role",
                title: "Organizer Role",
                tags: ["roles", "organizer"],
                content: `
**Organizers** manage specific ladders they create or are assigned to.

**What Organizers Can Do:**
✅ Everything a Player can do, PLUS:
✅ Create new ladders
✅ Configure ladder settings
✅ Invite members to their ladders
✅ Approve/reject membership requests
✅ Approve/dispute match results
✅ View ladder analytics
✅ Archive/reactivate their ladders
✅ Manage ladder visibility

**Scope:**
- Organizers only manage ladders they created or were assigned to
- They cannot manage other organizers' ladders
- They cannot access admin functions

**Best For:**
- Club managers
- Tournament organizers
- Community leaders
        `
            },
            {
                id: "admin-role",
                title: "Admin Role",
                tags: ["roles", "admin"],
                content: `
**Admins** have full system access and manage the entire platform.

**What Admins Can Do:**
✅ Everything Organizers can do, PLUS:
✅ Manage ALL ladders (not just their own)
✅ Promote/demote user roles
✅ Disable/enable user accounts
✅ Delete user accounts permanently
✅ View all audit logs
✅ Access admin dashboard
✅ Manage system settings
✅ Review organizer requests

**Responsibilities:**
- Ensure fair play across all ladders
- Handle disputes and violations
- Maintain platform integrity
- Support organizers and players

**Security:**
Admin accounts should be carefully protected with strong passwords and 2FA.
        `
            }
        ]
    },
    {
        id: "challenges",
        title: "Challenges & Matches",
        icon: Swords,
        description: "How to challenge players and submit results",
        articles: [
            {
                id: "creating-challenge",
                title: "Creating a Challenge",
                tags: ["challenge", "how-to"],
                content: `
**Challenge Rules:**
Most ladders allow you to challenge players ranked above you within a certain range (e.g., up to 3 positions higher).

**How to Challenge:**
1. Go to the ladder's Rankings page
2. Find a player you can challenge (highlighted)
3. Click "Challenge" button
4. (Optional) Propose a time and location
5. Add any notes
6. Click "Send Challenge"

**What Happens Next:**
- The challenged player receives a notification
- They have a set time to respond (usually 7 days)
- They can accept, decline, or counter-propose
- If accepted, you arrange and play the match
- If declined or expired, you can challenge someone else

**Tips:**
- Be respectful in your challenge notes
- Propose realistic times
- Check the player's availability
- Follow the ladder's code of conduct
        `
            },
            {
                id: "accepting-challenge",
                title: "Accepting/Declining Challenges",
                tags: ["challenge", "accept"],
                content: `
**When You Receive a Challenge:**
You'll get a notification and see it in your Challenges page.

**Your Options:**

**1. Accept**
- Agree to play the match
- Coordinate time/location with challenger
- Match is created and tracked

**2. Decline**
- Provide a reason (optional but recommended)
- Challenge is closed
- No penalty for declining

**3. Counter-Propose**
- Suggest different time/location
- Challenger can accept your proposal
- Helps find mutually convenient time

**4. Ignore (Not Recommended)**
- Challenge expires after set period
- May affect your reputation
- Organizers may take action

**Best Practices:**
- Respond within 48 hours
- Be honest about availability
- Communicate clearly
- Honor your commitments
        `
            },
            {
                id: "submitting-results",
                title: "Submitting Match Results",
                tags: ["match", "results"],
                content: `
**After Playing Your Match:**

**Step 1: Submit Score**
1. Go to Matches page
2. Find your match
3. Click "Submit Result"
4. Enter set scores (e.g., 6-4, 6-3)
5. Select winner
6. Add notes (optional)
7. Click "Submit"

**Step 2: Opponent Confirmation**
- Your opponent receives notification
- They review and confirm/dispute
- If confirmed: Rankings update automatically
- If disputed: Organizer reviews

**Score Format:**
- Enter each set score separately
- Format: Winner's score - Loser's score
- Example: 6-4, 7-5 (you won both sets)

**Disputes:**
If your opponent disputes:
1. Organizer is notified
2. Both players provide evidence
3. Organizer makes final decision
4. Decision is binding

**Tips:**
- Submit results promptly (within 24 hours)
- Be accurate with scores
- Add context in notes if needed
- Respect the outcome
        `
            }
        ]
    },
    {
        id: "rankings",
        title: "Ranking Systems",
        icon: Trophy,
        description: "Understanding how rankings work",
        articles: [
            {
                id: "ranking-overview",
                title: "Ranking Systems Overview",
                tags: ["rankings", "overview"],
                content: `
Different ladders use different ranking systems. Here are the main types:

**1. Position-Based (Swap)**
- Simple position swapping
- Winner takes loser's position
- Loser drops one position
- Easy to understand
- Example: #5 beats #3 → they swap positions

**2. ELO Rating**
- Points-based system (like chess)
- Gain/lose points based on opponent's rating
- Beating higher-rated players = more points
- More sophisticated and fair
- Example: 1500 rating beats 1600 → gains ~16 points

**3. Hybrid Systems**
- Combines position and points
- Limits how far you can drop
- Rewards consistency
- Balances fairness and simplicity

**Your Ladder's System:**
Check your ladder's settings page to see which system is used and the specific rules.
        `
            },
            {
                id: "swap-ranking",
                title: "Swap Ranking System (Detailed)",
                tags: ["rankings", "swap"],
                content: `
**How Swap Ranking Works:**

**Basic Rule:**
When a lower-ranked player beats a higher-ranked player, they swap positions.

**Example Scenario:**

**Before Match:**
1. Alice
2. Bob
3. Charlie ← challenges
4. Diana
5. Emma ← challenger

**Emma (#5) challenges and beats Charlie (#3)**

**After Match:**
1. Alice
2. Bob
3. Emma ← moved up 2 positions
4. Charlie ← dropped 1 position
5. Diana ← dropped 1 position

**Variations:**

**Minimal Drop:**
- Loser only drops 1 position
- Others don't move
- Less disruptive

**Full Swap:**
- Winner takes exact position
- Everyone in between shifts down
- More dramatic changes

**Your ladder's settings determine which variation is used.**
        `
            },
            {
                id: "elo-ranking",
                title: "ELO Ranking System (Detailed)",
                tags: ["rankings", "elo"],
                content: `
**How ELO Works:**

**Rating Points:**
- Everyone starts with a base rating (e.g., 1500)
- Win matches → gain points
- Lose matches → lose points
- Amount depends on opponent's rating

**Calculation:**

**Expected Score:**
E = 1 / (1 + 10^((OpponentRating - YourRating) / 400))

**Rating Change:**
NewRating = OldRating + K × (ActualScore - ExpectedScore)

Where:
- K = K-factor (usually 24-32)
- ActualScore = 1 for win, 0 for loss
- ExpectedScore = probability of winning

**Example:**

**You (1500) vs Opponent (1600):**
- Expected: 36% chance to win
- You win: +16 points → 1516
- You lose: -16 points → 1484

**You (1500) vs Opponent (1400):**
- Expected: 64% chance to win
- You win: +8 points → 1508
- You lose: -24 points → 1476

**Key Insight:**
Beating higher-rated players gives more points!

**K-Factor:**
- Higher K = more volatile ratings
- Lower K = more stable ratings
- Your ladder's K-factor is in settings
        `
            }
        ]
    },
    {
        id: "organizer-guide",
        title: "Organizer Guide",
        icon: Settings,
        description: "Managing your ladder effectively",
        articles: [
            {
                id: "creating-ladder",
                title: "Creating a Ladder",
                tags: ["organizer", "create"],
                content: `
**Prerequisites:**
- You must have Organizer or Admin role
- If you're a Player, request Organizer status first

**Creation Steps:**

**1. Basic Information**
- Name: Clear, descriptive (e.g., "Downtown Tennis Ladder")
- Description: Explain the ladder's purpose
- Sport: Select from dropdown
- Location: Where matches are played
- Visibility: Public or Private

**2. Challenge Rules**
- Max positions up: How far up can players challenge?
- Expiry days: How long to respond to challenges?
- Cooldown hours: Time between challenges
- Busy player prevention: Block challenging busy players

**3. Ranking Rules**
- System: Swap, ELO, or Hybrid
- K-factor (for ELO): 24-32 recommended
- Max drop: Limit how far players can fall

**4. Match Confirmation**
- Auto-confirm: Matches confirmed automatically
- Require confirmation: Opponent must confirm
- Dispute window: Time to dispute results

**Best Practices:**
- Start simple, adjust later
- Communicate rules clearly
- Be consistent with enforcement
- Listen to member feedback
        `
            },
            {
                id: "ladder-settings",
                title: "Ladder Settings Explained",
                tags: ["organizer", "settings"],
                content: `
**Challenge Rules:**

**Max Positions Up (Default: 3)**
- How many ranks above can players challenge?
- Lower = more conservative, slower movement
- Higher = more dynamic, faster movement
- Example: 3 means rank #10 can challenge #7, #8, #9

**Expiry Days (Default: 7)**
- Days to respond to a challenge
- Too short = hard to coordinate
- Too long = ladder stagnates
- 7 days is a good balance

**Cooldown Hours (Default: 0)**
- Time between issuing challenges
- Prevents spam challenges
- 24-48 hours recommended if enabled

**Ranking Rules:**

**System Type:**
- **Swap**: Simple position swapping
- **ELO**: Points-based rating
- **Hybrid**: Best of both worlds

**K-Factor (ELO only, Default: 24)**
- How much ratings change per match
- 16 = very stable
- 24 = balanced
- 32 = volatile, fast changes

**Max Drop (Swap only, Default: 1)**
- Maximum positions to drop when losing
- 1 = minimal disruption
- Unlimited = full swap

**Match Settings:**

**Confirmation Required:**
- Yes: Both players must confirm
- No: Submitter's score is final
- Recommended: Yes (prevents disputes)

**Dispute Window (Default: 48 hours)**
- Time to dispute a result
- After this, result is final
        `
            },
            {
                id: "managing-members",
                title: "Managing Members",
                tags: ["organizer", "members"],
                content: `
**Approving New Members:**

**Review Process:**
1. Go to your ladder's Members tab
2. Click "Pending Approvals"
3. Review each request
4. Check player's profile
5. Approve or Reject

**Approval Criteria:**
- Skill level appropriate?
- Profile complete?
- Good standing in other ladders?
- Follows code of conduct?

**Initial Ranking:**
- New members usually start at bottom
- Or assess skill and place accordingly
- Communicate placement clearly

**Managing Active Members:**

**Removing Members:**
- Use sparingly
- Provide clear reason
- Follow your ladder's rules
- Document the decision

**Handling Inactive Members:**
- Set activity requirements
- Send reminders
- Consider temporary suspension
- Remove if necessary

**Best Practices:**
- Be fair and consistent
- Communicate decisions
- Give warnings before removal
- Keep records of actions
        `
            },
            {
                id: "inviting-players",
                title: "Inviting Players",
                tags: ["organizer", "invite"],
                content: `
**Two Types of Invitations:**

**1. Existing Users**
- Players already on the platform
- They receive in-app notification
- Can accept/decline instantly
- Automatically added when accepted

**2. New Users (Email)**
- People not yet on platform
- Receive email invitation
- Must create account first
- Then automatically join your ladder

**How to Invite:**

**Step 1: Open Invite Modal**
- Go to your ladder page
- Click "Invite Members" button
- Choose invitation type

**Step 2: Select Recipients**

**For Existing Users:**
- Search by name or email
- Select from list
- Can invite multiple at once

**For New Users:**
- Enter email addresses
- One per line or comma-separated
- Can send to multiple emails

**Step 3: Send Invitations**
- Review selections
- Click "Send Invitations"
- Invitations are sent immediately

**Tracking Invitations:**
- View pending invitations
- See who accepted/declined
- Resend if needed
- Invitations expire after 30 days

**Tips:**
- Personalize invitation message
- Explain your ladder's focus
- Set expectations clearly
- Follow up with new members
        `
            }
        ]
    },
    {
        id: "faq",
        title: "FAQ",
        icon: HelpCircle,
        description: "Frequently asked questions",
        articles: [
            {
                id: "faq-general",
                title: "General Questions",
                tags: ["faq"],
                content: `
**Q: Is KS Sports Ladder free to use?**
A: Yes! The platform is free for all players and organizers.

**Q: What sports are supported?**
A: Currently: Tennis, Squash, Badminton, Pickleball, Table Tennis, and Racquetball. More coming soon!

**Q: Can I join multiple ladders?**
A: Yes! You can join as many ladders as you want.

**Q: How do I become an Organizer?**
A: Request Organizer status from your profile. Admins review and approve requests.

**Q: Can I delete my account?**
A: Yes, contact an admin or use the account deletion feature in your profile settings.

**Q: Are my match results private?**
A: Match results are visible to all ladder members. Rankings are public within the ladder.

**Q: What if I have a dispute?**
A: Contact your ladder's organizer. They will review and make a final decision.

**Q: Can I change my username?**
A: Yes, update your full name in your profile settings.

**Q: How are rankings calculated?**
A: Depends on your ladder's system. See the "Ranking Systems" section for details.

**Q: What happens if I'm inactive?**
A: Organizers may remove inactive members. Stay active to maintain your ranking!
        `
            }
        ]
    }
];

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

    // Filter articles based on search
    const filteredSections = helpSections.map(section => ({
        ...section,
        articles: section.articles.filter(article =>
            searchQuery === "" ||
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    })).filter(section => section.articles.length > 0);

    const currentSection = selectedSection
        ? helpSections.find(s => s.id === selectedSection)
        : null;

    const currentArticle = currentSection && selectedArticle
        ? currentSection.articles.find(a => a.id === selectedArticle)
        : null;

    return (
        <div className="space-y-6">
            <Breadcrumb items={[
                { label: "Home", href: "/" },
                { label: "Help Center" }
            ]} />

            <PageHeader
                title="Help Center"
                description="Everything you need to know about KS Sports Ladder"
            />

            {/* Search */}
            <div className="card p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search help articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="card p-4 space-y-2 sticky top-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Categories</h3>
                        {filteredSections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => {
                                        setSelectedSection(section.id);
                                        setSelectedArticle(null);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${selectedSection === section.id
                                        ? "bg-brand-50 text-brand-700"
                                        : "hover:bg-slate-50 text-slate-700"
                                        }`}
                                >
                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm font-medium">{section.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {!selectedSection && !searchQuery && (
                        /* Overview Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {helpSections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setSelectedSection(section.id)}
                                        className="card p-6 text-left hover:shadow-md transition-shadow group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">
                                                    {section.title}
                                                </h3>
                                                <p className="text-sm text-slate-600 mb-3">
                                                    {section.description}
                                                </p>
                                                <div className="flex items-center text-xs text-brand-600 font-medium">
                                                    {section.articles.length} articles
                                                    <ChevronRight className="h-3 w-3 ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {(selectedSection || searchQuery) && !selectedArticle && (
                        /* Article List */
                        <div className="space-y-4">
                            {currentSection && !searchQuery && (
                                <div className="card p-6 bg-gradient-to-br from-brand-50 to-purple-50">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-white shadow-sm">
                                            {(() => {
                                                const Icon = currentSection.icon;
                                                return <Icon className="h-6 w-6 text-brand-600" />;
                                            })()}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                                {currentSection.title}
                                            </h2>
                                            <p className="text-slate-600">
                                                {currentSection.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {(searchQuery ? filteredSections.flatMap(s => s.articles) : currentSection?.articles || []).map((article) => (
                                    <button
                                        key={article.id}
                                        onClick={() => {
                                            if (searchQuery) {
                                                const section = helpSections.find(s =>
                                                    s.articles.some(a => a.id === article.id)
                                                );
                                                setSelectedSection(section?.id || null);
                                            }
                                            setSelectedArticle(article.id);
                                        }}
                                        className="w-full card p-4 text-left hover:shadow-md transition-shadow group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">
                                                    {article.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {article.tags.map(tag => (
                                                        <span
                                                            key={tag}
                                                            className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-brand-600 transition-colors flex-shrink-0" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedArticle && currentArticle && (
                        /* Article View */
                        <div className="space-y-4">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                            >
                                ← Back to articles
                            </button>

                            <div className="card p-8">
                                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                                    {currentArticle.title}
                                </h1>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {currentArticle.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="text-xs px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    {currentArticle.content.split('\n').map((paragraph, idx) => {
                                        // Handle headers
                                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                                            const text = paragraph.replace(/\*\*/g, '');
                                            if (text.startsWith('Q:')) {
                                                return (
                                                    <h3 key={idx} className="text-lg font-semibold text-slate-900 mt-6 mb-2">
                                                        {text}
                                                    </h3>
                                                );
                                            }
                                            return (
                                                <h3 key={idx} className="text-lg font-semibold text-slate-900 mt-6 mb-2">
                                                    {text}
                                                </h3>
                                            );
                                        }

                                        // Handle list items
                                        if (paragraph.trim().startsWith('✅') || paragraph.trim().startsWith('❌')) {
                                            return (
                                                <div key={idx} className="flex items-start gap-2 mb-2">
                                                    <span className="text-lg">{paragraph.trim()[0]}</span>
                                                    <span className="text-slate-700">{paragraph.trim().substring(2)}</span>
                                                </div>
                                            );
                                        }

                                        if (paragraph.trim().startsWith('-')) {
                                            return (
                                                <li key={idx} className="text-slate-700 ml-4">
                                                    {paragraph.trim().substring(1).trim()}
                                                </li>
                                            );
                                        }

                                        // Regular paragraphs
                                        if (paragraph.trim()) {
                                            return (
                                                <p key={idx} className="text-slate-700 mb-4">
                                                    {paragraph.trim()}
                                                </p>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
