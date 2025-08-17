from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import boto3
import json
from git import Repo
import tempfile
import shutil

# 環境変数の読み込み
load_dotenv()

app = Flask(__name__)
CORS(app)

# Dify API設定
DIFY_API_KEY = os.getenv('DIFY_API_KEY', 'app-FoU9b4DtRB03W1nusgEjOLSr')
DIFY_BASE_URL = os.getenv('DIFY_BASE_URL', 'https://api.dify.ai/v1')

# AWS設定
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'ap-northeast-1')

# S3クライアントの初期化
s3_client = None
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )

@app.route('/api/chat', methods=['POST'])
def chat():
    """Dify APIを使用してチャット機能を提供"""
    try:
        data = request.json
        message = data.get('message', '')
        
        # Dify APIにリクエスト
        headers = {
            'Authorization': f'Bearer {DIFY_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'inputs': {},
            'query': message,
            'response_mode': 'streaming',
            'conversation_id': data.get('conversation_id', ''),
            'user': 'user'
        }
        
        response = requests.post(
            f'{DIFY_BASE_URL}/chat-messages',
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Dify API error', 'status': response.status_code}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/git-to-s3', methods=['POST'])
def git_to_s3():
    """GitリポジトリをS3にアップロード"""
    try:
        data = request.json
        repo_url = data.get('repo_url')
        bucket_name = data.get('bucket_name')
        s3_key = data.get('s3_key', 'git-repo')
        
        if not repo_url or not bucket_name:
            return jsonify({'error': 'repo_url and bucket_name are required'}), 400
        
        if not s3_client:
            return jsonify({'error': 'AWS credentials not configured'}), 500
        
        # 一時ディレクトリにリポジトリをクローン
        temp_dir = tempfile.mkdtemp()
        try:
            repo = Repo.clone_from(repo_url, temp_dir)
            
            # ファイルをS3にアップロード
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, temp_dir)
                    s3_file_key = f"{s3_key}/{relative_path}"
                    
                    with open(file_path, 'rb') as f:
                        s3_client.upload_fileobj(f, bucket_name, s3_file_key)
            
            return jsonify({
                'message': 'Repository uploaded to S3 successfully',
                'bucket': bucket_name,
                's3_key': s3_key
            })
            
        finally:
            # 一時ディレクトリを削除
            shutil.rmtree(temp_dir)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """ヘルスチェックエンドポイント"""
    return jsonify({'status': 'healthy', 'service': 'Dify Web App Backend'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
