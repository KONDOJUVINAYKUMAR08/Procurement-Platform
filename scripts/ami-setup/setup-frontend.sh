#!/bin/bash
# ==========================================
# Frontend EC2 AMI Setup Script (Amazon Linux 2023)
# ==========================================

# 1. Update OS and Install dependencies
dnf update -y
dnf install -y git nginx curl

# 2. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs

# 3. Clone Repository (replace with your repo URL or S3 download)
# git clone https://github.com/your-org/procurement-platform.git /opt/procurement-platform
# cd /opt/procurement-platform

# NOTE: For baking an AMI, you might copy files directly into the image rather than cloning.
# Assuming files are in /opt/procurement-platform:
cd /opt/procurement-platform/frontend

# 4. Install Dependencies and Build
npm install
# Ensure environment variables point to the internal ALB for the backend
echo "REACT_APP_API_URL=http://internal-alb-dns-name" > .env
npm run build

# 5. Configure Nginx
rm -rf /usr/share/nginx/html/*
cp -r build/* /usr/share/nginx/html/

cat << 'EOF' > /etc/nginx/conf.d/procurement.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 6. Enable and start Nginx
systemctl enable nginx
systemctl start nginx

echo "Frontend AMI Setup Complete!"
