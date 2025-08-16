#!/bin/bash

# 5フォース分析ツール AWS EC2 デプロイスクリプト
echo "🚀 5フォース分析ツールのデプロイを開始します..."

# システムパッケージの更新
echo "📦 システムパッケージを更新中..."
sudo apt-get update
sudo apt-get upgrade -y

# Nginxのインストール
echo "🌐 Nginxをインストール中..."
sudo apt-get install -y nginx

# アプリケーションディレクトリの作成
echo "📁 アプリケーションディレクトリを作成中..."
sudo mkdir -p /var/www/5f-analyzer
sudo chown $USER:$USER /var/www/5f-analyzer

# アプリケーションファイルのコピー
echo "📋 アプリケーションファイルをコピー中..."
cp index.html /var/www/5f-analyzer/
cp app.js /var/www/5f-analyzer/
cp 5F_Tree.json /var/www/5f-analyzer/
cp README.md /var/www/5f-analyzer/

# Nginxの設定
echo "⚙️ Nginxの設定中..."
sudo tee /etc/nginx/sites-available/5f-analyzer > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    root /var/www/5f-analyzer;
    index index.html;

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 静的ファイルのキャッシュ設定
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # JSONファイルのMIMEタイプ設定
    location ~* \.json$ {
        add_header Content-Type application/json;
        expires 1d;
    }

    # メインページ
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # エラーページ
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# デフォルトサイトを無効化
sudo rm -f /etc/nginx/sites-enabled/default

# 新しいサイトを有効化
sudo ln -s /etc/nginx/sites-available/5f-analyzer /etc/nginx/sites-enabled/

# Nginxの設定テスト
echo "🔍 Nginxの設定をテスト中..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginxの設定が正常です"
    
    # Nginxの再起動
    echo "🔄 Nginxを再起動中..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    echo "🎉 デプロイが完了しました！"
    echo ""
    echo "📊 アプリケーション情報:"
    echo "   URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'your-ec2-public-ip')"
    echo "   ディレクトリ: /var/www/5f-analyzer"
    echo "   設定ファイル: /etc/nginx/sites-available/5f-analyzer"
    echo ""
    echo "🔧 管理コマンド:"
    echo "   Nginx再起動: sudo systemctl restart nginx"
    echo "   Nginx状態確認: sudo systemctl status nginx"
    echo "   Nginxログ確認: sudo tail -f /var/log/nginx/error.log"
    echo ""
    echo "📝 更新方法:"
    echo "   1. ファイルを /var/www/5f-analyzer/ にコピー"
    echo "   2. sudo systemctl reload nginx"
    
else
    echo "❌ Nginxの設定にエラーがあります"
    exit 1
fi
