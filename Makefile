SHA := $(shell git rev-parse --short HEAD)
REPO_NAME := jpoage1/expressjs-blog
IMAGE := $(REPO_NAME):latest
PORT := 3000

export BUILD_SHA=$(SHA)

GIT_ASSETS := deployment src content package.json yarn.lock shell.nix requirements.txt \
              favicon-shell.nix ecosystem.config.js .gitignore Jenkinsfile Dockerfile Dockerfile.dev

.PHONY: build run logs stop push deploy release commit-push amends push-repo help

build:
	docker compose build app

run:
	docker compose up app

logs:
	docker compose logs -f app

stop:
	docker compose down

push:
	docker compose push app
	docker tag $(IMAGE) $(REPO_NAME):$(SHA)
	docker push $(REPO_NAME):$(SHA)

deploy:
	k3s ctr images import <(docker save $(IMAGE))
	kubectl rollout restart deployment/expressjs-blog -n production

release: build push deploy

commit-push:
	git add $(GIT_ASSETS)
	@if [ -n "$(AMEND)" ]; then \
		git commit --amend; \
	else \
		git commit; \
	fi
	git push deployment --force

amends:
	git commit --amend

push-repo:
	git push

help:
	@echo "Usage: make [target] [AMEND=1]"
	@echo "Targets:"
	@echo "  build       Build via docker compose"
	@echo "  run         Run via docker compose"
	@echo "  logs        Follow docker compose logs"
	@echo "  stop        Stop docker compose services"
	@echo "  push        Push to registry (latest + SHA tag)"
	@echo "  deploy      K3s import and rollout restart"
	@echo "  release     build -> push -> deploy"
	@echo "  commit-push Stage and push to deployment remote"
	@echo "  amends      Amend last commit"
	@echo "  push-repo   Push to origin"
