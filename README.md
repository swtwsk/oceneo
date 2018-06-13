# System oceniania produktów (Oceneo)
Projekt przygotowany na przedmiot **Języki i Narzędzia Programowania 2 - Docker** w semestrze letnim II roku studiów na **Uniwersytecie Warszawskim**

## Technologie
Docker, Python, Flask, Redis, Nginx

## Uruchomienie
### Wymagania
```
docker
docker-compose
```
### Instalacja
```
make
```
Przed pierwszym uruchomieniem warto "z palca" wykonać polecenie ```docker swarm init```, by sprawdzić, czy nie trzeba ręcznie ustalić adresu IP dla _docker swarma_ i ewentualnie zmodyfikować plik Makefile.
Przy każdym kolejnym uruchomieniu wystarczy wykonać ```make``` i poczekać na zbudowanie wszystkich kontenerów (Makefile działa rekursywnie).
### Zatrzymanie
```
make clean
```

