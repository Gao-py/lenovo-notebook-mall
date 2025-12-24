let currentProductId = null;

async function loadComments(productId) {
    currentProductId = productId;

    try {
        const response = await fetch(`/api/comments/product/${productId}`);
        const result = await response.json();

        if (result.success) {
            displayComments(result.data);
        }
    } catch (error) {
        console.error('加载评论错误:', error);
    }
}

function displayComments(comments) {
    const commentsList = document.getElementById('commentsList');

    if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无评价</p>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => renderComment(comment, null, 0)).join('');
}

function renderComment(comment, parentUsername, level) {
    const username = comment.username || '匿名用户';
    const firstChar = username.charAt(0);
    const avatar = comment.avatar || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23ddd'/%3E%3Ctext x='20' y='26' text-anchor='middle' font-size='18' fill='%23666'%3E${firstChar}%3C/text%3E%3C/svg%3E`;

    const stars = comment.rating ? '★'.repeat(comment.rating) + '☆'.repeat(5 - comment.rating) : '';

    const replyPrefix = level > 1 && parentUsername ? `<span style="color: #e60012; font-weight: 600;">@${parentUsername}</span> ` : '';
    const marginLeft = level >= 1 ? 40 : 0;

    const repliesHtml = comment.replies && comment.replies.length > 0 ?
        comment.replies.map(reply => renderComment(reply, username, level + 1)).join('') : '';

    return `
        <div class="comment-item" style="margin-left: ${marginLeft}px; ${level >= 1 ? 'background: #f8f9fa; border-left: 3px solid #e60012;' : ''}">
            <div class="comment-header">
                <span class="comment-user">
                    <img src="${avatar}" alt="头像" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 8px;">
                    ${username}
                    ${stars ? `<span style="color: #ffd700; margin-left: 10px;">${stars}</span>` : ''}
                </span>
                <span class="comment-time">${formatTime(comment.createTime)}</span>
            </div>
            <div class="comment-content">${replyPrefix}${comment.content}</div>
            <div class="comment-actions">
                <a href="javascript:void(0)" onclick="showReplyBox(${comment.id}, '${username}')">回复</a>
            </div>
            <div class="reply-box" id="replyBox${comment.id}" style="display: none;">
                <textarea id="replyContent${comment.id}" placeholder="回复 @${username}..." rows="2"></textarea>
                <button onclick="submitReply(${comment.id})">发表回复</button>
                <button onclick="cancelReply(${comment.id})">取消</button>
            </div>
        </div>
        ${repliesHtml}
    `;
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

function showReplyBox(commentId, username) {
    document.querySelectorAll('.reply-box').forEach(box => box.style.display = 'none');
    const replyBox = document.getElementById(`replyBox${commentId}`);
    replyBox.style.display = 'block';
    document.getElementById(`replyContent${commentId}`).placeholder = `回复 @${username}...`;
}

function cancelReply(commentId) {
    document.getElementById(`replyBox${commentId}`).style.display = 'none';
    document.getElementById(`replyContent${commentId}`).value = '';
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