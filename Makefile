ROOT ?= dist

WORKFLOW=.github/workflows/deploy.yml

.PHONY: pages

pages:
	@mkdir -p .github/workflows
	@echo "Generating Pages workflow root=$(ROOT)"

	@printf '%s\n' \
'name: Deploy Vite React' \
'' \
'on:' \
'  push:' \
'    branches: [main]' \
'' \
'permissions:' \
'  contents: read' \
'  pages: write' \
'  id-token: write' \
'' \
'jobs:' \
'  build:' \
'    runs-on: ubuntu-latest' \
'    steps:' \
'      - uses: actions/checkout@v4' \
'      - uses: actions/setup-node@v4' \
'        with:' \
'          node-version: 20' \
'      - run: npm ci' \
'      - run: npm run build' \
'      - uses: actions/upload-pages-artifact@v3' \
'        with:' \
'          path: ./$(ROOT)' \
'' \
'  deploy:' \
'    needs: build' \
'    runs-on: ubuntu-latest' \
'    steps:' \
'      - uses: actions/deploy-pages@v4' \
> $(WORKFLOW)

	@echo "Created $(WORKFLOW)"
