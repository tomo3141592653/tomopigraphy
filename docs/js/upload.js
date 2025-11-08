// GitHub APIを使用した写真アップローダー
class GitHubPhotoUploader {
    constructor() {
        this.selectedFiles = [];
        this.githubToken = null;
        this.repoOwner = null;
        this.repoName = null;
        this.init();
    }

    async init() {
        // 保存されたトークンを読み込む
        this.githubToken = localStorage.getItem('github_token');
        if (this.githubToken) {
            document.getElementById('githubToken').value = this.githubToken;
        }

        // リポジトリ情報を取得（GitHub PagesのURLから推測）
        this.detectRepoInfo();

        // イベントリスナーを設定
        this.setupEventListeners();
    }

    detectRepoInfo() {
        // GitHub PagesのURLからリポジトリ情報を推測
        // 例: https://username.github.io/repo-name/ → owner: username, repo: repo-name
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
                // pathnameからリポジトリ名を取得（通常は /repo-name/ の形式）
                const pathParts = pathname.split('/').filter(p => p);
                this.repoName = pathParts[0] || 'photo_site';
                
                // 保存
                localStorage.setItem('github_repo_owner', this.repoOwner);
                localStorage.setItem('github_repo_name', this.repoName);
            }
        } else {
            // ローカル開発環境の場合、デフォルト値を設定
            // ユーザーが手動で設定できるようにする
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
        const imageFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                return false;
            }
            // GitHubのファイルサイズ制限（100MB）をチェック
            if (file.size > 100 * 1024 * 1024) {
                this.showStatus(`❌ ${file.name} が大きすぎます（100MB以下にしてください）`, 'error');
                return false;
            }
            return true;
        });
        
        if (imageFiles.length === 0) {
            this.showStatus('画像ファイルを選択してください', 'error');
            return;
        }

        this.selectedFiles = imageFiles;
        this.showPreview();
        this.updateUploadButton();
    }

    showPreview() {
        const previewSection = document.getElementById('previewSection');
        const previewGrid = document.getElementById('previewGrid');
        
        previewSection.style.display = 'block';
        previewGrid.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
                // ファイルサイズをフォーマット
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-btn" onclick="uploader.removeFile(${index})">×</button>
                    <div class="file-info" style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.7); padding: 3px 6px; border-radius: 3px; font-size: 11px;">
                        ${fileSize} MB
                    </div>
                `;
                previewGrid.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        if (this.selectedFiles.length === 0) {
            document.getElementById('previewSection').style.display = 'none';
        } else {
            this.showPreview();
        }
        this.updateUploadButton();
    }

    updateUploadButton() {
        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.disabled = this.selectedFiles.length === 0 || !this.githubToken;
    }

    async uploadImages() {
        if (!this.githubToken) {
            this.showStatus('GitHubトークンを設定してください', 'error');
            return;
        }

        if (this.selectedFiles.length === 0) {
            this.showStatus('画像を選択してください', 'error');
            return;
        }

        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="loading"></span>アップロード中...';

        try {
            // まずartworks.jsonを読み込む
            const artworksData = await this.loadArtworksJson();

            // 各ファイルをアップロード
            for (const file of this.selectedFiles) {
                await this.uploadSingleImage(file, artworksData);
            }

            // artworks.jsonを更新
            await this.updateArtworksJson(artworksData);

            this.showStatus(`✅ ${this.selectedFiles.length}枚の画像をアップロードしました！`, 'success');
            this.selectedFiles = [];
            document.getElementById('previewSection').style.display = 'none';
            document.getElementById('fileInput').value = '';
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';

        } catch (error) {
            console.error('Upload error:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
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

    async uploadSingleImage(file, artworksData) {
        const title = document.getElementById('title').value || '';
        const description = document.getElementById('description').value || '';
        const useFileDate = document.getElementById('useFileDate').checked;

        // 日付を決定
        const dateToUse = useFileDate ? new Date(file.lastModified) : new Date();
        const timestamp = dateToUse.toISOString().slice(0, 10).replace(/-/g, '');
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        const ext = file.name.split('.').pop().toLowerCase();
        const id = `${timestamp}_${fileName}`;

        // 画像をBase64に変換
        const base64Image = await this.fileToBase64(file);

        // 画像ファイルをリポジトリにコミット
        const year = dateToUse.getFullYear();
        const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
        
        // ディレクトリが存在するか確認（GitHub APIでは自動的に作成されないため）
        // まず親ディレクトリの存在を確認
        const imageDir = `docs/images/${year}/${month}`;
        const imagePath = `${imageDir}/${id}.${ext}`;

        // 既存ファイルのSHAを取得（存在しない場合はnull）
        const existingSha = await this.getFileSha(imagePath);
        
        // 画像をコミット（既存ファイルがある場合はSHAを渡す）
        await this.commitFile(imagePath, base64Image, `Add image: ${id}`, existingSha);

        // メタデータを作成（簡易版 - 実際の画像処理はGitHub Actionsで行う）
        const artwork = {
            id,
            title,
            description,
            date: dateToUse.toISOString().slice(0, 10),
            year,
            month: parseInt(month),
            original: `images/${year}/${month}/${id}.${ext}`,
            thumbnail: `images/${year}/${month}/${id}_thumb.jpg`, // GitHub Actionsで生成される
            webp: `images/${year}/${month}/${id}.webp`, // GitHub Actionsで生成される
            responsive: {},
            dimensions: { width: 0, height: 0 }, // 後で更新
            fileSize: file.size
        };

        artworksData.artworks.unshift(artwork);
        artworksData.totalCount = artworksData.artworks.length;
        artworksData.lastUpdated = new Date().toISOString();
    }

    async loadArtworksJson() {
        try {
            const response = await fetch('data/artworks.json');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not load artworks.json:', error);
        }
        return { artworks: [], totalCount: 0, lastUpdated: null };
    }

    async updateArtworksJson(artworksData) {
        const content = JSON.stringify(artworksData, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(content)));
        
        // まず現在のファイルを取得（SHAが必要）
        const currentSha = await this.getFileSha('docs/data/artworks.json');
        
        await this.commitFile('docs/data/artworks.json', base64Content, 'Update artworks.json', currentSha);
    }

    async getFileSha(path) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
                {
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data.sha;
            }
        } catch (error) {
            console.warn('Could not get file SHA:', error);
        }
        return null;
    }

    async commitFile(path, content, message, sha = null) {
        if (!this.repoOwner || !this.repoName) {
            throw new Error('リポジトリ情報が設定されていません');
        }

        const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`;
        
        // ブランチ名を取得（デフォルトはmain）
        let branch = 'main';
        try {
            const repoResponse = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}`,
                {
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            if (repoResponse.ok) {
                const repoData = await repoResponse.json();
                branch = repoData.default_branch || 'main';
            }
        } catch (error) {
            console.warn('Could not detect default branch, using main');
        }
        
        const body = {
            message: message,
            content: content,
            branch: branch
        };

        if (sha) {
            body.sha = sha;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.message || 'Failed to commit file';
            console.error('GitHub API Error:', errorData);
            throw new Error(errorMessage);
        }

        return await response.json();
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // data:image/jpeg;base64, の部分を削除
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.className = `status-message ${type}`;
        // 改行を<br>に変換して表示
        statusDiv.innerHTML = message.replace(/\n/g, '<br>');
        statusDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// グローバル関数
function saveToken() {
    const token = document.getElementById('githubToken').value.trim();
    if (token) {
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            if (!confirm('トークンの形式が正しくない可能性があります。続行しますか？')) {
                return;
            }
        }
        localStorage.setItem('github_token', token);
        uploader.githubToken = token;
        uploader.updateUploadButton();
        alert('✅ トークンを保存しました\n\n⚠️ セキュリティ注意:\n- このトークンはブラウザに保存されます\n- 同じブラウザを使う人は誰でもアップロードできます\n- 共有PCでは使用しないでください');
    } else {
        alert('トークンを入力してください');
    }
}

function clearToken() {
    if (confirm('保存されているトークンを削除しますか？')) {
        localStorage.removeItem('github_token');
        document.getElementById('githubToken').value = '';
        uploader.githubToken = null;
        uploader.updateUploadButton();
        alert('トークンを削除しました');
    }
}

// インスタンスを作成
const uploader = new GitHubPhotoUploader();

