SHA := $(shell git rev-parse --short HEAD)
IMAGE := jpoage1/expressjs-blog

build:
	BUILD_SHA=$(SHA) docker compose build

push:
	BUILD_SHA=$(SHA) docker compose build
	docker tag $(IMAGE):latest $(IMAGE):$(SHA)
	docker push $(IMAGE):latest
	docker push $(IMAGE):$(SHA)

deploy:
	k3s ctr images import <(docker save $(IMAGE):latest)
	kubectl rollout restart deployment/expressjs-blog -n production

release: build push deploy
