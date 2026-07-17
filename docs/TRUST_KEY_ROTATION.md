# Trust Key Rotation

Rotation transactionally locks the active predecessor, marks it retiring, registers the pending successor with the next key version, and activates the successor. Database uniqueness prevents simultaneous active keys for a tenant/purpose/scope. Provider registration contains no private key bytes.

