# Cursor開発・デプロイメント完全手順書

## 概要
この手順書は、Cursorを使用したWebアプリケーション開発から、GitHubへのコード管理、AWS EC2への自動デプロイメントまでの完全なワークフローを説明します。

## プロジェクト概要
- **アプリケーション**: 化学物質管理クイズアプリ（Flask + OpenAI API）
- **開発環境**: Cursor IDE
- **バージョン管理**: GitHub
- **デプロイ先**: AWS EC2 (Ubuntu 20.04)
- **Webサーバー**: Nginx + Gunicorn

---

## 1. Cursorでの開発環境構築

### 1.1 プロジェクト初期化
```bash
# プロジェクトディレクトリの作成
mkdir チャットボット
cd チャットボット

# Gitリポジトリの初期化
git init
```

### 1.2 基本的なファイル構造の作成
```
チャットボット/
├── app.py                 # メインアプリケーション
├── wsgi.py               # WSGIエントリーポイント
├── requirements.txt      # Python依存関係
├── deploy.sh            # デプロイスクリプト
├── .gitignore           # Git除外設定
├── README.md            # プロジェクト説明
├── templates/           # HTMLテンプレート
│   ├── index.html
│   ├── quiz.html
│   └── result.html
├── 秘密鍵(GITに上げない)/  # 機密情報（Git除外）
└── Q&A/                 # クイズデータ
    ├── level1.md
    ├── level2.md
    └── level3.md
```

### 1.3 .gitignoreの設定
```bash
# 秘密鍵ファイル
秘密鍵(GITに上げない)/
*.txt

# Python
__pycache__/
*.py[cod]
*$py.class
venv/
env/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## 2. アプリケーション開発

### 2.1 依存関係の定義（requirements.txt）
```
Flask==2.3.3
openai==1.99.9
python-dotenv==1.0.0
gunicorn==21.2.0
```

### 2.2 メインアプリケーション（app.py）
- Flaskアプリケーションの作成
- OpenAI API統合
- クイズ機能の実装
- ルーティング設定

### 2.3 WSGI設定（wsgi.py）
```python
from app import app

if __name__ == "__main__":
    app.run()
```

---

## 3. Git管理とGitHub連携

### 3.1 ローカルGit設定
```bash
# 初期コミット
git add .
git commit -m "Initial commit: 化学物質管理クイズアプリ"

# ブランチ管理
git branch -M main
```

### 3.2 GitHubリポジトリ作成
1. GitHub.comで新しいリポジトリを作成
2. リポジトリ名: `chemchat`
3. 公開設定: Public

### 3.3 リモートリポジトリ連携
```bash
# リモートリポジトリの追加
git remote add origin https://github.com/taksuehiro/chemchat.git

# プッシュ
git push -u origin main
```

### 3.4 継続的な開発フロー
```bash
# 開発時の基本フロー
git add .
git commit -m "機能追加: [具体的な変更内容]"
git push origin main
```

---

## 4. AWS EC2環境構築

### 4.1 EC2インスタンス作成
1. **インスタンスタイプ**: t2.micro（無料枠）
2. **OS**: Ubuntu 20.04 LTS
3. **ストレージ**: 8GB GP2
4. **セキュリティグループ**: 
   - SSH (22)
   - HTTP (80)
   - HTTPS (443)

### 4.2 キーペアの作成とダウンロード
- AWSコンソールでキーペアを作成
- `.pem`ファイルをローカルにダウンロード
- 適切な権限設定: `chmod 400 your-key.pem`

---

## 5. デプロイメント自動化

### 5.1 デプロイスクリプト（deploy.sh）
```bash
#!/bin/bash

# システムパッケージの更新
sudo apt-get update
sudo apt-get upgrade -y

# Pythonとpipのインストール
sudo apt-get install -y python3 python3-pip python3-venv

# Nginxのインストール
sudo apt-get install -y nginx

# アプリケーションディレクトリの作成
sudo mkdir -p /var/www/chemchat
sudo chown $USER:$USER /var/www/chemchat

# アプリケーションファイルのコピー
cp -r * /var/www/chemchat/

# 仮想環境の作成とアクティベート
cd /var/www/chemchat
python3 -m venv venv
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt

# Gunicornサービスの設定
sudo tee /etc/systemd/system/chemchat.service > /dev/null <<EOF
[Unit]
Description=ChemChat Gunicorn daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/chemchat
Environment="PATH=/var/www/chemchat/venv/bin"
ExecStart=/var/www/chemchat/venv/bin/gunicorn --workers 3 --bind unix:/var/www/chemchat/chemchat.sock wsgi:app

[Install]
WantedBy=multi-user.target
EOF

# Nginxの設定
sudo tee /etc/nginx/sites-available/chemchat > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        include proxy_params;
        proxy_pass http://unix:/var/www/chemchat/chemchat.sock;
    }
}
EOF

# Nginxの設定を有効化
sudo ln -s /etc/nginx/sites-available/chemchat /etc/nginx/sites-enabled
sudo rm -f /etc/nginx/sites-enabled/default

# サービスの開始
sudo systemctl start chemchat
sudo systemctl enable chemchat
sudo systemctl restart nginx

echo "デプロイが完了しました！"
```

### 5.2 EC2へのデプロイ実行
```bash
# EC2インスタンスにSSH接続
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# アプリケーションをクローン
git clone https://github.com/taksuehiro/chemchat.git
cd chemchat

# 秘密鍵ファイルのアップロード（ローカルから）
# 別ターミナルで実行
scp -i your-key.pem 秘密鍵\(GITに上げない\)/秘密鍵.txt ubuntu@your-ec2-public-ip:~/chemchat/

# デプロイスクリプトの実行
chmod +x deploy.sh
./deploy.sh
```

---

## 6. Cursorでの効率的な開発テクニック

### 6.1 AIアシスタントの活用
- **コード生成**: 機能の実装をAIに依頼
- **バグ修正**: エラーメッセージをAIに分析依頼
- **最適化**: コードの改善提案を求める
- **ドキュメント作成**: READMEやコメントの自動生成

### 6.2 ファイル管理
- **タブ管理**: 複数ファイルの同時編集
- **検索機能**: プロジェクト全体の検索
- **Git統合**: 変更の可視化とコミット

### 6.3 デバッグとテスト
- **ローカル実行**: `python app.py`でローカルテスト
- **ログ確認**: アプリケーションログの監視
- **ブラウザテスト**: リアルタイムでの動作確認

---

## 7. トラブルシューティング

### 7.1 よくある問題と解決方法

#### Git関連
```bash
# 権限エラー
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# リモートリポジトリの変更
git remote set-url origin https://github.com/username/repository.git
```

#### AWS EC2関連
```bash
# サービス状態確認
sudo systemctl status chemchat
sudo systemctl status nginx

# ログ確認
sudo journalctl -u chemchat
sudo tail -f /var/log/nginx/error.log

# サービスの再起動
sudo systemctl restart chemchat
sudo systemctl restart nginx

# ポート確認
sudo netstat -tlnp | grep :80
```

#### アプリケーション関連
```bash
# 仮想環境の再作成
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 権限問題の解決
sudo chown -R ubuntu:www-data /var/www/chemchat
sudo chmod -R 755 /var/www/chemchat
```

---

## 8. セキュリティベストプラクティス

### 8.1 機密情報の管理
- **APIキー**: `秘密鍵(GITに上げない)/`ディレクトリに保存
- **.gitignore**: 機密ファイルの除外設定
- **環境変数**: 本番環境では環境変数を使用

### 8.2 AWSセキュリティ
- **セキュリティグループ**: 必要最小限のポート開放
- **キーペア**: 適切な権限設定（400）
- **IAM**: 最小権限の原則

---

## 9. 継続的改善

### 9.1 コード管理
- **定期的なコミット**: 小さな変更を頻繁にコミット
- **ブランチ戦略**: 機能ブランチの活用
- **コードレビュー**: プルリクエストの活用

### 9.2 デプロイメント改善
- **CI/CD**: GitHub Actionsの導入検討
- **自動化**: デプロイスクリプトの改善
- **監視**: アプリケーション監視の導入

---

## 10. 参考リンク

- **Cursor**: https://cursor.sh/
- **GitHub**: https://github.com/
- **AWS EC2**: https://aws.amazon.com/ec2/
- **Flask**: https://flask.palletsprojects.com/
- **Nginx**: https://nginx.org/
- **Gunicorn**: https://gunicorn.org/

---

## まとめ

この手順書により、Cursorでの効率的な開発から、GitHubでのバージョン管理、AWS EC2への自動デプロイメントまで、一連のワークフローを実現できます。

**主要なメリット:**
1. **開発効率**: CursorのAI機能による高速開発
2. **バージョン管理**: Gitによる安全なコード管理
3. **自動デプロイ**: スクリプトによる一鍵デプロイ
4. **スケーラビリティ**: AWS EC2での本格的な運用

**今後の活用:**
- 他のプロジェクトでも同様のワークフローを適用
- CI/CDパイプラインの構築
- マイクロサービスアーキテクチャへの展開

この手順書を参考に、効率的で安全なWebアプリケーション開発を進めてください。
