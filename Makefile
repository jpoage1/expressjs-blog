SHA := $(shell git rev-parse --short HEAD)
REPO_NAME := jpoage1/expressjs-blog
IMAGE := $(REPO_NAME):latest
CONTAINER_NAME := blog-test
PORT := 3000

# Git Assets
GIT_ASSETS := deployment src content package.json yarn.lock shell.nix requirements.txt \
              favicon-shell.nix ecosystem.config.js .gitignore Jenkinsfile Dockerfile Dockerfile.dev

export BUILD_SHA=$(SHA)

.PHONY: build run logs push deploy release commit-push amends push-repo help

build:
	docker compose build app

run:
	podman run -d \
		--replace \
		--name $(CONTAINER_NAME) \
		-p $(PORT):$(PORT) \
		localhost/$(IMAGE)

logs:
	podman logs -f $(CONTAINER_NAME)

push: build
	docker tag $(IMAGE) $(REPO_NAME):$(SHA)
	docker push $(REPO_NAME):latest
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
	@echo "  run         Run via podman"
	@echo "  logs        Follow podman logs"
	@echo "  push        Build, tag, and push to registry"
	@echo "  deploy      K3s import and rollout"
	@echo "  release     Build -> Push -> Deploy"
	@echo "  commit-push Stage and push to deployment remote"
