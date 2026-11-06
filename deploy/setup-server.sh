#!/usr/bin/env bash
# Sets up Praxis on a fresh Ubuntu 24.04 server (Hetzner, DigitalOcean or similar), once.
#
# Run it as root on the new server:
#   bash setup-server.sh
#
# It asks for three things, each with a default:
#   - the repository to deploy (this one);
#   - the address people will use: until you have a domain, <your-ip>.sslip.io works and gets
#     a real HTTPS certificate;
#   - an email for the certificate's expiry notices (optional).
#
# It installs Node 22, nginx and certbot; makes a `praxis` account that owns the app; clones
# the repository with a deploy key; builds; runs Praxis as the `praxis` service on
# 127.0.0.1:8791 behind nginx with HTTPS; and turns on the firewall (SSH and web only).
# Afterwards, updates are one command: bash /srv/muse/deploy/deploy.sh

set -euo pipefail

APP_USER=praxis
REPO_DIR=/srv/muse
APP_DIR=$REPO_DIR/praxis
SERVICE=praxis
PORT=8791

say() { printf '\n== %s\n' "$*"; }
ask() { local prompt=$1 default=$2 answer; read -r -p "$prompt [$default]: " answer; printf '%s' "${answer:-$default}"; }

main() {
  if [ "$(id -u)" -ne 0 ]; then echo "Run this as root."; exit 1; fi

  local ip repo domain email
  ip=$(hostname -I | awk '{print $1}')
  repo=$(ask "Repository" "git@github.com:Tulivu89/mercurial-muse.git")
  domain=$(ask "Address" "${ip//./-}.sslip.io")
  email=$(ask "Email for certificate notices (Enter to skip)" "")

  say "Installing git, nginx, certbot and the firewall"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -q
  apt-get install -y -q git nginx certbot python3-certbot-nginx ufw curl ca-certificates

  say "Installing Node 22"
  if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -q nodejs
  fi
  node --version

  say "Making the $APP_USER account"
  id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "/home/$APP_USER" --shell /bin/bash "$APP_USER"
  mkdir -p "$REPO_DIR"
  chown "$APP_USER:$APP_USER" "$REPO_DIR"

  if [[ "$repo" == git@* ]]; then
    say "A deploy key, so this server can read the repository"
    local key="/home/$APP_USER/.ssh/id_ed25519"
    if [ ! -f "$key" ]; then
      sudo -u "$APP_USER" mkdir -p "/home/$APP_USER/.ssh"
      sudo -u "$APP_USER" ssh-keygen -q -t ed25519 -N "" -C "praxis@$domain" -f "$key"
    fi
    ssh-keyscan -t ed25519 github.com 2>/dev/null | sudo -u "$APP_USER" tee "/home/$APP_USER/.ssh/known_hosts" >/dev/null
    echo
    echo "Add this key on GitHub: the repository's Settings > Deploy keys > Add deploy key."
    echo "Any title; leave \"Allow write access\" unticked."
    echo
    cat "$key.pub"
    echo
    read -r -p "Press Enter once it is added. " _
  fi

  say "Cloning"
  if [ ! -d "$REPO_DIR/.git" ]; then
    sudo -u "$APP_USER" git clone "$repo" "$REPO_DIR"
  fi

  say "Installing and building (a few minutes)"
  sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm ci && npm run build"

  say "The $SERVICE service"
  # Optional settings, such as extra narration providers (see README, Narration).
  [ -f /etc/praxis.env ] || printf '%s\n' '# PRAXIS_PROVIDERS=[{"id":"partner","name":"Partner","base":"https://api.partner.example/v1"}]' > /etc/praxis.env
  cat > "/etc/systemd/system/$SERVICE.service" <<UNIT
[Unit]
Description=Praxis
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist-server/server/index.js
Restart=on-failure
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=$PORT
EnvironmentFile=-/etc/praxis.env
# No provider key belongs here: players send their own with each request, and the server
# never stores it.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable --now "$SERVICE"

  say "nginx in front of it"
  cat > /etc/nginx/sites-available/praxis <<SITE
server {
    listen 80;
    listen [::]:80;
    server_name $domain;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        # Narration can take a while on slow providers; the relay gives up at 180 seconds.
        proxy_read_timeout 190s;
        client_max_body_size 4m;
    }
}
SITE
  ln -sf /etc/nginx/sites-available/praxis /etc/nginx/sites-enabled/praxis
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx

  say "Firewall: SSH and web only"
  ufw allow OpenSSH >/dev/null
  ufw allow 'Nginx Full' >/dev/null
  ufw --force enable >/dev/null
  ufw status | head -5

  say "HTTPS for $domain"
  if [ -n "$email" ]; then
    certbot --nginx -d "$domain" --non-interactive --agree-tos -m "$email" --redirect
  else
    certbot --nginx -d "$domain" --non-interactive --agree-tos --register-unsafely-without-email --redirect
  fi

  say "Checking it is live"
  sleep 2
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null; then
    echo "Praxis is live at https://$domain"
    echo "To update it later: bash $REPO_DIR/deploy/deploy.sh"
  else
    echo "The service did not answer. Check: journalctl -u $SERVICE -n 50"
    exit 1
  fi
}

main "$@"
