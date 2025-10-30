# Phase 4.5: Community Core & Social Platform - Planning Addendum

## Context
This document outlines how to extend your existing LMS + gamification platform into a full-featured AI-native professional community, taking inspiration from Circle.so and Skool.com, on the Payload+Next.js backbone.

---

## 1. Planning Assessment & Confidence
- **Strong foundation**: Existing multi-tenant LMS, robust role-based access, gamification, notifications, analytics, security, UI strategy.
- **MVP Community Feasibility**: High (community basics, engagement, and roles are all structurally supported in Payload/Postgres).
- **Beyond-MVP/Parity**: Medium–High (need dedicated work for memberships/paywalls, chat/DM, moderation, advanced search, social discovery).

## 2. Community Feature Delta (vs. Circle/Skool)
- [x] Multi-tenancy, roles, learning content, gamification, notifications, analytics
- [ ] Spaces/Groups, Channels/Forums, Threads/Posts, Comments, Moderation queues, Reactions, Mentions, Follows/Subscriptions
- [ ] Memberships & Billing, gated access, paywalls (Stripe, webhooks)
- [ ] Trending/search/discovery, feeds (global/home/space)
- [ ] Real-time chat/DMs (Pusher/SSE)
- [ ] Digest emails, weekly summaries, onboarding flows
- [ ] SSO/social auth, referrals, domains
- [ ] Entitlement enforcement end-to-end

## 3. Recommended Additional Phases

### Phase 4.5 – Community Core
- **Collections**:
  - `Communities` *(if separate from `Tenants`)*
  - `Spaces` *(aka Groups/Rooms)*
  - `Channels` *(aka Forums/Topics; can be public/private)*
  - `Threads` / `Posts` / `Comments`
  - `Reactions`, `Mentions`, `Follows`, `ModerationReports`
- **Core Features**:
  - Social graph: follows, public/private memberships
  - Feeds: by space, by followed channel, by home
  - Pagination, pinning, public/private, role moderation
  - Basic FTS (Postgres); plan for Meili/Algolia later
  - Notification triggers: replies, mentions, follows

### Phase 5.5 – Memberships & Billing
- **Collections & Flows**:
  - `Plans`, `Prices`, `Subscriptions`, `Invoices`
  - Stripe webhook receiver: grant/remove entitlements
  - Gated access in `Spaces`, `Channels`, feeds

### Phase 6+—Communication, Moderation, Discovery
- Expand notification system: digests, topic notifications, onboarding
- Add `ModerationReports`, `Actions`, audit logs, auto-moderation (optionally with AI-helpers)
- Compose trending/discover feeds; optimize Postgres FTS, consider search service abstraction
- **Real-time**: SSE/Pusher infra for notifications, optional chat/DM collections
- Growth: invite/referral links, custom domains, SSO/social auth, onboarding flows

## 4. Implementation Risks & Mitigations
- **Feeds/search perf**: Denormalized counters + cursor-based pagination; FTS with abstraction layer.
- **Stripe/webhooks**: Idempotence, audit log, reconciliation job for entitlements.
- **Scale**: Postgres/Neon config; caching; edge function read scaling.
- **Moderation/safety**: Dashboards, rate limiting, auto-filters, optional AI content assist.
- **Mobile**: Early PWA support, documented API for future native apps.

## 5. Next Steps
1. Design collection schemas for proposed entities (`Spaces`, `Threads`, `Posts`, etc.).
2. Plan/implement phase 4.5 MVP dashboard - new nav, space/channel entry, feed.
3. Add phase 5.5: Stripe plans, webhook actions, access hooks.
4. Expand moderation and communications per above.

---

**Summary**: Your LMS+Payload stack is 60–70% of the way to a modern community platform. With focused iterations, you can match and exceed Circle/Skool—adding deep AI-native community features, pro memberships, and real-time interaction with strong analytics and engagement foundations.
