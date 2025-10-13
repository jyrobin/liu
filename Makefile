SHELL := /bin/bash

.PHONY: test e2e diag cli-stepping repl-stepping repl-demo finance-web finance-run

test:
	npm --prefix . test

e2e:
	npm --prefix . run e2e

diag:
	node tests/diagnostics-test.js

cli-stepping:
	bash tests/cli-stepping-test.sh

repl-stepping:
	bash tests/repl-stepping-test.sh

repl-demo:
	node bin/liu.js --domain-root examples/domain repl --workspace examples/workspace --script examples/scripts/demo.txt

finance-web:
	node examples/finance/web/server.js

finance-run:
	FINANCE_WEB_URL=http://localhost:5180 \
	FINANCE_SESSION_STORE=$(PWD)/examples/finance/workspace/.finance-sessions.json \
	node bin/liu.js --domain-root examples/finance/domain run-plan ohlc_chart --workspace examples/finance/workspace --run-id ohlc_demo --force

.PHONY: finance-list-sessions
finance-list-sessions:
	@curl -s http://localhost:5180/api/sessions | jq .

.PHONY: finance-session-demo
finance-session-demo: finance-web
	# In another terminal, open http://localhost:5180 and connect to session named 'aapl-demo' from the list
	FINANCE_WEB_URL=http://localhost:5180 \
	FINANCE_SESSION_STORE=$(PWD)/examples/finance/workspace/.finance-sessions.json \
	node bin/liu.js --domain-root examples/finance/domain run-plan ohlc_chart --workspace examples/finance/workspace --run-id aapl_demo --force

.PHONY: finance-session-init
finance-session-init:
	FINANCE_WEB_URL=http://localhost:5180 \
	FINANCE_SESSION_STORE=$(PWD)/examples/finance/workspace/.finance-sessions.json \
	FIN_SESSION_NAME=aapl-demo \
	FIN_SESSION_TITLE="AAPL OHLC (Past Month)" \
	node bin/liu.js --domain-root examples/finance/domain run-plan init_session --workspace examples/finance/workspace --run-id sess_init --force

.PHONY: finance-session-send
finance-session-send:
	FINANCE_WEB_URL=http://localhost:5180 \
	FINANCE_SESSION_STORE=$(PWD)/examples/finance/workspace/.finance-sessions.json \
	FIN_TEXT_TITLE="Note" \
	FIN_TEXT="Hello from Liu plan." \
	node bin/liu.js --domain-root examples/finance/domain run-plan send_text --workspace examples/finance/workspace --run-id send_text --force

.PHONY: finance-session-ohlc-active
finance-session-ohlc-active:
	FINANCE_WEB_URL=http://localhost:5180 \
	FINANCE_SESSION_STORE=$(PWD)/examples/finance/workspace/.finance-sessions.json \
	node bin/liu.js --domain-root examples/finance/domain run-plan ohlc_chart_active --workspace examples/finance/workspace --run-id ohlc_active --force

.PHONY: finance-session-winbox
finance-session-winbox:
	FINANCE_WEB_URL=http://localhost:5180 \
	FINANCE_SESSION_STORE=$(PWD)/examples/finance/workspace/.finance-sessions.json \
	node bin/liu.js --domain-root examples/finance/domain run-plan winbox_windows --workspace examples/finance/workspace --run-id winbox_demo --force

.PHONY: finance-session-winbox-chart
finance-session-winbox-chart:
	FINANCE_WEB_URL=http://localhost:5180 \
	FINANCE_SESSION_STORE=$(PWD)/examples/finance/workspace/.finance-sessions.json \
	node bin/liu.js --domain-root examples/finance/domain run-plan winbox_and_chart --workspace examples/finance/workspace --run-id winbox_chart --force

.PHONY: finance-session-delete
finance-session-delete:
	@echo Deleting session: $(SID)
	@curl -s -X POST http://localhost:5180/api/session/delete -H 'content-type: application/json' -d '{"sessionId":"$(SID)"}' | jq .

# --- Full finance (top-level) ---
.PHONY: finance-full-web
finance-full-web:
	node finance/server/server.js

.PHONY: finance-full-list-sessions
finance-full-list-sessions:
	@curl -s http://localhost:5280/api/sessions | jq .

.PHONY: finance-full-run
# Usage: make -C liu finance-full-run PLAN=market_filings_demo SID=<sessionId>
finance-full-run:
	FINANCE_WEB_URL=http://localhost:5280 \
	FINANCE_SESSION_STORE=$(PWD)/finance/workspace/.finance-sessions.json \
	FIN_SESSION_NAME=web \
	FIN_SESSION_TITLE="Web Demo" \
	FIN_SESSION_ID=$(SID) \
	node bin/liu.js --domain-root finance/domain run-plan $(PLAN) --workspace finance/workspace --run-id cli_$$(date +%s) --force
