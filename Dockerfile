FROM ubuntu

RUN apt update
RUN apt upgrade -y

RUN apt install bash curl -y

# install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# need a new shell
RUN bash 

RUN curl -o- https://deb.nodesource.com/setup_22.x | bash

RUN apt update -y && apt install nodejs -y

# install ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app
