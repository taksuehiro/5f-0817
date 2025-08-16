#!/bin/bash

# AWS CLI設定スクリプト
echo "🔧 AWS CLI設定を開始します..."

# AWS CLIのインストール
echo "📦 AWS CLIをインストール中..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# AWS CLIの設定
echo "⚙️ AWS CLIを設定中..."
aws configure

echo "✅ AWS CLI設定が完了しました！"
echo ""
echo "📝 次のコマンドでEC2インスタンスを作成できます："
echo "aws ec2 run-instances \\"
echo "  --image-id ami-0c02fb55956c7d316 \\"
echo "  --count 1 \\"
echo "  --instance-type t2.micro \\"
echo "  --key-name your-key-pair-name \\"
echo "  --security-group-ids sg-xxxxxxxxx \\"
echo "  --subnet-id subnet-xxxxxxxxx \\"
echo "  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=5F-Analyzer}]'"
