.PHONY: dev lint format test docker-up docker-down check-db install

# ── Development ──────────────────────────────────────────────────────────────

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

# ── Code Quality ─────────────────────────────────────────────────────────────

lint:
	ruff check app/

format:
	ruff format app/

# ── Testing ──────────────────────────────────────────────────────────────────

test:
	pytest tests/ -v --tb=short

check-db:
	python scripts/check_db.py

# ── Dependencies ─────────────────────────────────────────────────────────────

install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements.txt -r requirements-dev.txt

# ── Docker ───────────────────────────────────────────────────────────────────

docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f
