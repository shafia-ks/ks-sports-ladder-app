# QA Requirements Traceability Matrix (RTM)

## Legend
- **ID:** Unique identifier for the requirement.
- **Source:** Origin of the requirement (`SPEC.md` or `GHOST` for undocumented).
- **Status:** 🔴 Missing | 🟡 Partial | 🟢 Covered

## 1. Core Domain (From SPEC.md)

| ID | Feature | Requirement | Source | Status | Test File |
|----|---------|-------------|--------|--------|-----------|
| **LAD-01** | Ladder | User can create a ladder with rules | Spec | 🔴 | `e2e/ladder.spec.ts` (partial) |
| **LAD-02** | Ladder | User can join a ladder (Membership) | Spec | 🟡 | `e2e/ladder.spec.ts` |
| **CHL-01** | Challenge | Ranking Rule: Max positions up check | Spec | 🔴 | - |
| **CHL-02** | Challenge | Busy Rule: Cannot challenge busy player | Spec | 🔴 | - |
| **CHL-03** | Challenge | Cap Rule: Max active challenges limit | Spec | 🔴 | - |
| **CHL-04** | Challenge | Self-challenge prevention | Spec | 🔴 | - |
| **MCH-01** | Match | Players can submit scores | Spec | 🔴 | - |
| **MCH-02** | Match | Opponent must confirm score | Spec | 🔴 | - |
| **MCH-03** | Match | Ranking updates on confirmation | Spec | 🟢 | `src/lib/ranking/__tests__/ranking-engine.test.ts` (Passed) |
| **RNK-01** | Rankings | Default Swap Minimal Drop logic | Spec | 🟢 | `src/lib/ranking/__tests__/ranking-engine.test.ts` (Passed) |
| **AUTH-01**| Auth | User can login/logout | Spec | � | `e2e/auth.spec.ts` (Env Required) |
| **ANA-01** | Analytics | Events fire on action | Spec | 🟢 | `src/lib/analytics/__tests__/tracker.test.ts` (Passed) |

## 2. Discovered Features (Ghost Hunting Phase)

| ID | Feature | Requirement | Source | Status | Test File |
|----|---------|-------------|--------|--------|-----------|
| **ADM-01** | Admin | View/Approve Pending Memberships | Ghost | 🟡 | `e2e/admin.spec.ts` |
| **INV-01** | Invitations | Send email invitations to join ladder | Ghost | 🔴 | - |
| **LDR-01** | Roles | Request "Leader" (Organizer) status | Ghost | 🔴 | - |
| **SEA-01** | Seasons | Create/Manage Ladder Seasons | Ghost | 🔴 | - |
| **EXP-01** | Data | Export Ladder Data | Ghost | 🔴 | - |
