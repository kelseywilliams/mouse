# Mouse
## Description 
Mouse is a public lobby for mouse cursors built in nodejs.  The cursor position of each connected user is broadcast to every other user. This project started as an exercise in pubsub and socket programming and ended with dream of becoming a very bad club penguin.

## Dependencies
You will need
- Redis database with an authorized user
- .env file in /home 

### Redis Database
A database must be ran unencrypted on any port and the user chosen to authorize requests must have pubsub permissions on all channels.  
The user and permissions must be set in the database.  Mouse will access redis via url, passing the user and its password to the database.  The url will be defined in .env

### .env
defines
- REDIS_URL=redis://worker:password5@redis:6379
- MAX_CONN=X

being the redis connection url and the server cap respectively

## Starting the server
Start mouse with
`docker-compose up`

## Logging
Logging is done via winston and the winston-daily-rotary-logs and placed in /home/backend/logs
