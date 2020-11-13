ARG ARCH='amd64'

FROM ${ARCH}/ubuntu:18.04

ARG ARCH='amd64'
ARG THEIA_IDE_VERSION='v1.6.0'

ENV DEBIAN_FRONTEND=noninteractive

# Install NodeJS
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt update && apt install yarn

# Install additional packages
RUN apt-get update && \
    apt-get install -y git pkg-config && \
    apt-get update && \
    apt-get install -y python \
    python-dev \
    python-pip \
    libx11-dev \
    libxkbfile-dev \
    vim \
    python3-pip \
    libpng-dev \
    iputils-ping \
    libfreetype6-dev \
    sudo \
    unzip \
    wget \
    fonts-powerline \
    apt-transport-https \
    openjdk-11-jdk && \
    apt-get clean && \
    rm -rf /var/cache/apt/* && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/*

# Install Python related packages
RUN pip install \
    python-language-server \
    flake8 \
    autopep8 \
    powerline-shell \
    pylint

# User setup
RUN groupadd -g 1000 developer && \
    useradd -u 1000 -g 1000 -ms /bin/bash developer && \
    usermod -a -G sudo developer && \
    usermod -a -G users developer && \
    echo 'developer:developer' | chpasswd && \
    chown developer:developer /home/developer -R

COPY resources/.bashrc /root/.bashrc
RUN echo 'export PATH="$PATH:/home/developer/.cargo/bin"' >> /root/.profile

WORKDIR /home/developer

RUN mkdir -p theia

COPY . ./theia

RUN cd theia && yarn

RUN cd theia && yarn theia download:plugins

USER developer
WORKDIR /home/developer/theia/browser-app

EXPOSE 3000
ENV SHELL=/bin/bash \
    THEIA_DEFAULT_PLUGINS=local-dir:/home/developer/theia/plugins
ENTRYPOINT [ "../spawn_processes.sh" ]
