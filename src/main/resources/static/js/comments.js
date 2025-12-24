let currentProductId = null;

async function loadComments(productId) {
    currentProductId = productId;
    console.log('开始加载评论，商品ID:', productId);

    try {
        const response = await fetch(`/api/comments/product/${productId}`);
        const result = await response.json();
        
        console.log('评论数据:', result);

        if (result.success) {
            displayComments(result.data);
        } else {
            console.error('加载评论失败:', result.message);
        }
    } catch (error) {
        console.error('加载评论错误:', error);
    }
}

function displayComments(comments) {
    const commentsList = document.getElementById('commentsList');

    console.log('显示评论，数量:', comments ? comments.length : 0);

    if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无评价</p>';
        return;
    }

    const topComments = comments.filter(c => !c.parentId);
    commentsList.innerHTML = topComments.map(comment => renderComment(comment, comments, 0)).join('');
}

function renderComment(comment, allComments, level) {
    const replies = allComments.filter(c => c.parentId === comment.id);
    const indent = level * 30;
    const username = comment.username || '匿名用户';
    const firstChar = username.charAt(0);
    const avatar = comment.avatar || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23ddd'/%3E%3Ctext x='20' y='26' text-anchor='middle' font-size='18' fill='%23666'%3E${firstChar}%3C/text%3E%3C/svg%3E`;

    return `
        <div class="comment-item" style="margin-left: ${indent}px;">
            <div class="comment-header">
                <span class="comment-user">
                    <img src="${avatar}" alt="头像" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 8px;">
                    ${username}
                </span>
                <span class="comment-time">${formatTime(comment.createTime)}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <a href="javascript:void(0)" onclick="showReplyBox(${comment.id})">回复</a>
            </div>
            <div class="reply-box" id="replyBox${comment.id}" style="display: none;">
                <textarea id="replyContent${comment.id}" placeholder="写下你的回复..." rows="2"></textarea>
                <button onclick="submitReply(${comment.id})">发表回复</button>
                <button onclick="cancelReply(${comment.id})">取消</button>
            </div>
        </div>
        ${replies.map(reply => renderComment(reply, allComments, level + 1)).join('')}
    `;
}

async function submitComment() {
    const content = document.getElementById('commentContent').value.trim();
    if (!content) {
        alert('请输入评论内容');
        return;
    }

    const token = localStorage.getItem('token') || '';

    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
                productId: parseInt(currentProductId),
                content: content,
                parentId: null
            })
        });

        const result = await response.json();
        console.log('发表评论结果:', result);

        if (result.success) {
            alert('评论发表成功');
            document.getElementById('commentContent').value = '';
            loadComments(currentProductId);
        } else {
            alert('发表失败: ' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('发表评论错误:', error);
        alert('发表失败: ' + error.message);
    }
}

function showReplyBox(commentId) {
    document.querySelectorAll('.reply-box').forEach(box => box.style.display = 'none');
    document.getElementById(`replyBox${commentId}`).style.display = 'block';
}

function cancelReply(commentId) {
    document.getElementById(`replyBox${commentId}`).style.display = 'none';
    document.getElementById(`replyContent${commentId}`).value = '';
}

async function submitReply(parentId) {
    const content = document.getElementById(`replyContent${parentId}`).value.trim();
    if (!content) {
        alert('请输入回复内容');
        return;
    }

    const token = localStorage.getItem('token') || '';

    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
                productId: parseInt(currentProductId),
                content: content,
                parentId: parentId
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('回复成功');
            cancelReply(parentId);
            loadComments(currentProductId);
        } else {
            alert('回复失败: ' + (result.message || '未知错误'));
        }
    } catch (error) {
        console.error('回复错误:', error);
        alert('回复失败: ' + error.message);
    }
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    
    return date.toLocaleDateString('zh-CN');
}