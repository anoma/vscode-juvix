MAKEFLAGS?= -j 4
MAKE?=make $(MAKEFLAGS)
VSCE?=vsce

.PHONY: all
all:
	@npm install \
		&& npm run compile \
		&& $(VSCE) package

PRECOMMIT := $(shell command -v pre-commit 2> /dev/null)

.PHONY : install-pre-commit
install-pre-commit :
	@$(if $(PRECOMMIT),, pip install pre-commit)

.PHONY : pre-commit
pre-commit :
	@pre-commit run --all-files
