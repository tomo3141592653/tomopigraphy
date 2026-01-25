// Pixel Art Gallery JavaScript
class PixelGallery {
    constructor() {
        this.artworks = [];
        this.currentView = 'random';
        this.currentRandomIndex = 0;
        this.currentModalIndex = 0;
        this.modalArtworks = [];
        this.isCompactView = false;
        this.sortedArtworks = [];
        this.currentNewestIndex = 0;
        
        this.init();
    }

    async init() {
        await this.loadArtworks();
        this.setupEventListeners();
        this.handleInitialView();
    }

    // Parse URL query parameters
    getViewFromURL() {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        // Map URL params to internal view names
        if (view === 'top') return 'top';
        if (view === 'gallery') return 'gallery';
        return 'random'; // default
    }

    // Update URL when view changes
    updateURL(view) {
        const url = new URL(window.location);
        if (view === 'random') {
            url.searchParams.delete('view');
        } else {
            url.searchParams.set('view', view);
        }
        // Clear hash when switching views
        url.hash = '';
        window.history.pushState({view: view}, '', url);
    }

    // Handle initial view based on URL
    handleInitialView() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            // If there's a hash, open that artwork in modal
            this.handleHashChange();
            return;
        }

        const view = this.getViewFromURL();
        this.switchView(view, false); // Don't update URL on initial load

        // For random view, show first random
        if (view === 'random') {
            this.nextRandom();
        }
    }

    async loadArtworks() {
        try {
            const response = await fetch('data/artworks.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.artworks = data.artworks;
            
            // Sort artworks by date (newest first) for newest functionality
            this.sortedArtworks = [...this.artworks].sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Failed to load artworks:', error);
            this.artworks = [];
            this.sortedArtworks = [];
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(link.dataset.view);
            });
        });

        // Random controls
        document.getElementById('newestBtn').addEventListener('click', () => {
            this.showNewest();
        });
        
        document.getElementById('randomBtn').addEventListener('click', () => {
            this.nextRandom();
        });

        // Top view controls
        const topPrevBtn = document.getElementById('topPrevBtn');
        const topNextBtn = document.getElementById('topNextBtn');
        const topLatestBtn = document.getElementById('topLatestBtn');

        if (topPrevBtn) {
            topPrevBtn.addEventListener('click', () => this.topPrev());
        }
        if (topNextBtn) {
            topNextBtn.addEventListener('click', () => this.topNext());
        }
        if (topLatestBtn) {
            topLatestBtn.addEventListener('click', () => this.topLatest());
        }

        // Gallery controls
        document.getElementById('normalView').addEventListener('click', () => {
            this.toggleView(false);
        });

        document.getElementById('compactView').addEventListener('click', () => {
            this.toggleView(true);
        });

        // Modal controls
        document.getElementById('modalPrev').addEventListener('click', () => {
            this.prevModalArtwork();
        });
        
        document.getElementById('modalNext').addEventListener('click', () => {
            this.nextModalArtwork();
        });

        // Modal outside click
        document.getElementById('artModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('artModal')) {
                this.closeModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('artModal').style.display === 'flex') {
                if (e.key === 'Escape') this.closeModal();
                if (e.key === 'ArrowLeft') this.prevModalArtwork();
                if (e.key === 'ArrowRight') this.nextModalArtwork();
            } else if (this.currentView === 'random') {
                if (e.key === ' ' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.nextRandom();
                }
            } else if (this.currentView === 'top') {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.topPrev();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.topNext();
                }
            }
        });

        // Hash change handler for permalinks
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

        // Browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.switchView(e.state.view, false);
            } else {
                // Check URL for view parameter
                const view = this.getViewFromURL();
                this.switchView(view, false);
            }
        });
    }

    // Random display functions
    showRandomArtwork() {
        if (this.artworks.length === 0) {
            console.error('No artworks available');
            return;
        }
        
        const artwork = this.artworks[this.currentRandomIndex];
        if (!artwork || !artwork.original) {
            console.error('Invalid artwork data:', artwork);
            return;
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        const newestBtn = document.getElementById('newestBtn');
        const randomBtn = document.getElementById('randomBtn');
        const randomImage = document.getElementById('randomImage');
        const randomTitle = document.getElementById('randomTitle');
        const randomMeta = document.getElementById('randomMeta');
        
        loadingOverlay.style.display = 'flex';
        newestBtn.disabled = true;
        randomBtn.disabled = true;
        
        // Preload image
        const img = new Image();
        img.onload = () => {
            randomImage.src = artwork.original;
            randomTitle.textContent = artwork.title || '';
            randomMeta.textContent = this.formatDate(artwork.date);
            
            loadingOverlay.style.display = 'none';
            newestBtn.disabled = false;
            randomBtn.disabled = false;
        };
        img.onerror = () => {
            console.error('Failed to load image:', artwork.original);
            // Fallback if image fails to load
            randomImage.src = artwork.thumbnail || artwork.original;
            randomTitle.textContent = artwork.title || '';
            randomMeta.textContent = this.formatDate(artwork.date);
            
            loadingOverlay.style.display = 'none';
            newestBtn.disabled = false;
            randomBtn.disabled = false;
        };
        img.src = artwork.original;
    }

    nextRandom() {
        this.currentRandomIndex = Math.floor(Math.random() * this.artworks.length);
        this.showRandomArtwork();
    }

    showNewest() {
        if (this.sortedArtworks.length === 0) {
            console.error('No sorted artworks available');
            return;
        }
        
        const artwork = this.sortedArtworks[this.currentNewestIndex];
        if (!artwork || !artwork.original) {
            console.error('Invalid newest artwork data:', artwork);
            return;
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        const newestBtn = document.getElementById('newestBtn');
        const randomBtn = document.getElementById('randomBtn');
        const randomImage = document.getElementById('randomImage');
        const randomTitle = document.getElementById('randomTitle');
        const randomMeta = document.getElementById('randomMeta');
        
        loadingOverlay.style.display = 'flex';
        newestBtn.disabled = true;
        randomBtn.disabled = true;
        
        // Preload image
        const img = new Image();
        img.onload = () => {
            randomImage.src = artwork.original;
            randomTitle.textContent = artwork.title || '';
            randomMeta.textContent = this.formatDate(artwork.date);
            
            loadingOverlay.style.display = 'none';
            newestBtn.disabled = false;
            randomBtn.disabled = false;
        };
        img.onerror = () => {
            console.error('Failed to load newest image:', artwork.original);
            // Fallback if image fails to load
            randomImage.src = artwork.thumbnail || artwork.original;
            randomTitle.textContent = artwork.title || '';
            randomMeta.textContent = this.formatDate(artwork.date);
            
            loadingOverlay.style.display = 'none';
            newestBtn.disabled = false;
            randomBtn.disabled = false;
        };
        img.src = artwork.original;

        // Move to next newest for subsequent clicks
        this.currentNewestIndex = (this.currentNewestIndex + 1) % this.sortedArtworks.length;
    }

    // Gallery functions
    showGallery() {
        if (this.artworks.length === 0) {
            document.getElementById('galleryContent').innerHTML = '<p>作品が見つかりませんでした。</p>';
            return;
        }

        const artworksByYear = {};
        
        // Group by year
        this.artworks.forEach(artwork => {
            if (!artwork || !artwork.year) return;
            if (!artworksByYear[artwork.year]) {
                artworksByYear[artwork.year] = [];
            }
            artworksByYear[artwork.year].push(artwork);
        });

        // Sort years in descending order
        const years = Object.keys(artworksByYear).sort((a, b) => b - a);
        
        let html = '';
        years.forEach(year => {
            const artworks = artworksByYear[year].sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            html += `
                <div class="year-section">
                    <h2 class="year-title">${year}</h2>
                    <div class="thumbnails-grid ${this.isCompactView ? 'compact' : ''}">
            `;
            
            artworks.forEach(artwork => {
                if (!artwork || !artwork.id) return;
                const srcset = this.generateSrcset(artwork);
                const sizes = this.getSizesAttribute(this.isCompactView);
                const fallbackSrc = artwork.thumbnail || artwork.original;
                
                html += `
                    <div class="thumbnail-card ${this.isCompactView ? 'compact' : ''}" onclick="gallery.openModal('${artwork.id}')">
                        <img class="thumbnail-image ${this.isCompactView ? 'compact' : ''}" 
                             src="${fallbackSrc}"
                             srcset="${srcset}"
                             sizes="${sizes}"
                             loading="lazy" 
                             onerror="this.src='${artwork.original}'"
                             alt="${artwork.title || ''}">
                        <div class="thumbnail-title ${this.isCompactView ? 'compact' : ''}">${artwork.title || ''}</div>
                        <div class="thumbnail-meta ${this.isCompactView ? 'compact' : ''}">
                            <span>${this.formatDate(artwork.date)}</span>
                            <span class="thumbnail-date ${this.isCompactView ? 'compact' : ''}">${artwork.year}</span>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        document.getElementById('galleryContent').innerHTML = html;
    }

    // View switching
    switchView(view, updateUrl = true) {
        this.currentView = view;

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === view) {
                link.classList.add('active');
            }
        });

        // Update URL if requested
        if (updateUrl) {
            this.updateURL(view);
        }

        // Show/hide sections based on view
        const randomSection = document.getElementById('randomSection');
        const gallerySection = document.getElementById('gallerySection');
        const topSection = document.getElementById('topSection');

        // Hide all sections first
        randomSection.classList.add('hidden');
        gallerySection.classList.remove('active');
        if (topSection) topSection.classList.add('hidden');

        if (view === 'random') {
            randomSection.classList.remove('hidden');
        } else if (view === 'top') {
            if (topSection) {
                topSection.classList.remove('hidden');
                this.showTopView();
            } else {
                // Fallback: use random section for top view
                randomSection.classList.remove('hidden');
                this.currentNewestIndex = 0;
                this.showNewest();
            }
        } else if (view === 'gallery') {
            gallerySection.classList.add('active');
            this.showGallery();
        }
    }

    // Top view (newest photos) display
    showTopView() {
        if (this.sortedArtworks.length === 0) {
            return;
        }

        const topSection = document.getElementById('topSection');
        if (!topSection) return;

        const topImage = document.getElementById('topImage');
        const topTitle = document.getElementById('topTitle');
        const topMeta = document.getElementById('topMeta');
        const topCounter = document.getElementById('topCounter');
        const loadingOverlay = topSection.querySelector('.loading-overlay') || document.getElementById('loadingOverlay');

        const artwork = this.sortedArtworks[this.currentNewestIndex];
        if (!artwork) return;

        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        const img = new Image();
        img.onload = () => {
            topImage.src = artwork.original;
            topTitle.textContent = artwork.title || '';
            topMeta.textContent = this.formatDate(artwork.date);
            if (topCounter) {
                topCounter.textContent = `${this.currentNewestIndex + 1} / ${this.sortedArtworks.length}`;
            }
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        };
        img.onerror = () => {
            topImage.src = artwork.thumbnail || artwork.original;
            topTitle.textContent = artwork.title || '';
            topMeta.textContent = this.formatDate(artwork.date);
            if (topCounter) {
                topCounter.textContent = `${this.currentNewestIndex + 1} / ${this.sortedArtworks.length}`;
            }
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        };
        img.src = artwork.original;
    }

    // Navigate to previous photo in top view
    topPrev() {
        if (this.currentNewestIndex > 0) {
            this.currentNewestIndex--;
            this.showTopView();
        }
    }

    // Navigate to next photo in top view
    topNext() {
        if (this.currentNewestIndex < this.sortedArtworks.length - 1) {
            this.currentNewestIndex++;
            this.showTopView();
        }
    }

    // Go to latest photo in top view
    topLatest() {
        this.currentNewestIndex = 0;
        this.showTopView();
    }

    toggleView(compact) {
        this.isCompactView = compact;
        
        // Update buttons
        const normalBtn = document.getElementById('normalView');
        const compactBtn = document.getElementById('compactView');
        
        if (compact) {
            normalBtn.classList.remove('active');
            compactBtn.classList.add('active');
        } else {
            normalBtn.classList.add('active');
            compactBtn.classList.remove('active');
        }
        
        // Refresh gallery if currently viewing
        if (this.currentView === 'gallery') {
            this.showGallery();
        }
    }

    // Modal functions
    openModal(artworkId) {
        const artwork = this.artworks.find(art => art.id === artworkId);
        if (!artwork) return;

        this.modalArtworks = [...this.artworks].sort((a, b) => new Date(b.date) - new Date(a.date));
        this.currentModalIndex = this.modalArtworks.findIndex(art => art.id === artworkId);

        // Update URL hash for permalink
        window.history.pushState({}, '', `#${artworkId}`);
        
        this.showModalArtwork();
        document.getElementById('artModal').style.display = 'flex';
    }

    showModalArtwork() {
        const artwork = this.modalArtworks[this.currentModalIndex];
        const modalImage = document.getElementById('modalImage');
        const modalTitle = document.getElementById('modalTitle');
        const modalMeta = document.getElementById('modalMeta');
        
        modalImage.src = artwork.original;
        modalImage.onerror = () => {
            modalImage.src = artwork.thumbnail;
        };
        modalTitle.textContent = artwork.title || '';
        modalMeta.textContent = this.formatDate(artwork.date);
    }

    closeModal() {
        document.getElementById('artModal').style.display = 'none';
        // Clear hash when closing modal
        window.history.pushState({}, '', window.location.pathname);
    }

    prevModalArtwork() {
        this.currentModalIndex = this.currentModalIndex > 0 ? 
            this.currentModalIndex - 1 : 
            this.modalArtworks.length - 1;
        
        // Update URL hash
        const artwork = this.modalArtworks[this.currentModalIndex];
        window.history.pushState({}, '', `#${artwork.id}`);
        
        this.showModalArtwork();
    }

    nextModalArtwork() {
        this.currentModalIndex = this.currentModalIndex < this.modalArtworks.length - 1 ? 
            this.currentModalIndex + 1 : 
            0;
        
        // Update URL hash
        const artwork = this.modalArtworks[this.currentModalIndex];
        window.history.pushState({}, '', `#${artwork.id}`);
        
        this.showModalArtwork();
    }

    // Utility functions
    formatDate(dateString) {
        if (!dateString) return '日付不明';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Invalid date format:', dateString);
            return '日付不明';
        }
    }

    // レスポンシブ画像のsrcsetを生成
    generateSrcset(artwork) {
        if (!artwork.responsive || Object.keys(artwork.responsive).length === 0) {
            // レスポンシブ画像がない場合はオリジナルのみ
            return artwork.original;
        }

        const srcsetParts = [];
        const responsiveSizes = [640, 768, 1024, 1280, 1536, 1920, 2560];
        
        // 利用可能なレスポンシブ画像を追加
        responsiveSizes.forEach(size => {
            if (artwork.responsive[size]) {
                srcsetParts.push(`${artwork.responsive[size]} ${size}w`);
            }
        });

        // オリジナル画像を最大サイズとして追加
        if (artwork.dimensions && artwork.dimensions.width) {
            srcsetParts.push(`${artwork.original} ${artwork.dimensions.width}w`);
        }

        return srcsetParts.join(', ');
    }

    // レスポンシブ画像の適切なsizesを取得
    getSizesAttribute(isCompact = false) {
        if (isCompact) {
            // compact view用のsizes（複数列グリッド）
            return '(max-width: 430px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw';
        } else {
            // normal view用のsizes（1列表示、最大幅1200px）
            return '(max-width: 768px) calc(100vw - 40px), min(1200px, calc(100vw - 40px))';
        }
    }

    // Permalink handling functions
    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const artwork = this.artworks.find(art => art.id === hash);
            if (artwork) {
                this.openModalFromPermalink(artwork.id);
            }
        } else {
            // If hash is removed, close modal
            if (document.getElementById('artModal').style.display === 'flex') {
                document.getElementById('artModal').style.display = 'none';
            }
        }
    }

    openModalFromPermalink(artworkId) {
        const artwork = this.artworks.find(art => art.id === artworkId);
        if (!artwork) return;

        this.modalArtworks = [...this.artworks].sort((a, b) => new Date(b.date) - new Date(a.date));
        this.currentModalIndex = this.modalArtworks.findIndex(art => art.id === artworkId);

        this.showModalArtwork();
        document.getElementById('artModal').style.display = 'flex';
    }
}

// Initialize gallery
const gallery = new PixelGallery();