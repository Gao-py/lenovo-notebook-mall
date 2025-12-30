// ... 前面代码保持不变 ...

function addMessage(text, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${role}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    // 支持HTML渲染
    if (role === 'assistant') {
        bubble.innerHTML = text;
    } else {
        bubble.textContent = text;
    }
    
    messageDiv.appendChild(bubble);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ... 后面代码保持不变 ...