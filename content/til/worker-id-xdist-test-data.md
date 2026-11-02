---
title: "worker_id is all you need to isolate xdist test data"
date: "2026-10-24"
tags: ["python", "pytest-xdist", "parallel"]
draft: false
---

The `worker_id` fixture in pytest-xdist is `"master"` in solo runs and `"gw0"`, `"gw1"`, …
during parallel runs. It's the cheapest way to make test data worker-unique:

```python
@pytest.fixture
def user_name(worker_id):
    return f"e2e_user_{worker_id}"
```

One line, and two workers never fight over the same staging account. I use it more often than
any `-n` flag.
