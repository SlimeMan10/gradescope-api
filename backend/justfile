# use PowerShell instead of sh when on Windows:
set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# List all recipes
list:
  @just --list

# Run unit/integration tests
test:
    uv run -- pytest tests
_test-cov-generate-report:
    uv run -- coverage run --source=gradescopeapi --module pytest tests
_test-cov-generate-html: _test-cov-generate-report
    uv run -- coverage html --omit=src/gradescopeapi/api/*,src/gradescopeapi/_config/*
_test-cov-view-html:
    uv run -- python -m http.server 9000 --directory htmlcov
_test-cov-open-html:
    uv run -- python -m webbrowser -t 'http://localhost:9000'
# Run tests and open coverage report in browser
test-cov: _test-cov-generate-html _test-cov-generate-report _test-cov-open-html _test-cov-view-html

# Lint src and tests directories
lint:
    uv run -- ruff check src tests
# Lint and auto fix src and tests directories
lint-fix:
    uv run -- ruff check --fix src tests

# Format Python and markdown files
format: _format-python _format-markdown
_format-python:
    uv run -- ruff format src tests
_format-markdown:
    uv run -- mdformat docs README.md

# Export project and dependencies to separate requirements files
export: _export-requirements _export-requirements-dev
_export-requirements:
    uv export --output-file requirements.txt --no-dev --locked --quiet
_export-requirements-dev:
    uv export --output-file requirements.dev.txt --only-dev --locked --quiet
