# Receptionist Communications Boundary

## Receptionist-Owned Concerns

- intent interpretation
- conversation context
- language selection
- receptionist workflow reasoning
- human-handoff requests
- presentation of available communication actions

## Prohibited Concerns

- provider dispatch
- direct transport session creation
- consent override
- suppression override
- production communication activation

## Contract

The receptionist runtime submits governed requests into the Communications Domain.

It does not directly execute telephony, voice, messaging, or scheduling transport actions.
