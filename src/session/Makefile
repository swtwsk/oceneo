build:
	docker-compose build 

start:
	docker-compose up -d --force-recreate

stop:
	docker-compose rm -f
	docker-compose stop
	
deploy:
	docker stack deploy -c docker-compose.yml session
