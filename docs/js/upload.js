// S3直接アップロード対応の写真アップローダー
class PhotoUploader {
    constructor() {
        this.selectedFiles = [];
        this.githubToken = null;
        this.repoOwner = null;
        this.repoName = null;
        // Lambda API endpoint - 実際のエンドポイントに置き換えてください
        this.lambdaEndpoint = 'YOUR_LAMBDA_API_ENDPOINT'; // 例: https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/upload
        this.init();
    }

    async init() {
        // 保存されたトークンを読み込む
        this.githubToken = localStorage.getItem('github_token');
        if (this.githubToken) {
            document.getElementById('githubToken').value = this.githubToken;
        }

        // リポジトリ情報を取得
        this.detectRepoInfo();

        // イベントリスナーを設定
        this.setupEventListeners();
    }

    detectRepoInfo() {
        // GitHub PagesのURLからリポジトリ情報を推測
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        // 保存されたリポジトリ情報を確認
        const savedOwner = localStorage.getItem('github_repo_owner');
        const savedName = localStorage.getItem('github_repo_name');
        
        if (savedOwner && savedName) {
            this.repoOwner = savedOwner;
            this.repoName = savedName;
            return;
        }
        
        // GitHub Pagesのパターンを検出
        if (hostname.includes('github.io')) {
            const parts = hostname.split('.');
            if (parts.length >= 2) {
                this.repoOwner = parts[0];
                const pathParts = pathname.split('/').filter(p => p);
                this.repoName = pathParts[0] || 'photo_site';
                
                // 保存
                localStorage.setItem('github_repo_owner', this.repoOwner);
                localStorage.setItem('github_repo_name', this.repoName);
            }
        } else {
            // ローカル開発環境の場合
            const owner = prompt('GitHubユーザー名を入力してください:') || '';
            const name = prompt('リポジトリ名を入力してください:') || 'photo_site';
            
            if (owner && name) {
                this.repoOwner = owner;
                this.repoName = name;
                localStorage.setItem('github_repo_owner', owner);
                localStorage.setItem('github_repo_name', name);
            }
        }

        console.log('Repository:', this.repoOwner, this.repoName);
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');

        // クリックでファイル選択
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // ファイル選択
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // ドラッグ&ドロップ
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // アップロードボタン
        uploadBtn.addEventListener('click', () => {
            this.uploadImages();
        });
    }

    handleFiles(files) {
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );

        if (imageFiles.length === 0) {
            alert('画像ファイルを選択してください');
            return;
        }

        // ファイルサイズチェック（100MB制限）
        const oversizedFiles = imageFiles.filter(file => file.size > 100 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            alert(`以下のファイルは100MBを超えているためアップロードできません:\n${oversizedFiles.map(f => f.name).join('\n')}`);
            return;
        }

        this.selectedFiles = imageFiles;
        this.showPreview();
    }

    showPreview() {
        const preview = document.getElementById('imagePreview');
        const section = document.getElementById('previewSection');
        
        preview.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <p>${file.name}</p>
                    <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });

        section.style.display = 'block';
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('uploadStatus');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
    }

    async uploadImages() {
        if (this.selectedFiles.length === 0) {
            alert('画像を選択してください');
            return;
        }

        // Lambda エンドポイントのチェック
        if (this.lambdaEndpoint === 'YOUR_LAMBDA_API_ENDPOINT') {
            alert('Lambda API エンドポイントが設定されていません。\nupload.js の lambdaEndpoint を設定してください。');
            return;
        }

        // GitHub トークンのチェック
        if (!this.githubToken) {
            alert('GitHub Personal Access Tokenを入力してください');
            return;
        }

        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = 'アップロード中...';

        try {
            this.showStatus('📤 画像をS3にアップロード中...', 'info');

            const uploadedFiles = [];

            // 各ファイルをS3にアップロード
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const file = this.selectedFiles[i];
                this.showStatus(`📤 ${i + 1}/${this.selectedFiles.length}: ${file.name} をアップロード中...`, 'info');

                const uploadedFile = await this.uploadSingleImageToS3(file);
                uploadedFiles.push(uploadedFile);
            }

            this.showStatus('🔄 GitHub Actionsをトリガー中...', 'info');

            // GitHub Actionsをトリガー
            await this.triggerGitHubActions(uploadedFiles);

            this.showStatus(`✅ ${this.selectedFiles.length}枚の画像をアップロードしました！\n\nGitHub Actionsが画像処理を行います。数分後に確認してください。`, 'success');
            
            // リセット
            this.selectedFiles = [];
            document.getElementById('previewSection').style.display = 'none';
            document.getElementById('fileInput').value = '';
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';

        } catch (error) {
            console.error('Upload error:', error);
            
            let errorMessage = `❌ アップロードエラー\n\n`;
            errorMessage += `エラー: ${error.message}\n\n`;
            errorMessage += `詳細情報:\n`;
            errorMessage += `- リポジトリ: ${this.repoOwner}/${this.repoName}\n`;
            errorMessage += `- トークン設定: ${this.githubToken ? '設定済み' : '未設定'}\n`;
            errorMessage += `- ファイル数: ${this.selectedFiles.length}\n\n`;
            errorMessage += `コンソールログを確認してください（F12キー）`;
            
            this.showStatus(errorMessage, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = 'アップロード開始';
        }
    }

    async uploadSingleImageToS3(file) {
        const useFileDate = document.getElementById('useFileDate').checked;
        const title = document.getElementById('title').value || '';
        const description = document.getElementById('description').value || '';

        // 日付を決定
        const dateToUse = useFileDate ? new Date(file.lastModified) : new Date();
        const timestamp = dateToUse.toISOString().slice(0, 10).replace(/-/g, '');
        const originalFileName = file.name.replace(/\.[^/.]+$/, '');
        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `${timestamp}_${originalFileName}.${ext}`;

        // 1. Lambda APIからPre-signed URLを取得
        const presignedData = await this.getPresignedUrl(fileName, file.type);

        // 2. S3に直接アップロード
        const response = await fetch(presignedData.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });

        if (!response.ok) {
            throw new Error(`S3アップロード失敗: ${response.status} ${response.statusText}`);
        }

        console.log('✅ S3アップロード完了:', presignedData.s3Key);

        // アップロード情報を返す
        return {
            s3Key: presignedData.s3Key,
            fileName: fileName,
            title: title,
            description: description,
            fileSize: file.size,
            date: dateToUse.toISOString().slice(0, 10)
        };
    }

    async getPresignedUrl(fileName, fileType) {
        const response = await fetch(this.lambdaEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName: fileName,
                fileType: fileType
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pre-signed URL取得失敗: ${response.status} ${errorText}`);
        }

        return await response.json();
    }

    async triggerGitHubActions(uploadedFiles) {
        // repository_dispatch イベントをトリガー
        const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/dispatches`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: 'process_uploaded_images',
                client_payload: {
                    files: uploadedFiles
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API Error:', errorData);
            throw new Error(`GitHub Actions トリガー失敗: ${response.status} ${errorData.message}`);
        }

        console.log('✅ GitHub Actions triggered');
    }
}

// トークン管理用のグローバル関数
function saveToken() {
    const token = document.getElementById('githubToken').value.trim();
    if (token) {
        localStorage.setItem('github_token', token);
        uploader.githubToken = token;
        alert('トークンを保存しました');
    }
}

function clearToken() {
    if (confirm('保存されたトークンを削除しますか？')) {
        localStorage.removeItem('github_token');
        document.getElementById('githubToken').value = '';
        uploader.githubToken = null;
        alert('トークンを削除しました');
    }
}

// 初期化
const uploader = new PhotoUploader();
