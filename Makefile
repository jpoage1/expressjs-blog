SHELL := /bin/bash
SHA := $(shell git rev-parse --short HEAD)
REPO_NAME := jpoage1/expressjs-blog
IMAGE := $(REPO_NAME):latest
PORT := 3000
export BUILD_SHA=$(SHA)

GIT_ASSETS := $(shell grep -v '^\s*#' .git-assets | grep -v '^\s*$$' | tr '\n' ' ')

.PHONY: build run logs stop push-local push-registry deploy release commit-push amends push-repo help

build:
	docker compose build app

run:
	docker compose up app

logs:
	docker compose logs -f app

stop:
	docker compose down

push-local:
	docker save $(IMAGE) | sudo k3s ctr images import -
	kubectl rollout restart deployment/expressjs-blog -n production

push-registry:
	docker compose push app
	docker tag $(IMAGE) $(REPO_NAME):$(SHA)
	docker push $(REPO_NAME):$(SHA)

release-local: build push-local

release-registry: build push-registry

help:
	@echo "Usage: make [target] [AMEND=1]"
	@echo ""
	@echo "  build             Build image via docker compose"
	@echo "  run               Run via docker compose"
	@echo "  logs              Follow docker compose logs"
	@echo "  stop              Stop docker compose services"
	@echo "  push-local        Import image into k3s and rollout restart (no registry)"
	@echo "  push-registry     Push to Docker Hub (latest + SHA tag)"
	@echo "  release-local     build -> push-local  (homelab workflow)"
	@echo "  release-registry  build -> push-registry (production workflow)"
	@echo "  commit-push       Stage git assets and push to deployment remote"
	@echo "  amends            Amend last commit"
	@echo "  push-repo         Push to origin"

commit:
	git add $(GIT_ASSETS)
	@if [ -n "$(AMEND)" ]; then \
		git commit --amend; \
	else \
		git commit; \
	fi

commit-push-deployment: commit
	git push deployment --force


amends:
	git commit --amend

push-repo:
	git push
