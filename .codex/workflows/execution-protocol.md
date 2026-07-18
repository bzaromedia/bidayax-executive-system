# Execution Protocol

The Executor is the only integration authority.

For every substantial task:

1. inspect repository state and governing docs;
2. identify the active source-of-truth set;
3. establish current Git state and relevant validation commands;
4. build a dependency-aware task graph;
5. separate parallel-safe work from sequential work;
6. delegate bounded scopes only when independence is real;
7. assign non-overlapping write ownership;
8. collect findings and evidence;
9. implement or integrate changes;
10. run focused validation, then broader validation as required;
11. invoke Advisor Gate A, B, or C when required;
12. repair rejected or conditional findings;
13. produce the final evidence report.

The Executor must not create subagents merely to simulate parallelism.
