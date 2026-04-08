---
title: Testing and Releases
---

# Testing and Release Discipline

The current stack is validated in layers. Release work is not complete until the
whole chain is green.

## 1. Compiler gate

The authoritative compiler gate is:

```bash
./test/scripts/run-all.sh
```

This covers:

- frontend tests
- emitter tests and goldens
- CLI tests
- typecheck fixtures
- end-to-end .NET fixtures
- negative fixtures

The full suite is the real gate. Faster subsets are useful while iterating, but
they are not the final release signal.

## 2. Package selftests

First-party packages carry package-local verification where appropriate:

- `js`
- `nodejs`
- `express`

Those gates matter because a package-local API matrix can fail even when no
downstream app happens to hit the broken path.

Typical commands:

```bash
bash scripts/selftest.sh
```

## 3. Downstream verification

The release bar includes real application repos:

- `proof-is-in-the-pudding`
- `tsumo`
- `clickmeter`
- Jotster

These catch integration failures that unit tests cannot:

- startup failures
- request/response bugs
- package graph mismatches
- binding regressions
- publish/runtime issues

Typical commands:

```bash
bash scripts/verify-all.sh
```

These downstream verification scripts are normally run against local sibling
repos during a wave, not against a random mix of published npm package
versions. That matters because a release wave often spans:

- compiler changes in `tsonic`
- first-party source-package changes in `js`, `nodejs`, or `express`
- regenerated CLR binding packages from `tsbindgen`
- downstream applications that consume all of the above together

## 4. Binding-package regeneration

`tsbindgen` is part of the release flow, not just a local codegen tool.

When compiler, runtime, or CLR-shape changes affect bindings, the normal flow
is:

1. regenerate affected binding repos
2. validate those packages locally
3. rerun compiler and downstream gates
4. publish only after the wave is coherent

## 5. Version drift and publish preflight

The stack now checks release drift explicitly:

- is local content ahead of the published version?
- did content change without a version bump?
- is the whole wave internally consistent before publish?

This avoids silent republish at the same version and makes release waves
explicit.

## 6. Wave publish

The current wave process is:

1. get `tsonic` green
2. get first-party source packages green
3. rerun downstream applications
4. regenerate binding packages if needed
5. bump versions where content drift requires it
6. publish the coherent wave

## Why the process is strict

This stack is tightly coupled:

- compiler changes can alter emitted package boundaries
- source-package changes can affect runtime behavior and manifests
- binding-package changes can affect overload resolution and CLR interop
- downstream apps expose the combined behavior of all of the above

That is why the current documentation treats release work as an ecosystem-level
decision instead of a set of isolated repo actions.
