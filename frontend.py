import streamlit as st
import requests
import json
import os
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

# ページ設定
st.set_page_config(
    page_title="Dify Web App",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# カスタムCSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .chat-container {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        margin: 10px 0;
    }
    .user-message {
        background-color: #007bff;
        color: white;
        padding: 10px 15px;
        border-radius: 15px;
        margin: 5px 0;
        text-align: right;
    }
    .bot-message {
        background-color: #e9ecef;
        color: #333;
        padding: 10px 15px;
        border-radius: 15px;
        margin: 5px 0;
    }
    .sidebar-section {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }
</style>
""", unsafe_allow_html=True)

# バックエンドAPIのベースURL
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')

def init_session_state():
    """セッション状態の初期化"""
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    if 'conversation_id' not in st.session_state:
        st.session_state.conversation_id = ""

def send_chat_message(message):
    """チャットメッセージをバックエンドに送信"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/chat",
            json={
                'message': message,
                'conversation_id': st.session_state.conversation_id
            },
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            # 会話IDを保存
            if 'conversation_id' in data:
                st.session_state.conversation_id = data['conversation_id']
            return data.get('answer', '申し訳ございません。応答を取得できませんでした。')
        else:
            return f"エラーが発生しました: {response.status_code}"
    except Exception as e:
        return f"接続エラー: {str(e)}"

def upload_git_to_s3(repo_url, bucket_name, s3_key):
    """GitリポジトリをS3にアップロード"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/git-to-s3",
            json={
                'repo_url': repo_url,
                'bucket_name': bucket_name,
                's3_key': s3_key
            },
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {'error': f"エラーが発生しました: {response.status_code}"}
    except Exception as e:
        return {'error': f"接続エラー: {str(e)}"}

def main():
    """メインアプリケーション"""
    init_session_state()
    
    # ヘッダー
    st.markdown('<h1 class="main-header">🤖 Dify Web App</h1>', unsafe_allow_html=True)
    
    # サイドバー
    with st.sidebar:
        st.markdown("### ⚙️ 設定")
        
        # タブ選択
        tab_selection = st.radio(
            "機能を選択",
            ["💬 チャット", "📁 Git→S3", "ℹ️ 情報"]
        )
        
        if tab_selection == "💬 チャット":
            st.markdown("### 💬 チャット設定")
            st.markdown("ポーター5フォース分析アシスタントとチャットできます。")
            
            # 会話リセット
            if st.button("🔄 会話をリセット"):
                st.session_state.messages = []
                st.session_state.conversation_id = ""
                st.success("会話をリセットしました")
                
        elif tab_selection == "📁 Git→S3":
            st.markdown("### 📁 Git→S3 設定")
            st.markdown("GitリポジトリをAWS S3にアップロードできます。")
            
        elif tab_selection == "ℹ️ 情報":
            st.markdown("### ℹ️ アプリ情報")
            st.markdown("""
            **Dify Web App**
            
            - **フロントエンド**: Streamlit
            - **バックエンド**: Flask
            - **AI**: Dify API
            - **ストレージ**: AWS S3
            
            **機能**:
            - ポーター5フォース分析チャット
            - Git→S3自動アップロード
            """)
    
    # メインコンテンツ
    if tab_selection == "💬 チャット":
        st.markdown("### 💬 ポーター5フォース分析チャット")
        
        # チャット履歴の表示
        chat_container = st.container()
        with chat_container:
            for message in st.session_state.messages:
                if message["role"] == "user":
                    st.markdown(f'<div class="user-message">{message["content"]}</div>', unsafe_allow_html=True)
                else:
                    st.markdown(f'<div class="bot-message">{message["content"]}</div>', unsafe_allow_html=True)
        
        # メッセージ入力
        with st.container():
            user_input = st.text_area(
                "メッセージを入力してください:",
                height=100,
                placeholder="事業やサービスについて教えてください..."
            )
            
            col1, col2 = st.columns([1, 4])
            with col1:
                if st.button("📤 送信", type="primary"):
                    if user_input.strip():
                        # ユーザーメッセージを追加
                        st.session_state.messages.append({"role": "user", "content": user_input})
                        
                        # ローディング表示
                        with st.spinner("AIが応答を生成中..."):
                            # バックエンドにメッセージを送信
                            bot_response = send_chat_message(user_input)
                            
                            # ボットメッセージを追加
                            st.session_state.messages.append({"role": "assistant", "content": bot_response})
                        
                        # ページをリロードして新しいメッセージを表示
                        st.rerun()
            
            with col2:
                if st.button("🗑️ クリア"):
                    st.session_state.messages = []
                    st.rerun()
    
    elif tab_selection == "📁 Git→S3":
        st.markdown("### 📁 GitリポジトリをS3にアップロード")
        
        with st.form("git_to_s3_form"):
            st.markdown("#### リポジトリ情報")
            repo_url = st.text_input(
                "GitリポジトリURL",
                placeholder="https://github.com/username/repository.git"
            )
            
            st.markdown("#### AWS S3設定")
            bucket_name = st.text_input(
                "S3バケット名",
                placeholder="my-bucket-name"
            )
            
            s3_key = st.text_input(
                "S3キー（オプション）",
                value="git-repo",
                help="S3内での保存パスを指定します"
            )
            
            submitted = st.form_submit_button("🚀 アップロード開始", type="primary")
            
            if submitted:
                if repo_url and bucket_name:
                    with st.spinner("GitリポジトリをS3にアップロード中..."):
                        result = upload_git_to_s3(repo_url, bucket_name, s3_key)
                        
                        if 'error' in result:
                            st.error(f"エラー: {result['error']}")
                        else:
                            st.success("✅ アップロードが完了しました！")
                            st.json(result)
                else:
                    st.error("リポジトリURLとバケット名を入力してください。")
    
    elif tab_selection == "ℹ️ 情報":
        st.markdown("### 📊 システム情報")
        
        # バックエンドのヘルスチェック
        try:
            response = requests.get(f"{BACKEND_URL}/api/health")
            if response.status_code == 200:
                st.success("✅ バックエンド接続: 正常")
            else:
                st.error("❌ バックエンド接続: エラー")
        except:
            st.error("❌ バックエンド接続: 接続できません")
        
        # 環境変数の確認
        st.markdown("#### 🔧 環境設定")
        env_vars = {
            "BACKEND_URL": BACKEND_URL,
            "DIFY_API_KEY": "設定済み" if os.getenv('DIFY_API_KEY') else "未設定",
            "AWS_ACCESS_KEY_ID": "設定済み" if os.getenv('AWS_ACCESS_KEY_ID') else "未設定",
            "AWS_SECRET_ACCESS_KEY": "設定済み" if os.getenv('AWS_SECRET_ACCESS_KEY') else "未設定",
        }
        
        for key, value in env_vars.items():
            st.text(f"{key}: {value}")

if __name__ == "__main__":
    main()

