# Algorithms

## Executive Intent Scoring Algorithm

The first documented algorithm is the Executive Intent Scoring Algorithm.

Phase 6 implements version `v1.0.0` as a deterministic scoring engine for anonymous card interaction groups.

The algorithm classifies each interaction by business priority using evidence from identity, source, channel, urgency, business relevance, engagement history, sentiment, follow-up probability, and strategic value.

## Goals

The algorithm should answer:

- Who is this interaction from?
- How trustworthy is the identity?
- Which source produced the interaction?
- What type of interaction occurred?
- How urgent is it?
- How relevant is it to the executive's business goals?
- Has this person or company engaged before?
- Is the conversation positive, negative, neutral, or unknown?
- Is follow-up likely to create business value?
- Is this strategically important even if short-term conversion is uncertain?

## Inputs

### Identity Strength

Measures confidence that the system knows the person or company.

Signals may include:

- Known contact.
- Verified email domain.
- Known phone number.
- CRM or imported relationship.
- Prior meeting.
- Manual executive confirmation.
- Enrichment match.

### Source Quality

Measures reliability and business context of the source.

Examples:

- Direct executive QR card.
- Warm referral link.
- Conference campaign QR.
- Website form.
- Inbound call.
- Cold email.
- Unknown source.

### Interaction Type

Measures the business weight of the action.

Examples:

- QR scan.
- Card save.
- Form submission.
- Phone call.
- Missed call.
- Voicemail.
- Email reply.
- Meeting booked.
- Repeat visit.

### Urgency

Measures time sensitivity.

Signals may include:

- Same-day meeting request.
- Emergency or support language.
- Repeated missed calls.
- Explicit deadline.
- Executive priority company.
- High-value account trigger.

### Business Relevance

Measures alignment to the executive's goals.

Signals may include:

- Target industry.
- Target role.
- Strategic account.
- Partnership topic.
- Investment topic.
- Hiring topic.
- Customer opportunity.

### Repeat Engagement

Measures whether the contact or company keeps returning.

Signals may include:

- Multiple scans.
- Multiple channel touches.
- Recent follow-up interactions.
- Reopened previous conversation.
- Multiple people from same company.

### Conversation Sentiment

Measures tone when text or transcript is available.

Possible values:

- Positive.
- Neutral.
- Negative.
- Urgent.
- Unknown.

### Follow-Up Probability

Measures likelihood that a concrete next action can happen.

Signals may include:

- Complete contact details.
- Clear ask.
- Meeting availability.
- Reply history.
- Intent to buy, partner, hire, invest, or collaborate.

### Strategic Value

Measures long-term importance beyond immediate conversion.

Signals may include:

- Executive-level contact.
- High-value company.
- Investor, partner, press, or strategic customer.
- Relationship with high network value.
- Existing relationship with low recent engagement.

## Conceptual Scoring Model

The initial model should be simple and explainable. A future implementation can use weighted rules before considering machine learning.

Conceptual weights:

```text
Identity strength: 15
Source quality: 10
Interaction type: 15
Urgency: 15
Business relevance: 15
Repeat engagement: 10
Conversation sentiment: 5
Follow-up probability: 10
Strategic value: 15
```

The total is normalized to 100. Weights are intentionally documented as a starting hypothesis, not a final product truth.

## Phase 6 Implemented Model

Phase 6 scores groups of `interaction_events` by:

- anonymous visitor ID.
- session ID.
- executive slug.

The implemented factors are:

- event type value.
- repeat engagement.
- action depth.
- recency.
- compact multi-action session behavior.
- source/referrer presence.
- coarse device metadata completeness.

The engine does not use raw IP addresses, IP hashes, demographic inference, identity resolution, external enrichment, machine learning, or autonomous decision-making.

## Output Categories

### Cold Signal

Score range: 0 to 24.

Meaning: weak identity, low engagement, unclear relevance, or low-quality source.

Recommended action: capture safely, avoid interruption, enrich if useful, and wait for additional signal.

### Warm Signal

Score range: 25 to 49.

Meaning: identifiable or context-rich interaction with some business relevance.

Recommended action: add to contact graph, suggest lightweight follow-up, and watch for repeat engagement.

### Qualified Signal

Score range: 50 to 69.

Meaning: clear business relevance, adequate identity confidence, and a plausible next step.

Recommended action: route to follow-up queue, propose meeting or reply, and assign owner.

### Executive Priority

Score range: 70 to 84.

Meaning: high urgency, strong identity or strategic relevance, and meaningful business impact.

Recommended action: notify executive or delegate quickly, summarize context, and require action tracking.

### Strategic Opportunity

Score range: 85 to 100.

Meaning: high-value company or person, strong timing, strong relevance, and material potential.

Recommended action: immediate executive-level review, high-confidence context summary, and explicit follow-up plan.

## Explanation Requirement

Every score must produce a human-readable explanation:

```text
Category: Executive Priority
Score: 78
Primary reasons:
- Known company matched strategic account list.
- Second interaction in 48 hours.
- Caller requested a meeting this week.
- Prior note indicates active partnership discussion.
Recommended action:
- Notify executive assistant and offer available meeting windows.
```

## Guardrails

- Never hide score reasoning.
- Never allow sentiment alone to create a high score.
- Never classify an unknown identity as strategic without a strong source or manual confirmation.
- Never present anonymous signals as confirmed leads.
- Never auto-send sensitive replies without approval.
- Always retain the source event that produced the score.
- Always allow score correction after human review.

## Validation Plan For Future Phases

The first implementation should be validated against fixtures:

- Known strategic contact with urgent request.
- Unknown QR scan with no follow-up.
- Repeat event attendee with meeting request.
- Missed call from known customer.
- Cold email with weak identity.
- Negative sentiment from important account.

Success should be measured by agreement between score category and human review.

## Future Algorithms

These are candidates for later phases, not Phase 1 implementation:

- Contact deduplication.
- Relationship strength scoring.
- Follow-up priority ranking.
- Opportunity decay.
- Meeting outcome classification.
- Source quality calibration.
- Receptionist handoff confidence.
