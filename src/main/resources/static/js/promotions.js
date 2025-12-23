async function loadPromotions() {
    const res = await fetch('/api/promotions');
    const data = await res.json();
    
    if (data.success) {
        displayPromotions(data.data);
    }
}

function displayPromotions(promotions) {
    const list = document.getElementById('promotionsList');
    
    if (!promotions || promotions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无促销活动</p>';
        return;
    }
    
    const typeMap = {
        'FULL_REDUCTION': '满减',
        'DISCOUNT': '单品折扣',
        'CATEGORY_DISCOUNT': '分类折扣'
    };
    
    list.innerHTML = promotions.map(p => {
        let description = '';
        if (p.type === 'FULL_REDUCTION') {
            description = `满 ¥${p.minAmount} 减 ¥${p.discountAmount}`;
        } else if (p.type === 'DISCOUNT') {
            description = `${p.product?.name || '商品'} ${p.discountPercent}折`;
        } else if (p.type === 'CATEGORY_DISCOUNT') {
            description = `${p.category} 系列 ${p.discountPercent}折`;
        }
        
        return `
            <div style="background: white; padding: 25px; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h3 style="color: #e60012; font-size: 22px; margin-bottom: 10px;">${p.name}</h3>
                        <div style="color: #666; font-size: 16px; margin-bottom: 8px;">类型: ${typeMap[p.type]}</div>
                        <div style="color: #333; font-size: 18px; font-weight: 500; margin-bottom: 12px;">${description}</div>
                        <div style="color: #999; font-size: 14px;">
                            活动时间: ${new Date(p.startTime).toLocaleString('zh-CN')} 至 ${new Date(p.endTime).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    ${p.product ? `<button class="btn-primary" onclick="location.href='product.html?id=${p.product.id}'">查看商品</button>` : 
                      p.category ? `<button class="btn-primary" onclick="location.href='index.html?category=${p.category}'">查看分类</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

loadPromotions();