FROM kalilinux/kali-rolling

LABEL org.opencontainers.image.title="HackerAI Agent Sandbox"
LABEL org.opencontainers.image.description="AI Agent Penetration Testing Environment with Comprehensive Automated Tools"
LABEL org.opencontainers.image.source="https://github.com/hackerai-tech/hackerai"
LABEL org.opencontainers.image.vendor="HackerAI"

# ============================================================================
# Environment Variables
# ============================================================================
ENV DEBIAN_FRONTEND=noninteractive
ENV HOME=/home/user
ENV GOPATH=/home/user/go
ENV GOCACHE=/home/user/go/.cache
ENV PATH=/home/user/.local/bin:/usr/local/go/bin:/home/user/go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# ============================================================================
# dpkg slimming — never install documentation, manpages, locales, etc.
# Applied before any apt install so every package layer is genuinely smaller
# (deleting these in a later layer would NOT reclaim build disk).
# ============================================================================
RUN { \
      echo 'path-exclude /usr/share/doc/*'; \
      echo 'path-include /usr/share/doc/*/copyright'; \
      echo 'path-exclude /usr/share/man/*'; \
      echo 'path-exclude /usr/share/groff/*'; \
      echo 'path-exclude /usr/share/info/*'; \
      echo 'path-exclude /usr/share/lintian/*'; \
      echo 'path-exclude /usr/share/locale/*'; \
    } > /etc/dpkg/dpkg.cfg.d/01_nodoc

# ============================================================================
# Base System Setup (use default Kali CDN mirror - auto-routes to healthy mirrors)
# ============================================================================
RUN apt-get update && \
    apt-get install -y kali-archive-keyring sudo && \
    apt-get update && \
    apt-get upgrade -y

# ============================================================================
# Core System Packages
# ============================================================================
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # Essential utilities
    curl \
    wget \
    git \
    ca-certificates \
    gnupg2 \
    unzip \
    jq \
    tree \
    perl \
    sudo \
    # Build tools
    build-essential \
    gcc \
    g++ \
    make \
    cmake \
    pkg-config \
    binutils \
    # Python stack
    python3 \
    python3-venv \
    python3-pip \
    python3-dev \
    python-is-python3 \
    libffi-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    libglib2.0-dev \
    # Ruby stack
    ruby-full \
    ruby-dev \
    libnet-ssleay-perl \
    libio-socket-ssl-perl \
    libcrypt-ssleay-perl \
    libssl-dev \
    # Network utilities
    iputils-ping \
    dnsutils \
    iproute2 \
    net-tools \
    traceroute \
    netcat-traditional \
    tcpdump \
    # Search tools
    ripgrep \
    # Text editors
    vim \
    nano \
    less \
    # Network scanning & enumeration (from Kali repos - pre-compiled!)
    nmap \
    naabu \
    nikto \
    whatweb \
    wafw00f \
    # Web vulnerability scanners
    sqlmap \
    wapiti \
    wpscan \
    # DNS/subdomain enumeration
    subfinder \
    dnsrecon \
    dnsenum \
    # Web fuzzing & discovery
    ffuf \
    arjun \
    gobuster \
    dirsearch \
    # SMB/NetBIOS tools
    smbclient \
    smbmap \
    nbtscan \
    python3-impacket \
    enum4linux \
    # Active Directory/Windows tools (Linux-compatible)
    ldap-utils \
    crackmapexec \
    python3-ldap3 \
    python3-asn1crypto \
    python3-dnspython \
    python3-requests \
    python3-pyasn1 \
    # Mobile security tools
    adb \
    apktool \
    # Cloud security tools
    awscli \
    azure-cli \
    # API security tools
    wfuzz \
    burpsuite \
    # Network discovery
    hping3 \
    arp-scan \
    # Utilities
    socat \
    proxychains4 \
    seclists \
    hashid \
    libimage-exiftool-perl \
    cewl \
    # SSL/TLS testing
    testssl.sh \
    # Web crawling & recon
    gospider \
    nuclei \
    # Authentication/bruteforce
    hydra \
    # Programming languages
    golang \
    nodejs \
    npm \
    tmux \
    # Forensics
    binwalk \
    foremost \
    # Document conversion
    pandoc \
    poppler-utils \
    # Web application security scanner
    zaproxy \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# ============================================================================
# WhatWeb Ruby Library Symlink Fix
# ============================================================================
RUN set -eux; \
    if command -v whatweb >/dev/null 2>&1; then \
      mkdir -p /usr/bin/lib; \
      if ls /usr/lib/ruby/vendor_ruby/*.rb >/dev/null 2>&1; then \
        ln -sf /usr/lib/ruby/vendor_ruby/*.rb /usr/bin/lib/; \
      fi; \
    fi

# ============================================================================
# User Setup
# ============================================================================
RUN (id -u user >/dev/null 2>&1 || useradd --create-home --shell /bin/bash user) && \
    usermod -aG sudo user && \
    echo 'user ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers && \
    mkdir -p /home/user/upload /home/user/go && \
    chown -R user:user /home/user

WORKDIR /home/user

# Ensure Go bin paths are in PATH for login shells (su - user, bash -l)
RUN echo 'export PATH=/home/user/.local/bin:/usr/local/go/bin:/home/user/go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin${PATH:+:$PATH}' \
    > /etc/profile.d/00-hackerai-path.sh && chmod 644 /etc/profile.d/00-hackerai-path.sh

# ============================================================================
# Python Packages for Document Generation & Security Tools
# ============================================================================
RUN pip3 install --break-system-packages --ignore-installed --no-compile \
    reportlab \
    python-docx \
    openpyxl \
    python-pptx \
    pandas \
    pypandoc \
    odfpy

# Additional security-focused Python packages
RUN pip3 install --break-system-packages --ignore-installed --no-compile requests aiohttp jinja2 httpx ratelimit pycryptodomex

# Active Directory Python tools
RUN pip3 install --break-system-packages --ignore-installed --no-compile \
    ldapdomaindump \
    adidnsdump \
    kerberoast \
    impacket \
    bloodhound

# ============================================================================
# Google Cloud CLI (provides `gcloud`) — installed from the official apt repo
# since `google-cloud-sdk` is not available in the Kali repositories.
# ============================================================================
RUN set -eux; \
    curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" > /etc/apt/sources.list.d/google-cloud-sdk.list && \
    apt-get update && apt-get install -y --no-install-recommends google-cloud-cli && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Mobile Security Python tools
RUN pip3 install --break-system-packages --ignore-installed --no-compile \
    frida-tools \
    objection \
    androguard

# Cloud Security Python tools
# Note: cloud-nuke (Go) and cloudsploit (Node) are not PyPI packages and are
# intentionally omitted here. ScoutSuite is the primary multi-cloud auditor.
# pacu and prowler are intentionally omitted: they bundle duplicate multi-cloud
# SDK stacks (aws/azure/gcp) that exceed the build disk budget and are already
# largely covered by ScoutSuite + the aws/az/gcloud CLIs.
RUN pip3 install --break-system-packages --ignore-installed --no-compile ScoutSuite

# API Security Python tools
# Note: swagger-codegen-cli (Java), graphql-path-enum (GitLab-only) and
# graphql-cop (GitHub-only) are not on PyPI and are omitted.
RUN pip3 install --break-system-packages --ignore-installed --no-compile \
    graphql-core

# Reporting & CVSS tools
RUN pip3 install --break-system-packages --ignore-installed --no-compile \
    cvss \
    jinja2

# Vulnerability Database tools
RUN pip3 install --break-system-packages --ignore-installed --no-compile \
    cve-searchsploit \
    mitreattack-python \
    requests

# Threat Intelligence tools
RUN pip3 install --break-system-packages --ignore-installed --no-compile \
    shodan \
    vt-py \
    python-abuseipdb

# Visual Recon tools
# Note: chromium + xvfb + EyeWitness (web screenshotting) are intentionally
# omitted — the headless browser stack (~1GB) exceeds the build disk budget.
# HTTP recon is still covered by httpx, whatweb, gospider, katana, etc.

# Payload Management tools
RUN pip3 install --break-system-packages --ignore-installed --no-compile \
    pwntools \
    pyinstaller

# Evidence Collection tools
RUN apt-get update && apt-get install -y \
    python3-tk \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Note: hashlib is part of the Python standard library; the PyPI "hashlib"
# package is a broken Python 2 backport and is omitted.
RUN pip3 install --break-system-packages --ignore-installed --no-compile \
    tzdata

# ============================================================================
# Git-based Security Tools
# ============================================================================
RUN set -eux; \
    # JWT analysis tool
    git clone --depth 1 https://github.com/ticarpi/jwt_tool.git /opt/jwt_tool || true && \
    if [ -f /opt/jwt_tool/jwt_tool.py ]; then chmod +x /opt/jwt_tool/jwt_tool.py; fi && \
    # Git repository dumper
    git clone --depth 1 https://github.com/internetwache/GitTools.git /opt/gittools && \
    chmod +x /opt/gittools/Dumper/gitdumper.sh /opt/gittools/Extractor/extractor.sh && \
    ln -sf /opt/gittools/Dumper/gitdumper.sh /usr/local/bin/gitdumper && \
    ln -sf /opt/gittools/Extractor/extractor.sh /usr/local/bin/gitextractor && \
    # enum4linux-aux (enhanced enum4linux)
    git clone --depth 1 https://github.com/cddmp/enum4linux-ng.git /opt/enum4linux-ng || true && \
    if [ -f /opt/enum4linux-ng/enum4linux-ng.py ]; then ln -sf /opt/enum4linux-ng/enum4linux-ng.py /usr/local/bin/enum4linux-aux && chmod +x /usr/local/bin/enum4linux-aux; fi && \
    # MobSF (Mobile Security Framework)
    git clone --depth 1 https://github.com/MobSF/Mobile-Security-Framework-MobSF.git /opt/MobSF || true && \
    # drozer (Android security assessment framework)
    git clone --depth 1 https://github.com/WithSecureLabs/drozer.git /opt/drozer || true

# ============================================================================
# Binary Downloads (Platform-aware)
# ============================================================================
RUN set -eux; \
    # Secret scanning tool
    curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin && \
    # Vulnerability scanner for containers and filesystems
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin && \
    # httpx with proper architecture detection
    arch=$(uname -m); \
    if [ "$arch" = "x86_64" ]; then platform="linux_amd64"; \
    elif [ "$arch" = "aarch64" ] || [ "$arch" = "arm64" ]; then platform="linux_arm64"; \
    else platform="linux_amd64"; fi; \
    HTTPX_URL=$(curl -s https://api.github.com/repos/projectdiscovery/httpx/releases/latest \
      | grep -Eo '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]*' | cut -d '"' -f4 \
      | grep -E "${platform}[.]zip$" | head -n1); \
    echo "Fetching httpx: $HTTPX_URL"; \
    wget -qO /tmp/httpx.zip "$HTTPX_URL" && \
    mkdir -p /tmp/httpx_extracted && \
    unzip -q /tmp/httpx.zip -d /tmp/httpx_extracted || true; \
    HTTPX_BIN=$(find /tmp/httpx_extracted -type f -name httpx | head -n1); \
    if [ -n "$HTTPX_BIN" ]; then mv "$HTTPX_BIN" /usr/local/bin/httpx; chmod +x /usr/local/bin/httpx; fi; \
    rm -rf /tmp/httpx_extracted /tmp/httpx.zip

# ============================================================================
# Caido CLI — Web Security Proxy (free, headless, GraphQL API)
# ============================================================================
RUN set -eux; \
    arch=$(uname -m); \
    if [ "$arch" = "x86_64" ]; then CAIDO_ARCH="x86_64"; \
    elif [ "$arch" = "aarch64" ] || [ "$arch" = "arm64" ]; then CAIDO_ARCH="aarch64"; \
    else echo "Unsupported architecture: $arch" && exit 1; fi; \
    CAIDO_VERSION=$(curl -s https://api.github.com/repos/caido/caido/releases/latest \
      | grep '"tag_name"' | cut -d'"' -f4); \
    echo "Installing caido-cli ${CAIDO_VERSION} for ${CAIDO_ARCH}"; \
    wget -qO /tmp/caido-cli.tar.gz \
      "https://caido.download/releases/${CAIDO_VERSION}/caido-cli-${CAIDO_VERSION}-linux-${CAIDO_ARCH}.tar.gz" && \
    tar -xzf /tmp/caido-cli.tar.gz -C /tmp && \
    chmod +x /tmp/caido-cli && \
    mv /tmp/caido-cli /usr/local/bin/caido-cli && \
    rm /tmp/caido-cli.tar.gz && \
    mkdir -p /app/certs

# ============================================================================
# Create Wrapper Scripts for Python Tools
# ============================================================================
RUN set -eux; \
    # JWT Tool wrapper
    if [ -f /opt/jwt_tool/jwt_tool.py ]; then \
      { echo '#!/bin/bash'; echo 'python3 /opt/jwt_tool/jwt_tool.py "$@"'; } > /usr/local/bin/jwt-tool; \
      chmod +x /usr/local/bin/jwt-tool; \
    fi

# ============================================================================
# Go-based Security Tools (installed as prebuilt release binaries)
# ============================================================================
# These ProjectDiscovery tools are pulled as prebuilt release binaries instead
# of `go install`, because the Go module/build cache overflows the build disk.
# The `go` toolchain itself remains installed for runtime use.
RUN set -eux; \
    arch=$(uname -m); \
    if [ "$arch" = "x86_64" ]; then platform="linux_amd64"; \
    elif [ "$arch" = "aarch64" ] || [ "$arch" = "arm64" ]; then platform="linux_arm64"; \
    else platform="linux_amd64"; fi; \
    for spec in projectdiscovery/interactsh:interactsh-client projectdiscovery/katana:katana projectdiscovery/vulnx:vulnx; do \
      gh_repo=${spec%%:*}; bin=${spec##*:}; \
      url=$(curl -sL "https://api.github.com/repos/${gh_repo}/releases/latest" \
        | grep -Eo '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]*' | cut -d '"' -f4 \
        | grep "${bin}_" | grep -E "${platform}[.]zip$" | head -n1); \
      if [ -z "$url" ]; then echo "ERROR: no release asset for ${bin} (${platform})"; exit 1; fi; \
      echo "Fetching ${bin}: ${url}"; \
      wget -qO /tmp/pd.zip "$url"; \
      rm -rf /tmp/pd_x; mkdir -p /tmp/pd_x; \
      unzip -q /tmp/pd.zip -d /tmp/pd_x; \
      f=$(find /tmp/pd_x -type f -name "$bin" | head -n1); \
      if [ -z "$f" ]; then echo "ERROR: ${bin} not found in archive"; exit 1; fi; \
      mv "$f" /usr/local/bin/${bin}; chmod +x /usr/local/bin/${bin}; \
      rm -rf /tmp/pd_x /tmp/pd.zip; \
    done; \
    ln -sf /usr/local/bin/vulnx /usr/local/bin/cvemap

# ============================================================================
# TestSSL Symlink - Allow access via both 'testssl' and 'testssl.sh'
# ============================================================================
RUN set -eux; \
    if command -v testssl >/dev/null 2>&1; then \
      ln -sf $(which testssl) /usr/local/bin/testssl.sh; \
    fi

# ============================================================================
# Nuclei Templates
# Templates are intentionally NOT downloaded at build time (saves significant
# disk). Nuclei fetches them automatically on first run, or run
# `nuclei -update-templates` at runtime.
# ============================================================================

# ============================================================================
# Tool Validation
# ============================================================================
RUN set -eux; \
    echo "=== Starting tool validation ===" && \
    test -d /usr/share/seclists && \
    echo "✓ SecLists installed" && \
    which nmap && echo "✓ nmap" && \
    which naabu && echo "✓ naabu" && \
    which nikto && echo "✓ nikto" && \
    which whatweb && echo "✓ whatweb" && \
    which wafw00f && echo "✓ wafw00f" && \
    which sqlmap && echo "✓ sqlmap" && \
    which wapiti && echo "✓ wapiti" && \
    which wpscan && echo "✓ wpscan" && \
    which subfinder && echo "✓ subfinder" && \
    which dnsrecon && echo "✓ dnsrecon" && \
    which dnsenum && echo "✓ dnsenum" && \
    which ffuf && echo "✓ ffuf" && \
    which arjun && echo "✓ arjun" && \
    which gobuster && echo "✓ gobuster" && \
    which dirsearch && echo "✓ dirsearch" && \
    which testssl && echo "✓ testssl" && \
    which testssl.sh && echo "✓ testssl.sh" && \
    which nuclei && echo "✓ nuclei" && \
    which hydra && echo "✓ hydra" && \
    which smbclient && echo "✓ smbclient" && \
    which smbmap && echo "✓ smbmap" && \
    which nbtscan && echo "✓ nbtscan" && \
    which enum4linux && echo "✓ enum4linux" && \
    which enum4linux-aux && echo "✓ enum4linux-aux" && \
    which arp-scan && echo "✓ arp-scan" && \
    which crackmapexec && echo "✓ crackmapexec" && \
    which bloodhound-python && echo "✓ bloodhound-python" && \
    which adb && echo "✓ adb" && \
    which apktool && echo "✓ apktool" && \
    which aws && echo "✓ awscli" && \
    which az && echo "✓ azure-cli" && \
    which gcloud && echo "✓ google-cloud-sdk" && \
    which wfuzz && echo "✓ wfuzz" && \
    which burpsuite && echo "✓ burpsuite" && \
    which gospider && echo "✓ gospider" && \
    which interactsh-client && echo "✓ interactsh-client" && \
    which katana && echo "✓ katana" && \
    which cvemap && echo "✓ cvemap" && \
    which jwt-tool && echo "✓ jwt_tool" && \
    which gitdumper && echo "✓ gitdumper" && \
    which trufflehog && echo "✓ trufflehog" && \
    which trivy && echo "✓ trivy" && \
    which zaproxy && echo "✓ zaproxy" && \
    which httpx && echo "✓ httpx" && \
    which caido-cli && echo "✓ caido-cli" && \
    which rg && echo "✓ ripgrep" && \
    which go && echo "✓ go" && \
    which python3 && echo "✓ python3" && \
    which node && echo "✓ node" && \
    which ruby && echo "✓ ruby" && \
    which tmux && echo "✓ tmux" && \
    python3 -c "import reportlab; print('✓ reportlab')" && \
    python3 -c "import docx; print('✓ python-docx')" && \
    python3 -c "import openpyxl; print('✓ openpyxl')" && \
    python3 -c "import pptx; print('✓ python-pptx')" && \
    python3 -c "import pandas; print('✓ pandas')" && \
    python3 -c "import odf; print('✓ odfpy')" && \
    python3 -c "import requests; print('✓ requests')" && \
    python3 -c "import ldapdomaindump; print('✓ ldapdomaindump')" && \
    python3 -c "import impacket; print('✓ impacket')" && \
    python3 -c "import frida; print('✓ frida-tools')" && \
    python3 -c "import objection; print('✓ objection')" && \
    python3 -c "import androguard; print('✓ androguard')" && \
    python3 -c "import ScoutSuite; print('✓ ScoutSuite')" && \
    python3 -c "import graphql; print('✓ graphql-core')" && \
    echo "=== Version Information ===" && \
    nmap --version | head -n1 && \
    python3 --version && \
    go version && \
    node --version && \
    ruby --version && \
    echo "=== All critical tools validated successfully ==="

# ============================================================================
# Final Cleanup & Permissions
# ============================================================================
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/cache/apt/archives/* && \
    chown -R user:user /home/user

# Default shell
SHELL ["/bin/bash", "-c"]
