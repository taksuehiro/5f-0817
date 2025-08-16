# 🚀 AWS EC2 デプロイメントガイド

## 概要
このガイドでは、5フォース分析ツールをAWS EC2にデプロイする手順を説明します。

## 前提条件
- AWSアカウント
- EC2インスタンス（Ubuntu 20.04 LTS推奨）
- SSHキーペア

---

## 1. EC2インスタンスの準備

### 1.1 EC2インスタンス作成
1. AWSコンソールにログイン
2. EC2サービスに移動
3. 「インスタンスを起動」をクリック
4. 以下の設定でインスタンスを作成：
   - **AMI**: Ubuntu Server 20.04 LTS
   - **インスタンスタイプ**: t2.micro（無料枠）
   - **ストレージ**: 8GB GP2
   - **セキュリティグループ**: 
     - SSH (22) - マイIP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0（オプション）

### 1.2 キーペアの設定
```bash
# ローカルでキーペアの権限を設定
chmod 400 your-key.pem
```

---

## 2. EC2インスタンスへの接続

### 2.1 SSH接続
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 2.2 システムの更新
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

---

## 3. アプリケーションのデプロイ

### 3.1 リポジトリのクローン
```bash
# アプリケーションをクローン
git clone https://github.com/taksuehiro/5F.git
cd 5F
```

### 3.2 デプロイスクリプトの実行
```bash
# スクリプトに実行権限を付与
chmod +x deploy.sh

# デプロイを実行
./deploy.sh
```

### 3.3 デプロイの確認
```bash
# Nginxの状態確認
sudo systemctl status nginx

# アプリケーションファイルの確認
ls -la /var/www/5f-analyzer/
```

---

## 4. アプリケーションのアクセス

### 4.1 ブラウザでの確認
- URL: `http://your-ec2-public-ip`
- 5フォース分析ツールが正常に表示されることを確認

### 4.2 機能テスト
1. 質問に回答
2. 分析結果の表示
3. レスポンシブデザインの確認

---

## 5. セキュリティ設定

### 5.1 ファイアウォール設定
```bash
# UFWの有効化
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

### 5.2 SSL証明書の設定（オプション）
```bash
# Certbotのインストール
sudo apt-get install certbot python3-certbot-nginx

# SSL証明書の取得
sudo certbot --nginx -d your-domain.com
```

---

## 6. 監視とメンテナンス

### 6.1 ログの確認
```bash
# Nginxアクセスログ
sudo tail -f /var/log/nginx/access.log

# Nginxエラーログ
sudo tail -f /var/log/nginx/error.log

# システムログ
sudo journalctl -u nginx
```

### 6.2 パフォーマンス監視
```bash
# システムリソースの確認
htop
df -h
free -h
```

---

## 7. 更新とメンテナンス

### 7.1 アプリケーションの更新
```bash
# リポジトリから最新版を取得
cd /path/to/5F
git pull origin main

# ファイルをコピー
cp index.html /var/www/5f-analyzer/
cp app.js /var/www/5f-analyzer/
cp 5F_Tree.json /var/www/5f-analyzer/

# Nginxの再読み込み
sudo systemctl reload nginx
```

### 7.2 システムの更新
```bash
# 定期的なシステム更新
sudo apt-get update
sudo apt-get upgrade -y
sudo systemctl restart nginx
```

---

## 8. トラブルシューティング

### 8.1 よくある問題

#### Nginxが起動しない
```bash
# 設定ファイルの構文チェック
sudo nginx -t

# エラーログの確認
sudo tail -f /var/log/nginx/error.log
```

#### アプリケーションが表示されない
```bash
# ファイルの存在確認
ls -la /var/www/5f-analyzer/

# 権限の確認
sudo chown -R www-data:www-data /var/www/5f-analyzer/
sudo chmod -R 755 /var/www/5f-analyzer/
```

#### ポート80が開いていない
```bash
# セキュリティグループの確認
# AWSコンソールでEC2インスタンスのセキュリティグループを確認
# インバウンドルールにHTTP (80)が含まれているか確認
```

### 8.2 ログの確認方法
```bash
# リアルタイムログ監視
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# 特定のIPからのアクセス確認
sudo grep "your-ip-address" /var/log/nginx/access.log
```

---

## 9. バックアップと復旧

### 9.1 設定ファイルのバックアップ
```bash
# Nginx設定のバックアップ
sudo cp /etc/nginx/sites-available/5f-analyzer /home/ubuntu/backup/

# アプリケーションファイルのバックアップ
sudo cp -r /var/www/5f-analyzer /home/ubuntu/backup/
```

### 9.2 復旧手順
```bash
# 設定ファイルの復元
sudo cp /home/ubuntu/backup/5f-analyzer /etc/nginx/sites-available/

# アプリケーションファイルの復元
sudo cp -r /home/ubuntu/backup/5f-analyzer /var/www/

# Nginxの再起動
sudo systemctl restart nginx
```

---

## 10. コスト最適化

### 10.1 無料枠の活用
- t2.microインスタンスを使用
- EBSストレージは8GB以内
- データ転送量に注意

### 10.2 不要なサービスの停止
```bash
# 使用していないサービスの確認
sudo systemctl list-units --type=service --state=running

# 不要なサービスの停止
sudo systemctl stop service-name
sudo systemctl disable service-name
```

---

## まとめ

このガイドに従って、5フォース分析ツールをAWS EC2に正常にデプロイできます。

**主要なポイント:**
1. セキュリティグループの適切な設定
2. Nginxの正しい設定
3. 定期的なメンテナンスと更新
4. ログの監視とトラブルシューティング

**次のステップ:**
- ドメイン名の設定
- SSL証明書の導入
- 監視ツールの導入
- 自動バックアップの設定

何か問題が発生した場合は、ログを確認して適切な対処を行ってください。
