# Canonicalization Standard

`bidayax-c14n-1` recursively sorts NFC-normalized object keys, preserves array order, normalizes timestamp-shaped strings to UTC, preserves explicit nulls, and accepts only safe integers. Decimal quantities use strings.

Undefined, functions, symbols, bigint, binary values, floats, unsafe/non-finite numbers, cycles, accessors, sparse arrays, non-plain objects, normalized-key collisions, unsupported versions, and oversized payloads are rejected.

