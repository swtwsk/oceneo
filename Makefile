all: init deploy

deploy: init
	$(MAKE) -C src all

init:
	docker swarm init || echo "Swarm already initialized"
	docker network create -d overlay jnp-internal-1 || echo "Network already initialized"

clean:
	docker service rm $$(docker service ls -q)
	docker network rm jnp-internal-1
	docker swarm leave --force
