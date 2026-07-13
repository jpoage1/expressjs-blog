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

PI_HOST ?= pi@192.168.1.200

export BUILD_SHA=$(SHA)

GIT_ASSETS := $(shell grep -v '^\s*#' .git-assets | grep -v '^\s*$$' | tr '\n' ' ')

.PHONY: kill build run logs stop save rollout push-local push-registry deploy release commit-push amends push-repo help deb deb-amd64 copy-to-pi build-e2e-image e2e e2e-production

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

# Bare-metal .deb pipeline for the Raspberry Pi (parallel to the k8s/Docker
# path above, not a replacement for it). arm64 is the default since that's
# what the Pi runs; deb-amd64 exists for local testing off-device.
deb:
	nix-build -A deb-arm64

deb-amd64:
	nix-build -A deb-amd64

# Copies the built .deb to the Pi. Does NOT install it -- run
# `sudo dpkg -i` / `sudo apt install ./...` on the Pi yourself so you see
# what changes before it happens.
copy-to-pi: deb
	scp result/expressjs-blog-*.deb $(PI_HOST):/tmp/

# Containerized e2e test runner (see scripts/run-pi-e2e.sh): a Nix-built
# Docker image that hits a REAL running instance over the network, DNS
# forced via --add-host so the target hostname always resolves to the Pi
# regardless of the dev box's own DNS. Defaults to the testing instance;
# `make e2e-production` hits the live site.
build-e2e-image:
	nix-build -A e2eTestImage -o result-e2e
	docker load < result-e2e

e2e: build-e2e-image
	./scripts/run-pi-e2e.sh

e2e-production: build-e2e-image
	./scripts/run-pi-e2e.sh --production

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
	@echo "  deb               Build the arm64 .deb for the Raspberry Pi (nix-build -A deb-arm64)"
	@echo "  copy-to-pi        deb -> scp to PI_HOST (default pi@192.168.1.200), does not install"
	@echo "  build-e2e-image   Build+load the Nix/Docker e2e test runner image"
	@echo "  e2e               build-e2e-image -> run against the testing instance (test.jasonpoage.com)"
	@echo "  e2e-production    build-e2e-image -> run against the live site (jasonpoage.com)"
	@echo "  commit-push       Stage git assets and push to deployment remote"
	@echo "  amends            Amend last commit"
	@echo "  push-repo         Push to origin"
	@echo "Examples:"
	@echo "  make build ARCH=amd64"
	@echo "  make release-registry REGISTRY=registry.jasonpoage.com"
	@echo "  make push-registry REGISTRY=thinkpadt14.jasonpoage.com ARCH=arm64"
	@echo "  make deb"
	@echo "  make copy-to-pi PI_HOST=pi@192.168.1.200"
	@echo "  make e2e-production"

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
