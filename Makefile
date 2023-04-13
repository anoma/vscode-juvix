irosyntaxes = $(shell find syntaxes/ -name "*.iro")
MAKEFLAGS?= -j 4
MAKE?=make $(MAKEFLAGS)

.PHONY: all
all:
	@npm install \
		&& npm run compile \
		&& vsce package

.PHONY: syntaxes
syntaxes: $(irosyntaxes:.iro=.tmLanguage)

%.tmLanguage: %.iro
	@iro -t $< -o syntaxes

PRECOMMIT := $(shell command -v pre-commit 2> /dev/null)

.PHONY : install-pre-commit
install-pre-commit :
	@$(if $(PRECOMMIT),, pip install pre-commit)

.PHONY : pre-commit
pre-commit :
	@pre-commit run --all-files
