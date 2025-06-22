// フォーム要素とUI要素の取得
const form = document.getElementById('createFeedForm');
const submitBtn = document.getElementById('submitBtn');
const previewBtn = document.getElementById('previewBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const result = document.getElementById('result');

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    loadStatistics();
    loadRecentFeeds();
    
    // フォームイベントリスナーの設定
    form.addEventListener('submit', handleFormSubmit);
    previewBtn.addEventListener('click', handlePreview);
    
    // リアルタイムバリデーション
    const requiredInputs = form.querySelectorAll('input[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('input', validateForm);
    });
    
    // Cコード入力の数字のみ制限
    const ccodeInput = document.getElementById('ccode');
    ccodeInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
});

// フォーム送信ハンドラー
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = getFormData();
    
    setLoading(true);
    hideResult();
    
    try {
        const response = await fetch('/api/create-feed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(data);
            form.reset();
            // 統計情報と最新フィード一覧を更新
            setTimeout(() => {
                loadStatistics();
                // 新規作成されたフィード情報を含めて更新
                const newFeedInfo = {
                    id: data.feedId,
                    name: formData.feedName,
                    criteria: {
                        seriesName: formData.seriesName || null,
                        titleKeyword: formData.titleKeyword || null,
                        publisher: formData.publisher || null,
                        ccode: formData.ccode || null,
                        ccodeMatchType: formData.ccodeMatchType
                    },
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                    feedUrl: data.feedUrl,
                    itemCount: 0
                };
                loadRecentFeeds(newFeedInfo);
            }, 1000);
        } else {
            showError(data.message);
        }
        
    } catch (error) {
        console.error('フィード作成エラー:', error);
        showError('サーバーエラーが発生しました。しばらく時間をおいて再試行してください。');
    } finally {
        setLoading(false);
    }
}

// プレビューハンドラー
function handlePreview(e) {
    e.preventDefault();
    
    const formData = getFormData();
    const criteria = [];
    
    if (formData.seriesName) {
        criteria.push(`シリーズ名: "${formData.seriesName}" (完全一致)`);
    }
    if (formData.titleKeyword) {
        criteria.push(`書名: "${formData.titleKeyword}" を含む`);
    }
    if (formData.publisher) {
        criteria.push(`出版社: "${formData.publisher}" (完全一致)`);
    }
    if (formData.ccode) {
        const matchTypeText = {
            exact: '完全一致',
            prefix: '前方一致',
            suffix: '後方一致'
        }[formData.ccodeMatchType];
        criteria.push(`Cコード: "${formData.ccode}" (${matchTypeText})`);
    }
    
    if (criteria.length === 0) {
        showError('少なくとも一つの検索条件を入力してください。');
        return;
    }
    
    const message = `
        <strong>フィード名:</strong> ${formData.feedName}<br><br>
        <strong>検索条件:</strong><br>
        ${criteria.map(c => `• ${c}`).join('<br>')}
        <br><br>
        <em>これらの条件に一致する書籍が OpenBD に登録された際にフィードに追加されます。</em>
    `;
    
    showInfo(message);
}

// フォームバリデーション
function validateForm() {
    const formData = getFormData();
    const errors = [];
    
    // フィード名の検証
    if (!formData.feedName.trim()) {
        errors.push('フィード名は必須です');
    } else if (formData.feedName.length > 100) {
        errors.push('フィード名は100文字以内で入力してください');
    }
    
    // 検索条件の検証
    const hasCondition = formData.seriesName || formData.titleKeyword || 
                        formData.publisher || formData.ccode;
    if (!hasCondition) {
        errors.push('少なくとも一つの検索条件を入力してください');
    }
    
    // 文字数制限チェック
    if (formData.seriesName && formData.seriesName.length > 200) {
        errors.push('シリーズ名は200文字以内で入力してください');
    }
    if (formData.titleKeyword && formData.titleKeyword.length > 200) {
        errors.push('書名キーワードは200文字以内で入力してください');
    }
    if (formData.publisher && formData.publisher.length > 200) {
        errors.push('出版社名は200文字以内で入力してください');
    }
    if (formData.ccode && formData.ccode.length > 10) {
        errors.push('Cコードは10文字以内で入力してください');
    }
    
    // Cコードの形式チェック
    if (formData.ccode && !/^[0-9]+$/.test(formData.ccode)) {
        errors.push('Cコードは数字のみで入力してください');
    }
    
    if (errors.length > 0) {
        showError(errors.join('<br>'));
        return false;
    }
    
    return true;
}

// フォームデータの取得
function getFormData() {
    return {
        feedName: document.getElementById('feedName').value.trim(),
        seriesName: document.getElementById('seriesName').value.trim(),
        titleKeyword: document.getElementById('titleKeyword').value.trim(),
        publisher: document.getElementById('publisher').value.trim(),
        ccode: document.getElementById('ccode').value.trim(),
        ccodeMatchType: document.getElementById('ccodeMatchType').value
    };
}

// 統計情報の読み込み
async function loadStatistics() {
    try {
        const response = await fetch('/api/feeds/index');
        const data = await response.json();
        
        const statsElement = document.getElementById('statsInfo');
        if (data.stats) {
            statsElement.innerHTML = `
                <p><strong>総フィード数:</strong> ${data.totalFeeds}</p>
                <p><strong>アクティブフィード数:</strong> ${data.stats.totalActiveFeeds}</p>
                <p><strong>最終更新:</strong> ${formatDate(data.lastUpdated)}</p>
            `;
        } else {
            statsElement.innerHTML = '<p>統計情報を読み込めませんでした</p>';
        }
    } catch (error) {
        console.error('統計情報の読み込みエラー:', error);
        document.getElementById('statsInfo').innerHTML = '<p>統計情報を読み込めませんでした</p>';
    }
}

// 最新フィード一覧の読み込み
async function loadRecentFeeds(newFeedInfo = null) {
    try {
        // 新規フィード情報をクエリパラメータとして渡す
        let url = '/api/feeds/index';
        if (newFeedInfo) {
            const feedParam = encodeURIComponent(JSON.stringify(newFeedInfo));
            url += `?newFeed=${feedParam}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        const recentFeedsElement = document.getElementById('recentFeeds');
        
        if (data.feeds && data.feeds.length > 0) {
            const recentFeeds = data.feeds.slice(0, 10); // 最新10件
            recentFeedsElement.innerHTML = recentFeeds.map(feed => `
                <div class="feed-item">
                    <h4>${escapeHtml(feed.name)}</h4>
                    <div class="feed-criteria">
                        ${formatCriteria(feed.criteria)}
                    </div>
                    <div class="feed-meta">
                        <span>作成: ${formatDate(feed.createdAt)}</span>
                        <a href="${feed.feedUrl}" class="feed-url-link" target="_blank">RSS</a>
                    </div>
                </div>
            `).join('');
        } else {
            recentFeedsElement.innerHTML = '<p>まだフィードが作成されていません。</p>';
        }
    } catch (error) {
        console.error('最新フィード一覧の読み込みエラー:', error);
        document.getElementById('recentFeeds').innerHTML = '<p>フィード一覧を読み込めませんでした</p>';
    }
}

// UI制御関数
function setLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtn.textContent = '作成中...';
    } else {
        loadingIndicator.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'フィードを作成';
    }
}

function showSuccess(data) {
    result.className = 'result success';
    result.innerHTML = `
        <div>✅ ${data.message}</div>
        <div class="feed-url">
            <strong>RSS URL:</strong><br>
            <span id="feedUrlText">${data.feedUrl}</span>
            <br>
            <button class="copy-button" onclick="copyToClipboard('${data.feedUrl}', this)">
                URLをコピー
            </button>
        </div>
        <div style="margin-top: 15px;">
            <small>
                このURLをRSSリーダーに登録してください。<br>
                フィードは毎日午前4時に自動更新されます。
            </small>
        </div>
    `;
    result.classList.remove('hidden');
}

function showError(message) {
    result.className = 'result error';
    result.innerHTML = `❌ ${message}`;
    result.classList.remove('hidden');
}

function showInfo(message) {
    result.className = 'result success';
    result.innerHTML = `ℹ️ ${message}`;
    result.classList.remove('hidden');
}

function hideResult() {
    result.classList.add('hidden');
}

// ユーティリティ関数
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCriteria(criteria) {
    const parts = [];
    
    if (criteria.seriesName) {
        parts.push(`シリーズ: ${criteria.seriesName}`);
    }
    if (criteria.titleKeyword) {
        parts.push(`書名: ${criteria.titleKeyword}`);
    }
    if (criteria.publisher) {
        parts.push(`出版社: ${criteria.publisher}`);
    }
    if (criteria.ccode) {
        const matchTypeText = {
            exact: '完全一致',
            prefix: '前方一致',
            suffix: '後方一致'
        }[criteria.ccodeMatchType];
        parts.push(`Cコード: ${criteria.ccode} (${matchTypeText})`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : '条件なし';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyToClipboard(text, buttonElement) {
    // より確実なクリップボードコピー関数
    const copyText = async () => {
        try {
            // Modern browsers - navigator.clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (!success) {
                throw new Error('execCommand failed');
            }
            
            return true;
        } catch (err) {
            console.error('クリップボードコピーエラー:', err);
            return false;
        }
    };
    
    copyText().then(success => {
        // ボタンの取得 - event.targetまたは引数から
        const button = buttonElement || event?.target;
        
        if (success) {
            if (button) {
                const originalText = button.textContent;
                const originalBackground = button.style.background;
                
                button.textContent = 'コピーしました！';
                button.style.background = '#10b981';
                button.disabled = true;
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = originalBackground || '#667eea';
                    button.disabled = false;
                }, 2000);
            }
        } else {
            // フォールバック: テキスト選択
            if (button) {
                button.textContent = 'コピーに失敗しました';
                button.style.background = '#ef4444';
                
                setTimeout(() => {
                    button.textContent = 'URLをコピー';
                    button.style.background = '#667eea';
                }, 2000);
            }
            
            // テキストを選択状態にして手動コピーを促す
            const feedUrlElement = document.getElementById('feedUrlText');
            if (feedUrlElement) {
                if (window.getSelection) {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(feedUrlElement);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
            
            alert('自動コピーに失敗しました。URLが選択されているので、Ctrl+C (Mac: Cmd+C) で手動コピーしてください。');
        }
    });
}