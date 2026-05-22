SHELL := /bin/bash
SHA := $(shell git rev-parse --short HEAD)
REPO_NAME := jpoage1/expressjs-blog
IMAGE := $(REPO_NAME):latest
PORT := 3000
CONTAINER ?= express-blog
export BUILD_SHA=$(SHA)

GIT_ASSETS := $(shell grep -v '^\s*#' .git-assets | grep -v '^\s*$$' | tr '\n' ' ')

.PHONY: kill build run logs stop save rollout push-local push-registry deploy release commit-push amends push-repo help

kill:
	docker stop $(CONTAINER)
	docker rm  $(CONTAINER)

shell:
	docker run -it --rm -p 3000:3000 docker.io/jpoage1/expressjs-blog:latest /bin/sh

fresh-shell: kill
	docker run -it --rm -p 3000:3000 docker.io/jpoage1/expressjs-blog:latest /bin/sh

build:
	yarn install
	docker compose -f docker-compose.yaml build app

build-shell: build fresh-shell

run-bare:
	docker run -d -p 3000:3000 --name express-blog docker.io/jpoage1/expressjs-blog:latest

run:
	docker compose up app

logs:
	docker compose logs -f app

stop:
	docker compose down

save:
	docker save $(IMAGE) | sudo k3s ctr images import -

rollout:
	kubectl rollout restart deployment/expressjs-blog -n production

push-local-build: build save rollout
push-local: save rollout

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
