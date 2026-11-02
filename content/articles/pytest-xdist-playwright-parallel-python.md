---
title: "Parallel Python Playwright: pytest-xdist Done Right"
description: "Running Playwright UI tests in parallel with pytest is one flag — running them *reliably* in CI is a morning of config. Here's the config that survives, with the traps flagged."
date: "2026-10-19"
category: "tutorials"
tags: ["python", "playwright", "pytest-xdist", "parallel"]
difficulty: "Intermediate"
draft: false
---

`pytest -n auto` is the fastest demo in the Python testing world and the most misleading. One
flag, four workers, everything green. Then you push it to CI and the same suite fails on a
shared staging account, clobbers per-worker downloads, or passes solo and dies on four workers.

Here's the setup I land on for pytest-playwright suites, and the traps each piece avoids.

## The one flag, and what it really costs

```bash
pip install pytest-playwright pytest-xdist
pytest -n 4 --browser chromium
```

`-n 4` starts four pytest processes. Each process runs its own Playwright browser instance —
that's the isolation model. What xdist *doesn't* isolate is anything your test code shares:
files written to fixed paths, environment variables, test data in a staging API, one user
account logging in from four workers at once.

## Trap 1 — fixed temp paths collide

Inside a test, get your scratch space from pytest, never from a hardcoded path:

```python
def test_export_report(page, tmp_path):
    page.goto("/reports")
    with page.expect_download() as dl:
        page.get_by_role("button", name="Export CSV").click()

    # tmp_path is unique per test AND per worker — no two tests collide
    target = tmp_path / "report.csv"
    dl.value.save_as(str(target))
    assert target.stat().st_size > 0
```

## Trap 2 — test data that only exists once

If two workers both register "smoke_user_001", the third run fails with a duplicate error on
random workers — the worst kind of flake. Make identities worker-unique:

```python
import pytest

@pytest.fixture
def isolated_user(worker_id, request):
    # xdist gives gw0..gwN; solo runs get "master"
    suffix = "" if worker_id == "master" else f"_{worker_id}"
    user = request.getfixturevalue("api_client")
    return user.create(f"e2e_smoke{suffix}@example.test")
```

Better still: make the fixture create-then-delete (`yield` then cleanup), so repeated runs
never accumulate.

## Trap 3 — logs and screenshots on failure

With four workers interleaving output, `--headed` debugging is meaningless and artifacts overwrite each other. Point Playwright's artifacts at worker-unique directories:

```python
# conftest.py
import pytest

@pytest.fixture(scope="session")
def browser_type_launch_args(browser_type_launch_args, pytestconfig):
    # keep defaults, only where you need to change
    return {**browser_type_launch_args}
```

and in `pytest.ini` (or `pyproject.toml`):

```ini
[pytest]
addopts =
    -n 4
    --screenshot only-on-failure
    --video retain-on-failure
    --output test-results
    --tracing retain-on-failure
```

pytest-playwright writes per-test subdirectories under `test-results/` keyed by test name and
worker, so parallel runs don't clobber each other — one of the quiet reasons to prefer it over
hand-rolled selenium-grid-style setups for Python teams.

## Trap 4 — the distribution is uneven

xdist scatters tests by file chunking by default. If `test_checkout.py` holds your three
slowest E2E journeys, four workers still wait on one. Two levels of fix:

1. Keep suites time-balanced (move slow journeys into their own files), or
2. Use `--dist loadscope` to group by module, so session-scoped fixtures stay hot while still
   spreading files across workers.

```bash
pytest -n 4 --dist loadscope
```

## What I actually run in CI

```bash
pytest -n 4 --dist loadscope \
  --screenshot only-on-failure \
  --tracing retain-on-failure \
  --junitxml=report.xml \
  -m "not manual"
```

- **Workers = 4**, not `auto`. CI runners share fewer cores than your laptop pretends; four
  reproducible beats eight flaky.
- **`loadscope`** keeps session fixtures warm.
- **Artifacts on failure only** — free-tier disk is not infinite.
- Sessions that log in via API instead of UI run in half the time and stop the single most
  common source of parallel login flakes entirely.

Start there, and only add `--headed` and `--video` locally when chasing a specific failure.
Parallelization is a config problem, not a framework problem — but it's a config problem with
sharp edges, and each one above has cost some team somewhere a weekend.
