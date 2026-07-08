SHELL := /bin/bash
SHA := $(shell git rev-parse --short HEAD)
ARCH := amd64
TAG := latest

REGISTRY  ?= registry.jasonpoage.com
REPO_NAME := jpoage1/expressjs-blog
IMG       := $(REGISTRY)/$(REPO_NAME)
IMAGE := $(REPO_NAME):latest

PORT := 3000
CONTAINER ?= boring_rhodes


export BUILD_SHA=$(SHA)

GIT_ASSETS := $(shell grep -v '^\s*#' .git-assets | grep -v '^\s*$$' | tr '\n' ' ')

.PHONY: kill build run logs stop save rollout push-local push-registry deploy release commit-push amends push-repo help

dev:
	docker run -it --rm \
		-p 3000:3000 \
		-v $(PWD)/src:/app/src \
		-v $(PWD)/content:/app/content \
		-e NODE_ENV=development \
		$(IMG):$(TAG)

kill:
	docker stop $(CONTAINER)
	docker rm  $(CONTAINER)

shell:
	docker run -it --rm -p 3000:3000 docker.io/jpoage1/expressjs-blog:latest /bin/sh

fresh-shell: kill
	docker run -it --rm -p 3000:3000 docker.io/jpoage1/expressjs-blog:latest /bin/sh

build:
	REGISTRY=$(REGISTRY) docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-f Dockerfile \
		--tag $(IMG):$(TAG) \
		--tag $(IMG):$(SHA) \
		--push \
		../..

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

push-registry: build

release-local:
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-f Dockerfile \
		--tag $(IMG):$(TAG) \
		--tag $(IMG):$(SHA) \
		--output type=oci,dest=/tmp/expressjs-blog.tar \
		../.. && \
	sudo k3s ctr -n k8s.io images import /tmp/expressjs-blog.tar

release-registry: build

push-chart:
	@if grep -q '^dependencies:' chart/Chart.yaml 2>/dev/null; then \
		helm dependency update chart; \
	fi; \
	tmp=$$(mktemp -d); \
	helm package chart -d $$tmp; \
	helm push $$tmp/*.tgz oci://$(REGISTRY)/charts; \
	rm -rf $$tmp

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
	@echo "Examples:"
	@echo "  make build ARCH=amd64"
	@echo "  make release-registry REGISTRY=registry.jasonpoage.com"
	@echo "  make push-registry REGISTRY=thinkpadt14.jasonpoage.com ARCH=arm64"

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
