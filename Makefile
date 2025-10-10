SHELL := /bin/bash

.PHONY: test e2e diag cli-stepping repl-stepping repl-demo

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

