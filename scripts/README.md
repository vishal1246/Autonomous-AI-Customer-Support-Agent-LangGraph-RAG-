# scripts/

Developer utilities and one-off tooling scripts. These are **not** part of the application runtime.

| File | Purpose |
|------|---------|
| `check_db.py` | Verify MongoDB Atlas connectivity and vector search works end-to-end |
| `test_main.http` | IntelliJ / VS Code REST Client request samples |

## Running

```bash
# From project root (needs .env loaded)
python scripts/check_db.py
```
