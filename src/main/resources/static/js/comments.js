let currentProductId = null;

async function loadComments(productId) {
    currentProductId = productId;

    try {
        const response = await fetch(`/api/comments/product/${productId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
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

    const hasReplies = comment.replies && comment.replies.length > 0;
    const replyCount = hasReplies ? countAllReplies(comment.replies) : 0;

    const repliesHtml = hasReplies ?
        `<div class="replies-container" id="replies-${comment.id}" style="display: none;" data-count="${replyCount}">
            ${comment.replies.map(reply => renderComment(reply, username, level + 1)).join('')}
        </div>` : '';

    const likeIcon = comment.isLiked ? '❤️' : '🤍';

    let imagesHtml = '';
    if (comment.images && typeof comment.images === 'string' && comment.images.trim() !== '') {
        const imageUrls = [];
        let remaining = comment.images;

        while (remaining.length > 0) {
            const dataIndex = remaining.indexOf('data:image/');
            if (dataIndex === -1) break;

            const nextDataIndex = remaining.indexOf('data:image/', dataIndex + 1);

            let imageUrl;
            if (nextDataIndex === -1) {
                imageUrl = remaining.substring(dataIndex).trim();
                remaining = '';
            } else {
                let commaPos = nextDataIndex - 1;
                while (commaPos > dataIndex && remaining[commaPos] !== ',') {
                    commaPos--;
                }
                imageUrl = remaining.substring(dataIndex, commaPos).trim();
                remaining = remaining.substring(commaPos + 1);
            }

            if (imageUrl.startsWith('data:image/')) {
                const parts = imageUrl.split(',');
                if (parts.length === 2 && parts[1].length > 100) {
                    imageUrls.push(imageUrl);
                }
            }
        }

        if (imageUrls.length > 0) {
            imagesHtml = `<div style="display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
                ${imageUrls.map(img => 
                    `<img src="${img}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid #e0e0e0;" onclick="window.open('${img}', '_blank')" onerror="this.style.display='none'">`
                ).join('')}
            </div>`;
        }
    }

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
            ${imagesHtml}
            <div class="comment-actions">
                ${hasReplies && level === 0 ? `<a href="javascript:void(0)" onclick="toggleReplies(${comment.id})" id="toggle-${comment.id}">展开${replyCount}条回复 ▼</a>` : ''}
                <a href="javascript:void(0)" onclick="toggleLike(${comment.id})" id="like-${comment.id}">${likeIcon} <span id="like-count-${comment.id}">${comment.likeCount || 0}</span></a>
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

function countAllReplies(replies) {
    let count = replies.length;
    replies.forEach(reply => {
        if (reply.replies && reply.replies.length > 0) {
            count += countAllReplies(reply.replies);
        }
    });
    return count;
}

function toggleReplies(commentId) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    const toggleBtn = document.getElementById(`toggle-${commentId}`);
    const replyCount = parseInt(repliesContainer.dataset.count);

    if (repliesContainer.style.display === 'none') {
        repliesContainer.style.display = 'block';
        repliesContainer.querySelectorAll('.replies-container').forEach(subContainer => {
            subContainer.style.display = 'block';
        });
        toggleBtn.innerHTML = `收起回复 ▲`;
    } else {
        repliesContainer.style.display = 'none';
        toggleBtn.innerHTML = `展开${replyCount}条回复 ▼`;
    }
}

async function toggleLike(commentId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('请先登录');
        return;
    }

    const expandedComments = [];
    document.querySelectorAll('.replies-container[style*="display: block"]').forEach(container => {
        const id = container.id.replace('replies-', '');
        expandedComments.push(id);
    });

    try {
        const response = await fetch(`/api/comments/${commentId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            await loadComments(currentProductId);

            expandedComments.forEach(id => {
                const container = document.getElementById(`replies-${id}`);
                const toggleBtn = document.getElementById(`toggle-${id}`);
                if (container && toggleBtn) {
                    container.style.display = 'block';
                    container.querySelectorAll('.replies-container').forEach(subContainer => {
                        subContainer.style.display = 'block';
                    });
                    toggleBtn.innerHTML = `收起回复 ▲`;
                }
            });
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('点赞错误:', error);
    }
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