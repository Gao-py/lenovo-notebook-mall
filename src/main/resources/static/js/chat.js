let currentUserId;
let selectedCustomerId = null;
let isAdmin = false;
let lastMessageCount = 0;

async function loadChatHistory() {
    if (!selectedCustomerId) return;

    try {
        const response = await fetch(`/api/chat/history?otherId=${selectedCustomerId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        
        if (result.success) {
            const messagesDiv = document.getElementById('chatMessages');

            // 只在消息数量变化时才更新
            if (result.data.length !== lastMessageCount) {
                const shouldScrollToBottom = lastMessageCount === 0 ||
                    (messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 100);

                lastMessageCount = result.data.length;

                if (result.data.length === 0) {
                    messagesDiv.innerHTML = `
                        <div class="empty-chat">
                            <div class="empty-chat-icon">👋</div>
                            <div class="empty-chat-text">开始对话吧！</div>
                        </div>
                    `;
                } else {
                    messagesDiv.innerHTML = result.data.map(msg => {
                        const isSent = msg.senderId === currentUserId;
                        const time = new Date(msg.createTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
                        return `
                            <div class="message ${isSent ? 'sent' : 'received'}">
                                <div class="message-wrapper">
                                    <div class="message-avatar">${isSent ? '我' : '客服'}</div>
                                    <div>
                                        <div class="message-content">${msg.content}</div>
                                        <div class="message-time">${time}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }

                if (shouldScrollToBottom) {
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            }
            
            await fetch('/api/chat/read', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
        }
    } catch (error) {
        console.error('加载聊天记录失败:', error);
    }
}

async function sendMessage() {
    if (!selectedCustomerId) return;

    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                receiverId: selectedCustomerId,
                content: content
            })
        });
        
        if (response.ok) {
            input.value = '';
            input.style.height = 'auto';
            lastMessageCount = 0;
            await loadChatHistory();
            document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
        }
    } catch (error) {
        console.error('发送消息失败:', error);
    }
}

async function init() {
    const profile = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(r => r.json());
    
    currentUserId = profile.data.id;
    isAdmin = profile.data.role === 'ADMIN';
    
    if (isAdmin) {
        await loadCustomerList();
    } else {
        selectedCustomerId = profile.data.assignedAdminId;
        loadChatHistory();
        setInterval(loadChatHistory, 3000);
    }
}

async function loadCustomerList() {
    const response = await fetch('/api/chat/customers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const result = await response.json();

    if (result.success) {
        const container = document.querySelector('.chat-container');
        container.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-icon">👥</div>
                <div class="chat-header-info">
                    <h3>客户消息</h3>
                    <p>管理客户对话</p>
                </div>
            </div>
            <div style="display: flex; height: calc(100% - 96px);">
                <div style="width: 280px; border-right: 1px solid #e8e8e8; overflow-y: auto; background: #fafafa;" id="customerList"></div>
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div class="chat-messages" id="chatMessages">
                        <div class="empty-chat">
                            <div class="empty-chat-icon">💬</div>
                            <div class="empty-chat-text">选择客户开始对话</div>
                        </div>
                    </div>
                    <div class="chat-input">
                        <textarea id="messageInput" placeholder="选择客户后输入消息..." rows="1" disabled></textarea>
                        <button onclick="sendMessage()" disabled id="sendBtn">发送</button>
                    </div>
                </div>
            </div>
        `;

        const customerList = document.getElementById('customerList');
        customerList.innerHTML = result.data.map(c => `
            <div class="customer-item" onclick="selectCustomer(${c.id})" data-customer-id="${c.id}">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px;">
                        ${c.username.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${c.username}</div>
                        <div style="font-size: 12px; color: #999;">${c.email}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

window.selectCustomer = function(customerId) {
    selectedCustomerId = customerId;
    lastMessageCount = 0;
    document.querySelectorAll('.customer-item').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`[data-customer-id="${customerId}"]`).classList.add('active');

    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;

    loadChatHistory();
    if (window.chatInterval) clearInterval(window.chatInterval);
    window.chatInterval = setInterval(loadChatHistory, 3000);
};

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('messageInput');
    if (input) {
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

init();