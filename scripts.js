// 全局数据存储
const AppState = {
    allSites: [],
    filteredSites: [],
    currentCategory: 'all',
    currentSort: 'created',
    currentSearchTerm: '',
    isEditMode: false, // 添加编辑模式状态
    tempEditingSite: null // 临时存储正在编辑的网站数据
};

// 分类层次结构数据 - 与菜单栏分类保持一致
const categoryHierarchy = [
    {
        name: '图像',
        children: [
            { name: '各国' },
            { name: '中国' },
            { name: '英国' },
            { name: '美国' },
            {
                name: '欧洲',
                children: [
                    { name: '意大利' },
                    { name: '法国' },
                    { name: '荷兰' },
                    { name: '匈牙利' }
                ]
            },
            { name: '日本' },
            { name: '商业组织' }
        ]
    },
    {
        name: '文本',
        children: [
            { name: '在线文本', children: [{ name: '百科' }, { name: '历史' }, { name: '艺术' }, { name: '宗教' }] },
            { name: '中国古籍' },
            { name: '外国古籍' },
            { name: '专题古籍' },
            {
                name: '期刊杂志',
                children: [
                    { name: '平台' },
                    { name: '社' }
                ]
            },
            { name: '研究机构' },
            {
                name: '图书',
                children: [
                    { name: '图书馆' },
                    { name: '图书信息' },
                    { name: '图书资源' },
                    { name: '图书出版社' }
                ]
            }
        ]
    },
    {
        name: '工具',
        children: [
            {
                name: '字典翻译',
                children: [
                    { name: '中文' },
                    { name: '日韩朝' },
                    { name: '西文' },
                    { name: '翻译' },
                    { name: '书法与篆刻' }
                ]
            },
            { name: '教育' },
            { name: 'AI' },
            { name: '办公文档' },
            { name: '图片' },
            {
                name: '知识管理',
                children: [
                    { name: '笔记' },
                    { name: '绘图分析' },
                    { name: '文献管理' },
                    { name: '论文相关' }
                ]
            },
            { name: '视频', children: [{ name: '视频工具' }, { name: '视频资源' }, { name: '视频媒体' }] },
            { name: '音声',
                children: [
                    { name: '音声工具' },
                    { name: '音声资源' }
                ]
            },
            { name: '游戏' },
            { name: '设计' },
            {
                name: 'IT工具',
                children: [
                    { name: '编程' },
                    { name: '应用工具' },
                    { name: '数据工具' }
                ]
            }
        ]
    },
    {
        name: '资讯',
        children: [
            { name: '艺术资讯' },
            { name: '文化资讯' },
            { name: '教育资讯' },
            { name: '副业资讯' }
        ]
    },
    {
        name: '地图',
        children: [
            { name: '自制地图' },
            { name: '历史地图' },
            { name: '实时地图' },
            { name: '气象地图' },
            { name: '地图软件' }
        ]
    },
    {
        name: '创作',
        children: [
            { name: '壁纸' }
        ]
    }
];

// 当前选择的分类路径
let currentSelectedCategoryPath = [];
let currentSelectedCategory = null;
let currentCategoryInput = null;

// DOM 元素缓存
const DOM = {
    sitesGrid: document.getElementById('sites-grid'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
    sortSelect: document.getElementById('sort-select'),
    siteCount: document.getElementById('site-count'),
    mainSearchInput: document.getElementById('main-search'),
    toastElement: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// 移除不必要的引用，直接使用AppState管理状态

// 网站计数功能已移除

// 初始化应用
function initApp() {
    // 加载数据
    loadData();
    
    // 初始化分类菜单
    initCategories();
    
    // 绑定事件监听器
    bindEventListeners();
}

// 加载数据
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        // 处理数据，合并category和categoryPath字段为categoryPath
        const processedSites = (data.sites || []).map(site => {
            // 如果存在categoryPath字段，使用它；如果不存在但存在category字段，使用category字段
            // 如果两个字段都存在，优先使用categoryPath（为了兼容旧数据）
            return {
                ...site,
                // 确保只有categoryPath字段
                categoryPath: site.categoryPath || site.category,
                category: undefined // 删除重复的category字段以减少内存使用
            };
        });
        
        AppState.allSites = processedSites;
        
        // 应用默认筛选和排序（按时间从新到旧）
        applyFiltersAndSort();
        
        // 渲染网站列表
        renderSites(AppState.filteredSites);
        
        // 更新网站数量显示
        if (DOM.siteCount) {
            DOM.siteCount.textContent = `已收录${AppState.filteredSites.length}个`;
        }
        
        // 显示加载成功提示
        showToast('数据加载成功');
    } catch (error) {
        console.error('加载数据失败:', error);
        showToast('数据加载失败', 'error');
    }
}

// 渲染网站列表
function renderSites(sites) {
    // 检查是否有sitesGrid元素
    if (!DOM.sitesGrid) return;
    
    // 清空当前列表
    DOM.sitesGrid.innerHTML = '';
    
    // 特殊处理'关于'分类
    if (AppState.currentCategory === '关于') {
        // 创建关于内容区域
        const aboutContent = document.createElement('div');
        aboutContent.className = 'empty-state';
        aboutContent.innerHTML = `
            <br>数据收集于网络，网站内容仅代表发布者个人行为，与本站立场无关<br>
            <br>如收集内容侵犯了您的权利，请联系我们，一经确认我们立即删除<br>
            <br>微信：Mnemosyne-CAA 公众号：兆堂艺术人文</p>
            <p>欢迎您分享内容或参与制作<br>
        `;
        DOM.sitesGrid.appendChild(aboutContent);
        return;
    }
    
    // 检查是否有网站数据
    if (!sites || sites.length === 0) {
        // 创建空状态提示
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p>暂无匹配的网站</p>
        `;
        DOM.sitesGrid.appendChild(emptyState);
        return;
    }
    
    // 使用虚拟DOM技术减少重排
    const fragment = document.createDocumentFragment();
    
    // 批量创建网站卡片
    const cards = sites.map(site => createSiteCard(site));
    cards.forEach(card => fragment.appendChild(card));
    
    // 一次性将所有卡片添加到DOM中（减少重绘和重排）
    DOM.sitesGrid.appendChild(fragment);
    
    // 如果当前处于编辑模式，确保所有卡片的操作按钮都显示
    if (AppState.isEditMode) {
        const cardActions = document.querySelectorAll('.card-actions');
        cardActions.forEach(actions => {
            actions.style.display = 'flex';
        });
    }
}

// 批量DOM操作优化 - 使用requestAnimationFrame确保平滑渲染
const batchRender = debounce((fn, ...args) => {
    requestAnimationFrame(() => {
        fn(...args);
    });
}, 50);

// 创建网站卡片
function createSiteCard(site) {
    // 安全转义HTML内容，防止XSS攻击
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    // 创建卡片容器
    const card = document.createElement('div');
    card.className = 'site-card';
    // 添加数据属性用于标识卡片和网站ID
    card.dataset.siteId = site.id || site.title;
    
    // 根据级别设置标题样式类
    let titleClass = '';
    if (site.level === 1) {
        titleClass = 'level-1';
    } else if (site.level === 3) {
        titleClass = 'level-3';
    }
    
    // 构建卡片HTML - 使用安全的HTML转义
    card.innerHTML = `
        <div class="site-card-header">
            <h3 class="site-title ${titleClass}"><a href="${escapeHtml(site.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(site.title)}</a></h3>
            <div class="card-actions" style="display: none;">
                <button class="edit-btn" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <p class="site-description">${escapeHtml(site.description || '')}</p>
    `;
    
    // 绑定编辑按钮事件
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            editSite(site);
        });
    }
    
    // 绑定删除按钮事件
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            deleteSite(site);
        });
    }
    
    // 为卡片添加点击事件，打开详情弹窗
    card.addEventListener('click', (e) => {
        // 如果点击的是编辑按钮、删除按钮或链接，不触发详情弹窗
        if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn') || e.target.closest('a')) {
            return;
        }
        e.preventDefault();
        showSiteDetailModal(site);
    });
    
    // 阻止链接点击事件冒泡
    const siteLink = card.querySelector('.site-title a');
    if (siteLink) {
        siteLink.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    return card;
}

// 显示网站详情弹窗
function showSiteDetailModal(site) {
    // 检查是否已存在弹窗，如果存在则移除
    const existingModal = document.getElementById('site-detail-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建模态框背景
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'site-detail-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    
    // 创建模态框容器
    const modalContainer = document.createElement('div');
    modalContainer.id = 'site-detail-modal';
    modalContainer.className = 'modal-container';
    modalContainer.style.maxWidth = '600px';
    
    // 创建标题
    const title = document.createElement('h2');
    title.textContent = '网站详情';
    title.className = 'modal-title';
    
    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.marginBottom = '20px';
    
    // 安全转义HTML内容
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    // 构建详情内容
    content.innerHTML = `
        <div class="detail-item">
            <label>网站名称：</label>
            <h3>${escapeHtml(site.title)}</h3>
        </div>
        <div class="detail-item">
            <label>网址：</label>
            <a href="${escapeHtml(site.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(site.url)}</a>
        </div>
        <div class="detail-item">
            <label>描述：</label>
            <p>${escapeHtml(site.description || '无描述')}</p>
        </div>
        <div class="detail-item">
            <label>分类：</label>
            <p>${escapeHtml(getFullCategoryPath(site.category) || '未分类')}</p>
        </div>
        <div class="detail-item">
            <label>重要程度：</label>
            <p>${getLevelText(site.level)}</p>
        </div>
        ${site.created ? `<div class="detail-item"><label>添加时间：</label><p>${formatDate(site.created)}</p></div>` : ''}
    `;
    
    // 获取重要程度文本
    function getLevelText(level) {
        switch(level) {
            case 1: return '一般';
            case 2: return '重要';
            case 3: return '非常重要';
            default: return '未设置';
        }
    }
    
    // 获取完整分类路径
    function getFullCategoryPath(categoryName) {
        if (!categoryName) return null;
        
        // 递归查找分类路径
        function findCategoryPath(hierarchy, targetName, path = []) {
            for (const category of hierarchy) {
                const currentPath = [...path, category.name];
                
                if (category.name === targetName) {
                    return currentPath.join(' / ');
                }
                
                if (category.children) {
                    const found = findCategoryPath(category.children, targetName, currentPath);
                    if (found) return found;
                }
            }
            return null;
        }
        
        return findCategoryPath(categoryHierarchy, categoryName) || categoryName;
    }
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-actions';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.className = 'btn btn-secondary';
    closeBtn.addEventListener('click', closeModal);
    
    // 创建访问按钮
    const visitBtn = document.createElement('button');
    visitBtn.textContent = '访问网站';
    visitBtn.className = 'btn btn-primary';
    visitBtn.addEventListener('click', () => {
        window.open(site.url, '_blank', 'noopener,noreferrer');
    });
    
    // 组装按钮容器
    buttonContainer.appendChild(visitBtn);
    buttonContainer.appendChild(closeBtn);
    
    // 组装模态框
    modalContainer.appendChild(title);
    modalContainer.appendChild(content);
    modalContainer.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContainer);
    
    // 添加到文档
    document.body.appendChild(modalOverlay);
    
    // 关闭模态框函数
    function closeModal() {
        modalOverlay.remove();
    }
    
    // 阻止事件冒泡
    modalContainer.addEventListener('click', (e) => e.stopPropagation());
    
    // 点击模态框外部关闭
    modalOverlay.addEventListener('click', closeModal);
    
    // 按Escape键关闭
    document.addEventListener('keydown', function handleEsc(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    });
}



// 初始化分类菜单
function initCategories() {
    const categoryList = document.getElementById('categories-list');
    
    // 文本分类嵌入式菜单
    const textCategoryItem = document.createElement('li');
    textCategoryItem.className = 'category-item';
    
    // 主分类
    const textCategoryHeader = document.createElement('a');
    textCategoryHeader.href = '#';
    textCategoryHeader.className = 'category-link category-header has-submenu';
    textCategoryHeader.dataset.category = 'text';
    textCategoryHeader.textContent = '文本';
    const textArrow = document.createElement('span');
    textArrow.className = 'submenu-arrow';
    textArrow.textContent = '›';
    textCategoryHeader.appendChild(textArrow);
    textCategoryItem.appendChild(textCategoryHeader);
    
    // 子分类容器
    const textSubCategories = document.createElement('ul');
    textSubCategories.className = 'category-submenu';
    
    // 在线文本子菜单 - 简化为两层结构
    const encyclopediaLi = document.createElement('li');
    const encyclopediaHeader = document.createElement('a');
    encyclopediaHeader.href = '#';
    encyclopediaHeader.className = 'category-link category-header has-submenu';
    encyclopediaHeader.dataset.category = '在线文本';
    encyclopediaHeader.textContent = '在线文本';
    const encyclopediaArrow = document.createElement('span');
    encyclopediaArrow.className = 'submenu-arrow';
    encyclopediaArrow.textContent = '›';
    encyclopediaHeader.appendChild(encyclopediaArrow);
    encyclopediaLi.appendChild(encyclopediaHeader);
    
    // 在线文本的子菜单
    const encyclopediaSubmenu = document.createElement('ul');
    encyclopediaSubmenu.className = 'category-submenu';
    
    const encyclopediaSubItems = ['百科', '历史', '艺术', '宗教'];
    encyclopediaSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        encyclopediaSubmenu.appendChild(subLi);
    });
    
    encyclopediaLi.appendChild(encyclopediaSubmenu);
    textSubCategories.appendChild(encyclopediaLi);
    
    // 其他文本子分类 - 处理不带子菜单的分类
    const textSubItems = ['中国古籍', '外国古籍', '专题古籍', '研究机构', '网文'];
    textSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        textSubCategories.appendChild(subLi);
    });
    
    // 期刊杂志分类 - 带子菜单
    const journalLi = document.createElement('li');
    journalLi.className = 'has-submenu';
    const journalHeader = document.createElement('a');
    journalHeader.href = '#';
    journalHeader.className = 'category-link category-header has-submenu';
    journalHeader.dataset.category = '期刊杂志';
    journalHeader.textContent = '期刊杂志';
    const journalArrow = document.createElement('span');
    journalArrow.className = 'submenu-arrow';
    journalArrow.textContent = '›';
    journalHeader.appendChild(journalArrow);
    journalLi.appendChild(journalHeader);
    
    // 期刊杂志的子菜单
    const journalSubmenu = document.createElement('ul');
    journalSubmenu.className = 'category-submenu';
    
    const journalSubItems = ['平台', '社'];
    journalSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = `${subItem}`;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        journalSubmenu.appendChild(subLi);
    });
    
    journalLi.appendChild(journalSubmenu);
    textSubCategories.appendChild(journalLi);
    
    // 图书分类 - 带子菜单
    const bookLi = document.createElement('li');
    bookLi.className = 'has-submenu';
    const bookHeader = document.createElement('a');
    bookHeader.href = '#';
    bookHeader.className = 'category-link category-header has-submenu';
    bookHeader.dataset.category = '图书';
    bookHeader.textContent = '图书';
    const bookArrow = document.createElement('span');
    bookArrow.className = 'submenu-arrow';
    bookArrow.textContent = '›';
    bookHeader.appendChild(bookArrow);
    bookLi.appendChild(bookHeader);
    
    // 图书的子菜单
    const bookSubmenu = document.createElement('ul');
    bookSubmenu.className = 'category-submenu';
    
    const bookSubItems = ['图书馆', '图书信息', '图书资源', '图书出版社'];
    bookSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = `${subItem}`;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        bookSubmenu.appendChild(subLi);
    });
    
    bookLi.appendChild(bookSubmenu);
    textSubCategories.appendChild(bookLi);
    
    textCategoryItem.appendChild(textSubCategories);
    categoryList.appendChild(textCategoryItem);
    
    // 图像分类嵌入式菜单
    const imageCategoryItem = document.createElement('li');
    imageCategoryItem.className = 'category-item';
    
    // 主分类
    const imageCategoryHeader = document.createElement('a');
    imageCategoryHeader.href = '#';
    imageCategoryHeader.className = 'category-link category-header has-submenu';
    imageCategoryHeader.dataset.category = 'image';
    imageCategoryHeader.textContent = '图像';
    const imageArrow = document.createElement('span');
    imageArrow.className = 'submenu-arrow';
    imageArrow.textContent = '›';
    imageCategoryHeader.appendChild(imageArrow);
    imageCategoryItem.appendChild(imageCategoryHeader);
    
    // 子分类容器
    const imageSubCategories = document.createElement('ul');
    imageSubCategories.className = 'category-submenu';
    
    // 图像子分类 - 处理不带子菜单的分类
    const imageSubItems = ['各国', '中国', '英国', '美国', '日本'];
    imageSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        imageSubCategories.appendChild(subLi);
    });
    
    // 欧洲分类 - 带子菜单
    const europeLi = document.createElement('li');
    europeLi.className = 'has-submenu'; // 添加标识类
    const europeHeader = document.createElement('a');
    europeHeader.href = '#';
    europeHeader.className = 'category-link category-header has-submenu';
    europeHeader.dataset.category = '欧洲';
    europeHeader.textContent = '欧洲';
    const europeArrow = document.createElement('span');
    europeArrow.className = 'submenu-arrow';
    europeArrow.textContent = '›';
    europeHeader.appendChild(europeArrow);
    europeLi.appendChild(europeHeader);
    
    // 欧洲的子菜单
    const europeSubmenu = document.createElement('ul');
    europeSubmenu.className = 'category-submenu';
    
    const europeSubItems = ['意大利', '法国', '荷兰', '匈牙利'];
    europeSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = `${subItem}`;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        europeSubmenu.appendChild(subLi);
    });
    
    europeLi.appendChild(europeSubmenu);
    imageSubCategories.appendChild(europeLi);
    
    imageCategoryItem.appendChild(imageSubCategories);
    categoryList.appendChild(imageCategoryItem);
    
    // 工具主分类
    const toolCategoryItem = document.createElement('li');
    toolCategoryItem.className = 'category-item has-submenu tool-category-item'; // 添加标识类
    
    const toolHeader = document.createElement('a');
    toolHeader.href = '#';
    toolHeader.className = 'category-link category-header has-submenu';
    toolHeader.dataset.category = '工具';
    toolHeader.textContent = '工具';
    const toolArrow = document.createElement('span');
    toolArrow.className = 'submenu-arrow';
    toolArrow.textContent = '›';
    toolHeader.appendChild(toolArrow);
    toolCategoryItem.appendChild(toolHeader);
    
    const toolSubCategories = document.createElement('ul');
    toolSubCategories.className = 'category-submenu tool-sub-categories';
    
    // 调整工具子菜单顺序：字典翻译、课程、办公文档、知识管理、图片、音声、视频、游戏、设计、AI、IT工具
    
    // 字典翻译分类 - 带子菜单
    const dictTransLi = document.createElement('li');
    dictTransLi.className = 'has-submenu'; // 添加标识类
    const dictTransHeader = document.createElement('a');
    dictTransHeader.href = '#';
    dictTransHeader.className = 'category-link category-header has-submenu';
    dictTransHeader.dataset.category = '字典翻译';
    dictTransHeader.textContent = '字典翻译';
    const dictTransArrow = document.createElement('span');
    dictTransArrow.className = 'submenu-arrow';
    dictTransArrow.textContent = '›';
    dictTransHeader.appendChild(dictTransArrow);
    dictTransLi.appendChild(dictTransHeader);
    
    const dictTransSubmenu = document.createElement('ul');
    dictTransSubmenu.className = 'category-submenu';
    
    const dictTransSubItems = ['中文', '日韩朝', '西文', '翻译', '书法与篆刻'];
    dictTransSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        dictTransSubmenu.appendChild(subLi);
    });
    
    dictTransLi.appendChild(dictTransSubmenu);
    toolSubCategories.appendChild(dictTransLi);
    
    // 课程分类
    const courseInToolLi = document.createElement('li');
    courseInToolLi.className = 'has-submenu'; // 添加标识类
    const courseInToolHeader = document.createElement('a');
    courseInToolHeader.href = '#';
    courseInToolHeader.className = 'category-link category-header has-submenu';
    courseInToolHeader.dataset.category = '课程';
    courseInToolHeader.textContent = '课程';
    const courseArrow = document.createElement('span');
    courseArrow.className = 'submenu-arrow';
    courseArrow.textContent = '›';
    courseInToolHeader.appendChild(courseArrow);
    courseInToolLi.appendChild(courseInToolHeader);
    
    const courseInToolSubCategories = document.createElement('ul');
    courseInToolSubCategories.className = 'category-submenu';
    
    const courseSubItemsInTool = ['综合课程', '语言课程', '写作课程', '艺术课程'];
    courseSubItemsInTool.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        courseInToolSubCategories.appendChild(subLi);
    });
    
    courseInToolLi.appendChild(courseInToolSubCategories);
    toolSubCategories.appendChild(courseInToolLi);
    
    // 办公文档菜单（无子菜单）
    const officeDocsLi = document.createElement('li');
    const officeDocsHeader = document.createElement('a');
    officeDocsHeader.href = '#';
    officeDocsHeader.className = 'category-link category-header';
    officeDocsHeader.dataset.category = '办公文档';
    officeDocsHeader.textContent = '办公文档';
    officeDocsLi.appendChild(officeDocsHeader);
    toolSubCategories.appendChild(officeDocsLi);
    
    // 知识管理分类
    const knowledgeInToolLi = document.createElement('li');
    knowledgeInToolLi.className = 'has-submenu'; // 添加标识类
    const knowledgeInToolHeader = document.createElement('a');
    knowledgeInToolHeader.href = '#';
    knowledgeInToolHeader.className = 'category-link category-header has-submenu';
    knowledgeInToolHeader.dataset.category = '知识管理';
    knowledgeInToolHeader.textContent = '知识管理';
    const knowledgeArrow = document.createElement('span');
    knowledgeArrow.className = 'submenu-arrow';
    knowledgeArrow.textContent = '›';
    knowledgeInToolHeader.appendChild(knowledgeArrow);
    knowledgeInToolLi.appendChild(knowledgeInToolHeader);
    
    const knowledgeInToolSubCategories = document.createElement('ul');
    knowledgeInToolSubCategories.className = 'category-submenu';
    
    const knowledgeSubItemsInTool = ['笔记', '绘图分析', '文献管理', '论文相关'];
    knowledgeSubItemsInTool.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        knowledgeInToolSubCategories.appendChild(subLi);
    });
    
    knowledgeInToolLi.appendChild(knowledgeInToolSubCategories);
    toolSubCategories.appendChild(knowledgeInToolLi);
    
    // 图片菜单（无子菜单）
    const imageLi = document.createElement('li');
    const imageHeader = document.createElement('a');
    imageHeader.href = '#';
    imageHeader.className = 'category-link category-header';
    imageHeader.dataset.category = '图片';
    imageHeader.textContent = '图片';
    imageLi.appendChild(imageHeader);
    toolSubCategories.appendChild(imageLi);
    
    // 音声分类
    const audioInToolLi = document.createElement('li');
    audioInToolLi.className = 'has-submenu'; // 添加标识类
    const audioInToolHeader = document.createElement('a');
    audioInToolHeader.href = '#';
    audioInToolHeader.className = 'category-link category-header has-submenu';
    audioInToolHeader.dataset.category = '音声';
    audioInToolHeader.textContent = '音声';
    const audioArrow = document.createElement('span');
    audioArrow.className = 'submenu-arrow';
    audioArrow.textContent = '›';
    audioInToolHeader.appendChild(audioArrow);
    audioInToolLi.appendChild(audioInToolHeader);
    
    const audioInToolSubCategories = document.createElement('ul');
    audioInToolSubCategories.className = 'category-submenu';
    
    // 修改音声子菜单：使用与categoryHierarchy一致的分类名称
    const audioSubItemsInTool = ['音声工具', '音声资源'];
    audioSubItemsInTool.forEach((subItem) => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        // 使用与categoryHierarchy一致的分类名称
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        audioInToolSubCategories.appendChild(subLi);
    });
    
    audioInToolLi.appendChild(audioInToolSubCategories);
    toolSubCategories.appendChild(audioInToolLi);
    
    // 视频分类
    const videoInToolLi = document.createElement('li');
    videoInToolLi.className = 'has-submenu'; // 添加标识类
    const videoInToolHeader = document.createElement('a');
    videoInToolHeader.href = '#';
    videoInToolHeader.className = 'category-link category-header has-submenu';
    videoInToolHeader.dataset.category = '视频';
    videoInToolHeader.textContent = '视频';
    const videoArrow = document.createElement('span');
    videoArrow.className = 'submenu-arrow';
    videoArrow.textContent = '›';
    videoInToolHeader.appendChild(videoArrow);
    videoInToolLi.appendChild(videoInToolHeader);
    
    const videoInToolSubCategories = document.createElement('ul');
    videoInToolSubCategories.className = 'category-submenu';
    
    // 修改视频子菜单：使用与categoryHierarchy一致的分类名称
    const videoSubItemsInTool = ['视频工具', '视频媒体', '视频资源'];
    videoSubItemsInTool.forEach((subItem) => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        // 使用与categoryHierarchy一致的分类名称
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        videoInToolSubCategories.appendChild(subLi);
    });
    
    videoInToolLi.appendChild(videoInToolSubCategories);
    toolSubCategories.appendChild(videoInToolLi);
    
    // 游戏菜单（无子菜单）
    const gameLi = document.createElement('li');
    const gameHeader = document.createElement('a');
    gameHeader.href = '#';
    gameHeader.className = 'category-link category-header';
    gameHeader.dataset.category = '游戏';
    gameHeader.textContent = '游戏';
    gameLi.appendChild(gameHeader);
    toolSubCategories.appendChild(gameLi);
    
    // 设计菜单（无子菜单）
    const designLi = document.createElement('li');
    const designHeader = document.createElement('a');
    designHeader.href = '#';
    designHeader.className = 'category-link category-header';
    designHeader.dataset.category = '设计';
    designHeader.textContent = '设计';
    designLi.appendChild(designHeader);
    toolSubCategories.appendChild(designLi);
    
    // AI菜单（无子菜单）
    const aiLi = document.createElement('li');
    const aiHeader = document.createElement('a');
    aiHeader.href = '#';
    aiHeader.className = 'category-link category-header';
    aiHeader.dataset.category = 'AI';
    aiHeader.textContent = 'AI';
    aiLi.appendChild(aiHeader);
    toolSubCategories.appendChild(aiLi);
    
    // IT工具分类 - 设置更高的z-index以避免与资讯菜单重叠
    const itToolsInToolLi = document.createElement('li');
    itToolsInToolLi.className = 'has-submenu'; // 添加标识类
    const itToolsInToolHeader = document.createElement('a');
    itToolsInToolHeader.href = '#';
    itToolsInToolHeader.className = 'category-link category-header has-submenu';
    itToolsInToolHeader.dataset.category = 'IT工具';
    itToolsInToolHeader.textContent = 'IT工具';
    const itToolsArrow = document.createElement('span');
    itToolsArrow.className = 'submenu-arrow';
    itToolsArrow.textContent = '›';
    itToolsInToolHeader.appendChild(itToolsArrow);
    itToolsInToolLi.appendChild(itToolsInToolHeader);
    
    const itToolsInToolSubCategories = document.createElement('ul');
    itToolsInToolSubCategories.className = 'category-submenu it-tools-submenu';
    
    const itToolsSubItemsInTool = ['编程', '应用工具', '数据工具'];
    itToolsSubItemsInTool.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        itToolsInToolSubCategories.appendChild(subLi);
    });
    
    itToolsInToolLi.appendChild(itToolsInToolSubCategories);
    toolSubCategories.appendChild(itToolsInToolLi);
    
    // 将所有子分类添加到工具分类
    toolCategoryItem.appendChild(toolSubCategories);
    categoryList.appendChild(toolCategoryItem);
    
    // 课程、知识管理、视频、音声、IT工具已移动到工具菜单下
    
    // 资讯主分类 - 带子菜单
    const newsCategoryItem = document.createElement('li');
    newsCategoryItem.className = 'category-item has-submenu news-category-item'; // 添加标识类
    
    const newsHeader = document.createElement('a');
    newsHeader.href = '#';
    newsHeader.className = 'category-link category-header has-submenu';
    newsHeader.dataset.category = '资讯';
    newsHeader.textContent = '资讯';
    const newsArrow = document.createElement('span');
    newsArrow.className = 'submenu-arrow';
    newsArrow.textContent = '›';
    newsHeader.appendChild(newsArrow);
    newsCategoryItem.appendChild(newsHeader);
    
    const newsSubCategories = document.createElement('ul');
    newsSubCategories.className = 'category-submenu news-sub-categories';
    
    // 资讯子分类
    const newsSubItems = ['艺术资讯', '文化资讯', '教育资讯', '副业资讯'];
    newsSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        newsSubCategories.appendChild(subLi);
    });
    
    newsCategoryItem.appendChild(newsSubCategories);
    categoryList.appendChild(newsCategoryItem);
    
    // 地图主分类 - 带子菜单
    const mapCategoryItem = document.createElement('li');
    mapCategoryItem.className = 'category-item has-submenu'; // 添加标识类
    
    const mapHeader = document.createElement('a');
    mapHeader.href = '#';
    mapHeader.className = 'category-link category-header';
    mapHeader.dataset.category = '地图';
    mapHeader.innerHTML = '地图 <span class="submenu-arrow">›</span>'; // 添加箭头
    mapCategoryItem.appendChild(mapHeader);
    
    const mapSubCategories = document.createElement('ul');
    mapSubCategories.className = 'category-submenu';
    
    // 地图子分类
    const mapSubItems = ['自制地图', '历史地图', '实时地图', '气象地图', '地图软件'];
    mapSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        mapSubCategories.appendChild(subLi);
    });
    
    mapCategoryItem.appendChild(mapSubCategories);
    categoryList.appendChild(mapCategoryItem);
    
    // 创作主分类 - 带子菜单
    const creationCategoryItem = document.createElement('li');
    creationCategoryItem.className = 'category-item has-submenu'; // 添加标识类
    
    const creationHeader = document.createElement('a');
    creationHeader.href = '#';
    creationHeader.className = 'category-link category-header';
    creationHeader.dataset.category = '创作';
    creationHeader.innerHTML = '创作 <span class="submenu-arrow">›</span>'; // 添加箭头
    creationCategoryItem.appendChild(creationHeader);
    
    const creationSubCategories = document.createElement('ul');
    creationSubCategories.className = 'category-submenu';
    
    // 创作子分类
    const creationSubItems = ['壁纸'];
    creationSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        creationSubCategories.appendChild(subLi);
    });
    
    creationCategoryItem.appendChild(creationSubCategories);
    categoryList.appendChild(creationCategoryItem);
    
    // 数据管理主分类 - 带子菜单
    const dataManagementCategoryItem = document.createElement('li');
    dataManagementCategoryItem.className = 'category-item has-submenu'; // 添加标识类
    
    const dataManagementHeader = document.createElement('a');
    dataManagementHeader.href = '#';
    dataManagementHeader.className = 'category-link category-header';
    dataManagementHeader.dataset.category = '数据管理';
    dataManagementHeader.innerHTML = '数据管理 <span class="submenu-arrow">›</span>'; // 添加箭头
    dataManagementCategoryItem.appendChild(dataManagementHeader);
    
    const dataManagementSubCategories = document.createElement('ul');
    dataManagementSubCategories.className = 'category-submenu';
    
    // 数据管理子分类
    const dataManagementSubItems = ['添加', '编辑', '导出', '导入'];
    dataManagementSubItems.forEach(subItem => {
        const subLi = document.createElement('li');
        const subLink = document.createElement('a');
        subLink.href = '#';
        subLink.className = 'category-link category-subitem';
        subLink.dataset.category = subItem;
        subLink.textContent = subItem;
        subLi.appendChild(subLink);
        dataManagementSubCategories.appendChild(subLi);
    });
    
    dataManagementCategoryItem.appendChild(dataManagementSubCategories);
    categoryList.appendChild(dataManagementCategoryItem);
    
    // 其他分类
    const otherCategories = ['关于'];
    
    otherCategories.forEach(category => {
        const categoryItem = document.createElement('li');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <a href="#" class="category-link" data-category="${category}">
                ${category}
            </a>
        `;
        categoryList.appendChild(categoryItem);
    });
    
    // 默认选中文本分类
    currentCategory = 'text';
}

// 绑定事件监听器
function bindEventListeners() {
    // 使用事件委托优化，只绑定一次事件
    const categoriesList = document.querySelector('.categories');
    if (categoriesList) {
        categoriesList.addEventListener('click', handleCategoryClick);
    }
    
    // 侧边栏相关事件
    if (DOM.toggleSidebarBtn) {
        DOM.toggleSidebarBtn.addEventListener('click', () => toggleSidebar(true));
    }
    
    if (DOM.sidebarOverlay) {
        DOM.sidebarOverlay.addEventListener('click', () => toggleSidebar(false));
    }
    
    // 使用防抖优化窗口大小变化事件
    const debouncedResize = debounce(() => {
        handleResize();
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
    
    // 搜索事件 - 使用防抖优化性能
    if (DOM.mainSearchInput) {
        DOM.mainSearchInput.addEventListener('input', handleSearch);
    }
    
    // 排序下拉菜单
    document.getElementById('sort-button').addEventListener('click', toggleSortMenu);
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', handleSortOptionClick);
    });
    
    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', closeSortMenuOnClickOutside);
    
    // 由于没有明确的清除筛选按钮，我们可以在DOM中添加一个按钮后再绑定事件
    // 或者通过其他方式调用clearFilters函数
}

// 刷新数据功能
async function refreshData() {
    try {
        showToast('正在刷新数据...');
        // 重新加载数据
        await loadData();
        showToast('数据刷新成功');
    } catch (error) {
        console.error('刷新数据失败:', error);
        showToast('数据刷新失败', 'error');
    }
}

// 导出数据功能
function exportData() {
    try {
        // 处理站点数据，移除category字段
        const processedSites = AppState.allSites.map(site => {
            const { category, ...rest } = site; // 使用解构赋值移除category字段
            return rest;
        });
        
        // 创建数据对象
        const exportData = {
            sites: processedSites,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        // 转换为JSON字符串
        const dataStr = JSON.stringify(exportData, null, 2);
        
        // 创建Blob对象
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // 创建下载链接
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zt3_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        
        // 触发下载
        link.click();
        
        // 清理
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast('数据导出成功');
    } catch (error) {
        console.error('导出数据失败:', error);
        showToast('数据导出失败', 'error');
    }
}

// 导入数据功能
function importData() {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    // 处理文件选择
    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            showToast('正在导入数据...');
            
            // 读取文件内容
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    // 解析JSON
                    const data = JSON.parse(e.target.result);
                    
                    // 更新应用状态
                    AppState.allSites = data.sites || [];
                    
                    // 重新应用筛选和排序
                    applyFiltersAndSort();
                    
                    showToast('数据导入成功');
                } catch (parseError) {
                    console.error('解析JSON失败:', parseError);
                    showToast('解析JSON文件失败，请检查文件格式', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('导入数据失败:', error);
            showToast('数据导入失败', 'error');
        }
    };
    
    // 触发文件选择对话框
    fileInput.click();
}

// 创建并显示添加数据弹窗
function showAddDataModal() {
    // 检查是否已存在弹窗，如果存在则移除
    const existingModal = document.getElementById('add-data-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建模态框背景
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'add-data-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    
    // 创建模态框容器 - 只保留必要的容器并设置最大宽度
    const modalContainer = document.createElement('div');
    modalContainer.id = 'add-data-modal';
    modalContainer.className = 'modal-container';
    modalContainer.style.maxWidth = '500px'; // 设置最大宽度限制
    
    // 创建表单 - 这是主要模块
    const form = document.createElement('form');
    form.id = 'add-site-form';
    form.style.width = '100%'; // 表单宽度自适应父容器
    
    // 添加错误提示区域
    const errorContainer = document.createElement('div');
    errorContainer.id = 'modal-error-message';
    errorContainer.className = 'modal-error-message';
    errorContainer.style.display = 'none';
    errorContainer.style.color = '#8B4513'; // 深棕色文字
    errorContainer.style.marginBottom = '15px';
    errorContainer.style.padding = '10px';
    errorContainer.style.border = '1px solid #CD853F'; // 秘鲁色边框
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.backgroundColor = '#F5DEB3'; // 浅古铜色背景
    form.appendChild(errorContainer);
    
    // 清除URL输入时的错误提示
    const clearErrorOnInput = () => {
        const errorContainer = document.getElementById('modal-error-message');
        if (errorContainer) {
            errorContainer.style.display = 'none';
            errorContainer.textContent = '';
        }
    }
    
    // 网站标题 - 水平布局
    const titleGroup = createFormGroup('网站标题', 'site-title', 'text', true, true);
    // 删除标题标签前的空白并靠左，删除右侧多余宽度
    const titleLabel = titleGroup.querySelector('label');
    titleLabel.style.marginLeft = '0';
    titleLabel.style.textAlign = 'left';
    titleLabel.style.width = 'fit-content'; // 完全贴合内容宽度
    titleLabel.style.display = 'inline-block'; // 行内块元素以适应内容宽度
    titleLabel.style.whiteSpace = 'nowrap'; // 防止文本换行
    titleLabel.style.marginRight = '0'; // 删除右侧多余边距
    titleLabel.style.paddingRight = '0'; // 删除右侧多余内边距
    titleLabel.style.overflow = 'visible'; // 确保内容完全显示
    
    // 减少form-label-container的宽度至和label一致
    const labelContainer = titleGroup.querySelector('.form-label-container');
    if (labelContainer) {
        labelContainer.style.width = 'auto';
        labelContainer.style.display = 'inline-block';
        labelContainer.style.whiteSpace = 'nowrap';
    }
    
    // 网站URL - 水平布局
    const urlGroup = createFormGroup('网站URL', 'site-url', 'url', true, true);
    const urlInput = urlGroup.querySelector('#site-url');
    // 移除默认的https://前缀
    urlInput.addEventListener('input', clearErrorOnInput);
    
    // 为其他输入框添加错误清除功能
    const titleInput = document.getElementById('site-title');
    if (titleInput) titleInput.addEventListener('input', clearErrorOnInput);
    
    // 避免变量重复声明，直接使用元素引用
    const categoryInputElement = document.getElementById('site-category');
    if (categoryInputElement) categoryInputElement.addEventListener('input', clearErrorOnInput);
    
    // 对网站URL模块执行同样的操作
    const urlLabelContainer = urlGroup.querySelector('.form-label-container');
    if (urlLabelContainer) {
        urlLabelContainer.style.width = 'auto';
        urlLabelContainer.style.display = 'inline-block';
        urlLabelContainer.style.whiteSpace = 'nowrap';
    }
    
    // 设置URL模块label的样式，文字靠左并删除右侧多余宽度
    const urlLabel = urlGroup.querySelector('label');
    if (urlLabel) {
        urlLabel.style.textAlign = 'left'; // 文字靠左
        urlLabel.style.marginRight = '0'; // 删除右侧多余边距
        urlLabel.style.paddingRight = '0'; // 删除右侧多余内边距
        urlLabel.style.width = 'fit-content'; // 完全贴合内容宽度
        urlLabel.style.display = 'inline-block'; // 行内块元素以适应内容宽度
        urlLabel.style.whiteSpace = 'nowrap'; // 防止文本换行
        urlLabel.style.overflow = 'visible'; // 确保内容完全显示
    }
    
    // 网站描述
    const descGroup = createFormGroup('网站描述', 'site-description', 'textarea', false);
    const descTextarea = descGroup.querySelector('#site-description');
    descTextarea.className = 'form-textarea';
    
    // 分类选择 - 水平布局
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'form-group form-group--horizontal';
    
    const categoryLabel = document.createElement('label');
    categoryLabel.htmlFor = 'site-category';
    categoryLabel.textContent = '分类 *';
    categoryLabel.className = 'form-label';
    categoryLabel.style.marginLeft = '0'; // 删除分类文本前的空白
    categoryLabel.style.textAlign = 'left'; // 文字靠左
    categoryLabel.style.marginRight = '0'; // 删除右侧多余边距
    categoryLabel.style.paddingRight = '0'; // 删除右侧多余内边距
    categoryLabel.style.width = 'fit-content'; // 完全贴合内容宽度
    categoryLabel.style.display = 'inline-block'; // 行内块元素以适应内容宽度
    categoryLabel.style.whiteSpace = 'nowrap'; // 防止文本换行
    categoryLabel.style.overflow = 'visible'; // 确保内容完全显示
    
    // 创建输入框和按钮容器
    const categoryInputContainer = document.createElement('div');
    categoryInputContainer.style.display = 'flex';
    categoryInputContainer.style.alignItems = 'center';
    categoryInputContainer.style.gap = '8px';
    
    // 创建分类输入框（只读）
    const categoryInput = document.createElement('input');
    categoryInput.id = 'site-category';
    categoryInput.type = 'text';
    categoryInput.readOnly = true;
    categoryInput.required = true;
    categoryInput.className = 'form-input';
    categoryInput.placeholder = '点击选择分类';
    categoryInput.style.minWidth = '250px'; // 增加输入框宽度
    
    // 如果当前有选中的分类，设置为默认值（显示完整路径）
    if (AppState.currentCategory && AppState.currentCategory !== 'all') {
        // 查找完整的分类路径
        let fullCategoryPath = findFullCategoryPath(AppState.currentCategory);
        categoryInput.value = fullCategoryPath || AppState.currentCategory;
    }
    
    // 辅助函数：根据分类名称查找完整路径
    function findFullCategoryPath(categoryName) {
        // 递归查找分类的完整路径
        function searchCategory(category, path = []) {
            // 如果是当前要查找的分类
            if (category.name === categoryName) {
                return [...path, category.name];
            }
            
            // 检查子分类
            if (category.children) {
                for (const child of category.children) {
                    const result = searchCategory(child, [...path, category.name]);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        }
        
        // 遍历所有主分类
        for (const mainCategory of categoryHierarchy) {
            const path = searchCategory(mainCategory);
            if (path) {
                return path.join(' > ');
            }
        }
        return null;
    }
    
    // 创建分类选择按钮
    const categoryButton = document.createElement('button');
    categoryButton.type = 'button';
    categoryButton.textContent = '选择分类';
    categoryButton.className = 'btn btn-secondary';
    categoryButton.style.whiteSpace = 'nowrap'; // 防止按钮文本换行
    
    // 点击按钮打开分类选择模态框
    categoryButton.addEventListener('click', () => {
        openCategoryModal(categoryInput);
    });
    
    // 组装分类输入容器
    categoryInputContainer.appendChild(categoryInput);
    categoryInputContainer.appendChild(categoryButton);
    
    // 组装分类表单组
    categoryGroup.appendChild(categoryLabel);
    categoryGroup.appendChild(categoryInputContainer);
    
    // 推荐程度 - 水平布局
    const levelGroup = document.createElement('div');
    levelGroup.className = 'form-group';
    levelGroup.style.display = 'flex';
    levelGroup.style.alignItems = 'center';
    levelGroup.style.gap = '8px';
    
    const levelLabel = document.createElement('label');
    levelLabel.htmlFor = 'site-level';
    levelLabel.textContent = '推荐程度';
    levelLabel.className = 'form-label';
    
    const levelSelect = document.createElement('select');
    levelSelect.id = 'site-level';
    levelSelect.className = 'form-select';
    levelSelect.style.width = 'auto'; // 宽度与推荐程度文本相同
    
    const levelOptions = [
        { value: 'tertiary', text: '首选' },
        { value: 'secondary', text: '次选' },
        { value: 'primary', text: '备选' }
    ];
    
    levelOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        if (option.value === 'secondary') {
            opt.selected = true;
        }
        levelSelect.appendChild(opt);
    });
    
    levelGroup.appendChild(levelLabel);
    levelGroup.appendChild(levelSelect);
    
    // 添加按钮
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = '添加';
    submitButton.className = 'btn btn-primary btn-submit';
    
    // 设置添加按钮样式，确保底部高度与label一致
    submitButton.style.backgroundColor = '#cd7f32'; // 古铜色
    submitButton.style.borderColor = '#b87333';
    submitButton.style.height = 'auto'; // 自适应高度
    submitButton.style.padding = '4px 12px'; // 调整内边距使底部高度与label一致
    submitButton.style.lineHeight = '1.5'; // 调整行高
    submitButton.style.display = 'inline-flex';
    submitButton.style.alignItems = 'center';
    
    // 组装表单 - 直接添加所有元素，不再使用多余的容器
    form.appendChild(titleGroup);
    form.appendChild(urlGroup);
    form.appendChild(descGroup);
    form.appendChild(categoryGroup);
    
    // 只保留必要的容器来放置推荐程度和按钮，使用flex布局
    const formRowContainer = document.createElement('div');
    formRowContainer.style.display = 'flex';
    formRowContainer.style.alignItems = 'center';
    formRowContainer.style.justifyContent = 'space-between';
    formRowContainer.style.width = '100%'; // 宽度自适应父容器
    
    // 添加推荐程度和按钮到行容器
    formRowContainer.appendChild(levelGroup);
    formRowContainer.appendChild(submitButton);
    
    form.appendChild(formRowContainer);
    
    // 组装模态框 - 只添加form到modalContainer
    modalContainer.appendChild(form);
    modalOverlay.appendChild(modalContainer);
    
    // 添加到文档
    document.body.appendChild(modalOverlay);
    
    // 阻止事件冒泡
    modalContainer.addEventListener('click', (e) => e.stopPropagation());
    
    // 关闭模态框
    function closeModal() {
        modalOverlay.remove();
    }
    
    // 点击模态框外部关闭
    modalOverlay.addEventListener('click', closeModal);
    
    // 按Escape键关闭
    document.addEventListener('keydown', function handleEsc(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    });
    
    // 表单提交处理
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // 获取表单数据
            const title = document.getElementById('site-title').value.trim();
            const url = document.getElementById('site-url').value.trim();
            const description = document.getElementById('site-description').value.trim();
            const category = document.getElementById('site-category').value;
            const levelValue = document.getElementById('site-level').value;
            
            // 验证分类是否已选择
            if (!category) {
                const errorContainer = document.getElementById('modal-error-message');
                errorContainer.textContent = '请选择分类';
                errorContainer.style.display = 'block';
                return;
            }
            
            // 验证URL
            try {
                new URL(url);
            } catch (err) {
                const errorContainer = document.getElementById('modal-error-message');
                errorContainer.textContent = '请输入有效的URL地址';
                errorContainer.style.display = 'block';
                return;
            }
            
            // 检查URL是否已存在
            const urlExists = AppState.allSites.some(site => site.url === url);
            if (urlExists) {
                const errorContainer = document.getElementById('modal-error-message');
                errorContainer.textContent = '该URL已存在，请添加其他网站';
                errorContainer.style.display = 'block';
                return;
            }
            
            // 验证标题
            if (!title) {
                const errorContainer = document.getElementById('modal-error-message');
                errorContainer.textContent = '网站标题不能为空';
                errorContainer.style.display = 'block';
                return;
            }
            
            // 映射level值为数字类型，与现有数据保持一致
            let level = 2; // 默认次选(2)
            if (levelValue === 'primary') {
                level = 1; // 首选
            } else if (levelValue === 'tertiary') {
                level = 3; // 其他
            }
            
            // 不再创建tags数组
            
            // 收集表单数据，确保与现有数据格式一致
            const newSite = {
                title: title, // 使用title而非name，与现有数据保持一致
                url: url,
                description: description,
                categoryPath: category, // 只使用完整路径作为categoryPath
                level: level, // 使用数字类型
                created_at: new Date().toISOString(), // 使用created_at而非created，与applyFiltersAndSort函数保持一致

                // 自动生成ID
                id: 'site_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };
            
            // 添加到数据中
            AppState.allSites.push(newSite);
            
            // 重新应用筛选和排序
            applyFiltersAndSort();
            
            // 显示成功消息
            showToast('网站添加成功');
            
            // 关闭模态框
            closeModal();
        } catch (error) {
            console.error('添加网站失败:', error);
            showToast('添加网站失败，请重试', 'error');
        }
    });
}

// 打开分类选择模态框
function openCategoryModal(inputElement) {
    // 保存当前输入元素的引用
    currentCategoryInput = inputElement;
    
    // 重置选择状态
    currentSelectedCategoryPath = [];
    currentSelectedCategory = null;
    
    // 检查是否已存在模态框，如果存在则移除
    const existingModal = document.getElementById('category-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 创建模态框背景
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'category-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    
    // 创建模态框容器
    const modalContainer = document.createElement('div');
    modalContainer.id = 'category-modal';
    modalContainer.className = 'modal-container';
    modalContainer.style.maxWidth = '400px';
    
    // 创建标题
    const title = document.createElement('h3');
    title.textContent = '选择分类';
    title.className = 'modal-title';
    
    // 创建分类选择器容器
    const categorySelector = document.createElement('div');
    categorySelector.id = 'category-selector';
    categorySelector.className = 'category-selector';
    
    // 生成分类选择器内容
    generateCategorySelector(categorySelector);
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-actions';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.marginTop = '20px';
    
    // 创建取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-category-btn';
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.addEventListener('click', closeCategoryModal);
    
    // 创建确认按钮
    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'confirm-category-btn';
    confirmBtn.textContent = '确认';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.addEventListener('click', confirmCategorySelection);
    
    // 组装按钮容器
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    
    // 组装模态框
    modalContainer.appendChild(title);
    modalContainer.appendChild(categorySelector);
    modalContainer.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContainer);
    
    // 添加到文档
    document.body.appendChild(modalOverlay);
    
    // 阻止事件冒泡
    modalContainer.addEventListener('click', (e) => e.stopPropagation());
    
    // 点击模态框外部关闭
    modalOverlay.addEventListener('click', closeCategoryModal);
    
    // 按Escape键关闭
    document.addEventListener('keydown', function handleEsc(e) {
        if (e.key === 'Escape') {
            closeCategoryModal();
            document.removeEventListener('keydown', handleEsc);
        }
    });
}

// 生成分类选择器
function generateCategorySelector(selectorElement) {
    selectorElement.innerHTML = '';
    
    // 显示当前选择路径
    const pathDisplay = document.createElement('div');
    pathDisplay.className = 'category-path';
    pathDisplay.textContent = currentSelectedCategoryPath.length > 0 
        ? currentSelectedCategoryPath.join(' > ') 
        : '请选择分类';
    pathDisplay.style.marginBottom = '15px';
    pathDisplay.style.fontWeight = 'bold';
    selectorElement.appendChild(pathDisplay);
    
    // 根据当前路径显示下一级分类
    let currentLevel = categoryHierarchy;
    let pathCopy = [...currentSelectedCategoryPath];
    
    // 导航到当前选择路径的最后一级
    while (pathCopy.length > 0 && currentLevel) {
        const categoryName = pathCopy.shift();
        const category = currentLevel.find(c => c.name === categoryName);
        if (category && category.children) {
            currentLevel = category.children;
        } else {
            currentLevel = null;
        }
    }
    
    // 如果有下一级分类，显示它们
    if (currentLevel) {
        const categoryList = document.createElement('div');
        categoryList.className = 'category-list';
        categoryList.style.maxHeight = '300px';
        categoryList.style.overflowY = 'auto';
        
        currentLevel.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.textContent = category.name;
            categoryItem.style.padding = '8px 12px';
            categoryItem.style.cursor = 'pointer';
            categoryItem.style.borderRadius = '4px';
            categoryItem.style.marginBottom = '4px';
            categoryItem.style.transition = 'background-color 0.2s';
            
            // 鼠标悬停效果 - 深古铜色
            categoryItem.addEventListener('mouseenter', () => {
                categoryItem.style.backgroundColor = '#b89a77';
            });
            categoryItem.addEventListener('mouseleave', () => {
                categoryItem.style.backgroundColor = '';
            });
            
            // 检查是否是叶子节点
            if (!category.children || category.children.length === 0) {
                // 叶子节点可以直接选择
                categoryItem.addEventListener('click', () => {
                    currentSelectedCategory = category.name;
                    currentSelectedCategoryPath.push(category.name);
                    generateCategorySelector(selectorElement);
                });
            } else {
                // 非叶子节点可以继续下钻
                categoryItem.classList.add('category-parent');
                categoryItem.style.display = 'flex';
                categoryItem.style.justifyContent = 'space-between';
                categoryItem.style.alignItems = 'center';
                
                // 添加下钻图标
                const arrowIcon = document.createElement('span');
                arrowIcon.textContent = '▶';
                arrowIcon.style.fontSize = '12px';
                categoryItem.appendChild(arrowIcon);
                
                categoryItem.addEventListener('click', () => {
                    currentSelectedCategoryPath.push(category.name);
                    generateCategorySelector(selectorElement);
                });
            }
            
            categoryList.appendChild(categoryItem);
        });
        
        selectorElement.appendChild(categoryList);
    }
    
    // 如果不是根目录，添加返回上一级按钮
    if (currentSelectedCategoryPath.length > 0) {
        const backBtn = document.createElement('button');
        backBtn.className = 'btn btn-secondary';
        backBtn.textContent = '返回上一级';
        backBtn.style.marginTop = '16px';
        backBtn.addEventListener('click', () => {
            currentSelectedCategoryPath.pop();
            currentSelectedCategory = null;
            generateCategorySelector(selectorElement);
        });
        selectorElement.appendChild(backBtn);
    }
}

// 确认选择分类
function confirmCategorySelection() {
    if (currentSelectedCategoryPath.length > 0) {
        // 显示完整的分类路径，如：图像 > 欧洲 > 意大利
        const fullCategoryPath = currentSelectedCategoryPath.join(' > ');
        if (currentCategoryInput) {
            currentCategoryInput.value = fullCategoryPath;
        }
        closeCategoryModal();
    } else {
        showToast('请选择一个有效的分类', 'error');
    }
}

// 关闭分类选择模态框
function closeCategoryModal() {
    const modalOverlay = document.getElementById('category-modal-overlay');
    if (modalOverlay) {
        modalOverlay.remove();
    }
    currentSelectedCategoryPath = [];
    currentSelectedCategory = null;
    // 不清除currentCategoryInput引用，以防在关闭后需要访问
}

// 创建表单组辅助函数
function createFormGroup(labelText, id, type, required = false, horizontal = false) {
    const group = document.createElement('div');
    group.className = horizontal ? 'form-group form-group--horizontal' : 'form-group';
    
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText + (required ? ' *' : '');
    label.className = 'form-label';
    
    let input;
    if (type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 4;
    } else {
        input = document.createElement('input');
        input.type = type;
    }
    
    input.id = id;
    input.required = required;
    input.className = 'form-input';
    
    if (horizontal) {
        const labelContainer = document.createElement('div');
        labelContainer.className = 'form-label-container';
        labelContainer.appendChild(label);
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'form-input-container';
        inputContainer.appendChild(input);
        
        group.appendChild(labelContainer);
        group.appendChild(inputContainer);
    } else {
        group.appendChild(label);
        group.appendChild(input);
    }
    
    return group;
}

// 处理分类点击
function handleCategoryClick(event) {
    event.preventDefault();
    
    // 获取点击的链接元素
    const target = event.target.closest('.category-link');
    if (!target) return;
    
    // 处理分类头部点击（切换子菜单显示）
    if (target.classList.contains('category-header')) {
        // 找到对应的父元素和子菜单
        const categoryItem = target.closest('.category-item');
        const subMenu = target.nextElementSibling;
        
        if (subMenu && subMenu.classList.contains('category-submenu')) {
            // 移除了自动关闭其他子菜单的功能，允许多个子菜单同时展开
            
            // 切换当前子菜单显示状态和expanded类
            const isExpanded = subMenu.classList.toggle('show');
            if (categoryItem) {
                categoryItem.classList.toggle('expanded', isExpanded);
            }
            
            // 阻止默认行为，只展开/收起子菜单
            return;
        }
    }
    
    // 获取分类数据属性
    const category = target.getAttribute('data-category');
    
    // 处理数据管理子菜单特殊功能
    switch (category) {

        case '导出':
        case '导出数据': // 保持向后兼容
            exportData();
            return;
        case '导入':
        case '导入数据': // 保持向后兼容
            importData();
            return;
        case '添加':
        case '添加数据': // 保持向后兼容
            showAddDataModal();
            return;
        case '编辑':
            toggleEditMode();
            return;
    }
    
    // 更新活动状态
    document.querySelectorAll('.category-link').forEach(link => {
        link.classList.remove('active');
    });
    target.classList.add('active');
    
    // 设置当前分类
    AppState.currentCategory = category;
    
    // 更新当前分类显示文本（排除箭头元素）
    let categoryText;
    if (target.querySelector('.submenu-arrow')) {
        // 如果有箭头，获取纯文本内容
        categoryText = target.textContent.replace(/›/g, '').trim();
    } else {
        categoryText = target.textContent.trim();
    }
    
    // 如果页面上有显示当前分类的元素，可以在这里更新
    
    // 应用筛选和排序
    applyFiltersAndSort();
    
    // 在移动设备上关闭侧边栏
    if (window.innerWidth <= 1024) {
        toggleSidebar(false);
    }
}

// 切换侧边栏
function toggleSidebar(show) {
    // 添加空值检查以避免错误
    if (!DOM.sidebar || !DOM.sidebarOverlay) return;
    
    if (show !== undefined) {
        // 如果指定了show参数，明确设置侧边栏状态
        DOM.sidebar.classList.toggle('open', show);
        DOM.sidebarOverlay.classList.toggle('show', show);
    } else {
        // 否则切换当前状态
        DOM.sidebar.classList.toggle('open');
        DOM.sidebarOverlay.classList.toggle('show');
    }
    
    // 防止滚动
      if (DOM.sidebar.classList.contains('open')) {
        document.body.classList.add('no-scroll');
      } else {
        document.body.classList.remove('no-scroll');
      }
}

// 处理排序变化
function handleSortChange() {
    if (DOM.sortSelect) {
        AppState.currentSort = DOM.sortSelect.value;
        applyFiltersAndSort();
    }
}

// 处理搜索
function handleSearch(event) {
    // 已经移除了sidebarSearchInput，所以不需要同步
    const searchTerm = event.target.value.toLowerCase().trim();
    AppState.currentSearchTerm = searchTerm;
    
    // 使用防抖优化搜索性能
    debouncedHandleSearch(searchTerm);
}

// 切换编辑模式
function toggleEditMode() {
    AppState.isEditMode = !AppState.isEditMode;
    
    // 显示或隐藏所有卡片的操作按钮
    const cardActions = document.querySelectorAll('.card-actions');
    cardActions.forEach(actions => {
        actions.style.display = AppState.isEditMode ? 'flex' : 'none';
    });
    
    // 显示提示
    showToast(AppState.isEditMode ? '已进入编辑模式' : '已退出编辑模式');
}

// 编辑网站
function editSite(site) {
    // 创建编辑模态框
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'edit-site-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    
    const modalContainer = document.createElement('div');
    modalContainer.id = 'edit-site-modal';
    modalContainer.className = 'modal-container';
    modalContainer.style.maxWidth = '500px'; // 设置最大宽度限制
    
    // 创建表单
    const form = document.createElement('form');
    form.id = 'edit-site-form';
    form.style.width = '100%'; // 表单宽度自适应父容器
    
    // 创建标题
    const title = document.createElement('h2');
    title.textContent = '编辑网站';
    form.appendChild(title);
    
    // 网站标题 - 水平布局
    const titleGroup = createFormGroup('网站标题', 'edit-title', 'text', true, true);
    // 减少form-label-container的宽度至和label一致
    const labelContainer = titleGroup.querySelector('.form-label-container');
    if (labelContainer) {
        labelContainer.style.width = 'auto';
        labelContainer.style.display = 'inline-block';
        labelContainer.style.whiteSpace = 'nowrap';
    }
    
    // 设置输入框的值
    const titleInput = titleGroup.querySelector('#edit-title');
    titleInput.value = site.title || '';
    form.appendChild(titleGroup);
    
    // 网站URL - 水平布局
    const urlGroup = createFormGroup('网站URL', 'edit-url', 'url', true, true);
    // 对网站URL模块执行同样的操作
    const urlLabelContainer = urlGroup.querySelector('.form-label-container');
    if (urlLabelContainer) {
        urlLabelContainer.style.width = 'auto';
        urlLabelContainer.style.display = 'inline-block';
        urlLabelContainer.style.whiteSpace = 'nowrap';
    }
    
    // 设置URL模块label的样式，文字靠左并删除右侧多余宽度
    const urlLabel = urlGroup.querySelector('label');
    if (urlLabel) {
        urlLabel.style.textAlign = 'left'; // 文字靠左
        urlLabel.style.marginRight = '0'; // 删除右侧多余边距
        urlLabel.style.paddingRight = '0'; // 删除右侧多余内边距
        urlLabel.style.width = 'fit-content'; // 完全贴合内容宽度
        urlLabel.style.display = 'inline-block'; // 行内块元素以适应内容宽度
        urlLabel.style.whiteSpace = 'nowrap'; // 防止文本换行
        urlLabel.style.overflow = 'visible'; // 确保内容完全显示
    }
    
    // 设置输入框的值
    const urlInput = urlGroup.querySelector('#edit-url');
    urlInput.value = site.url || '';
    form.appendChild(urlGroup);
    
    // 网站描述
    const descGroup = createFormGroup('网站描述', 'edit-description', 'textarea', false);
    const descTextarea = descGroup.querySelector('#edit-description');
    descTextarea.className = 'form-textarea';
    descTextarea.value = site.description || '';
    form.appendChild(descGroup);
    
    // 分类选择 - 水平布局
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'form-group form-group--horizontal';
    
    const categoryLabel = document.createElement('label');
    categoryLabel.htmlFor = 'edit-category';
    categoryLabel.textContent = '分类 *';
    categoryLabel.className = 'form-label';
    categoryLabel.style.marginLeft = '0'; // 删除分类文本前的空白
    categoryLabel.style.textAlign = 'left'; // 文字靠左
    categoryLabel.style.marginRight = '0'; // 删除右侧多余边距
    categoryLabel.style.paddingRight = '0'; // 删除右侧多余内边距
    categoryLabel.style.width = 'fit-content'; // 完全贴合内容宽度
    categoryLabel.style.display = 'inline-block'; // 行内块元素以适应内容宽度
    categoryLabel.style.whiteSpace = 'nowrap'; // 防止文本换行
    categoryLabel.style.overflow = 'visible'; // 确保内容完全显示
    
    // 创建输入框和按钮容器
    const categoryInputContainer = document.createElement('div');
    categoryInputContainer.style.display = 'flex';
    categoryInputContainer.style.alignItems = 'center';
    categoryInputContainer.style.gap = '8px';
    
    // 创建分类输入框（只读）
    const categoryInput = document.createElement('input');
    categoryInput.id = 'edit-category';
    categoryInput.type = 'text';
    categoryInput.readOnly = true;
    categoryInput.required = true;
    categoryInput.className = 'form-input';
    // 确保显示完整分类路径，格式为"主分类-子分类"
    categoryInput.value = site.categoryPath || site.category || '';
    
    // 如果没有categoryPath但有category，尝试从分类层级中构建完整路径
    if (!site.categoryPath && site.category) {
        // 遍历分类层级查找匹配的完整路径
        for (const mainCategory of categoryHierarchy) {
            if (mainCategory.name === site.category) {
                // 如果是主分类，直接使用
                categoryInput.value = mainCategory.name;
                break;
            }
            
            // 检查一级子分类
            for (const subCategory of mainCategory.children) {
                if (subCategory.name === site.category) {
                    // 构建"主分类-子分类"格式的完整路径
                    categoryInput.value = `${mainCategory.name}-${subCategory.name}`;
                    break;
                }
                
                // 检查二级子分类（如果有）
                if (subCategory.children) {
                    for (const grandChildCategory of subCategory.children) {
                        if (grandChildCategory.name === site.category) {
                            // 构建"主分类-子分类-二级子分类"格式的完整路径
                            categoryInput.value = `${mainCategory.name}-${subCategory.name}-${grandChildCategory.name}`;
                            break;
                        }
                    }
                    if (categoryInput.value.includes('-')) break;
                }
            }
            if (categoryInput.value.includes('-')) break;
        }
    }
    
    // 如果没有categoryPath但有category，尝试从分类层级中构建完整路径
    if (!site.categoryPath && site.category) {
        // 遍历分类层级查找匹配的完整路径
        for (const mainCategory of categoryHierarchy) {
            if (mainCategory.name === site.category) {
                // 如果是主分类，直接使用
                categoryInput.value = mainCategory.name;
                break;
            }
            
            // 检查一级子分类
            for (const subCategory of mainCategory.children) {
                if (subCategory.name === site.category) {
                    // 构建"主分类-子分类"格式的完整路径
                    categoryInput.value = `${mainCategory.name}-${subCategory.name}`;
                    break;
                }
                
                // 检查二级子分类（如果有）
                if (subCategory.children) {
                    for (const grandChildCategory of subCategory.children) {
                        if (grandChildCategory.name === site.category) {
                            // 构建"主分类-子分类-二级子分类"格式的完整路径
                            categoryInput.value = `${mainCategory.name}-${subCategory.name}-${grandChildCategory.name}`;
                            break;
                        }
                    }
                    if (categoryInput.value.includes('-')) break;
                }
            }
            if (categoryInput.value.includes('-')) break;
        }
    }
    categoryInput.placeholder = '点击选择分类';
    categoryInput.style.minWidth = '250px'; // 增加输入框宽度
    
    // 创建分类选择按钮
    const categoryButton = document.createElement('button');
    categoryButton.type = 'button';
    categoryButton.textContent = '选择分类';
    categoryButton.className = 'btn btn-secondary';
    categoryButton.style.whiteSpace = 'nowrap';
    
    // 临时保存当前编辑的网站引用
    let currentEditingSite = site;
    
    // 点击按钮打开分类选择模态框
    categoryButton.addEventListener('click', () => {
        // 保存当前编辑的网站ID，用于后续更新
        AppState.tempEditingSite = site;
        openCategoryModal(categoryInput);
    });
    
    // 组装分类输入容器
    categoryInputContainer.appendChild(categoryInput);
    categoryInputContainer.appendChild(categoryButton);
    
    // 组装分类表单组
    categoryGroup.appendChild(categoryLabel);
    categoryGroup.appendChild(categoryInputContainer);
    form.appendChild(categoryGroup);
    
    // 推荐程度 - 水平布局
    const levelGroup = document.createElement('div');
    levelGroup.className = 'form-group';
    levelGroup.style.display = 'flex';
    levelGroup.style.alignItems = 'center';
    levelGroup.style.gap = '8px';
    
    const levelLabel = document.createElement('label');
    levelLabel.htmlFor = 'edit-level';
    levelLabel.textContent = '推荐程度';
    levelLabel.className = 'form-label';
    
    const levelSelect = document.createElement('select');
    levelSelect.id = 'edit-level';
    levelSelect.className = 'form-select';
    levelSelect.style.width = 'auto';
    
    const levelOptions = [
        { value: 'tertiary', text: '首选' },
        { value: 'secondary', text: '次选' },
        { value: 'primary', text: '备选' }
    ];
    
    // 将数字级别转换为文本级别
    const getLevelValue = (numLevel) => {
        switch(numLevel) {
            case 1: return 'primary';
            case 3: return 'tertiary';
            default: return 'secondary';
        }
    };
    
    levelOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        if (option.value === getLevelValue(site.level)) {
            opt.selected = true;
        }
        levelSelect.appendChild(opt);
    });
    
    levelGroup.appendChild(levelLabel);
    levelGroup.appendChild(levelSelect);
    form.appendChild(levelGroup);
    
    // 添加按钮
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = '保存';
    saveButton.className = 'btn btn-primary btn-submit';
    
    // 设置添加按钮样式，确保底部高度与label一致
    saveButton.style.backgroundColor = '#cd7f32'; // 古铜色
    saveButton.style.borderColor = '#b87333';
    saveButton.style.height = 'auto'; // 自适应高度
    saveButton.style.padding = '4px 12px'; // 调整内边距使底部高度与label一致
    saveButton.style.lineHeight = '1.5'; // 调整行高
    saveButton.style.display = 'inline-flex';
    saveButton.style.alignItems = 'center';
    
    // 只保留必要的容器来放置推荐程度和按钮，使用flex布局
    const formRowContainer = document.createElement('div');
    formRowContainer.style.display = 'flex';
    formRowContainer.style.alignItems = 'center';
    formRowContainer.style.justifyContent = 'space-between';
    formRowContainer.style.width = '100%'; // 宽度自适应父容器
    
    // 创建按钮容器
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '8px';
    
    // 创建取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-edit';
    cancelButton.type = 'button';
    cancelButton.textContent = '取消';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.style.height = 'auto'; // 自适应高度
    cancelButton.style.padding = '4px 12px'; // 调整内边距使底部高度与label一致
    cancelButton.style.lineHeight = '1.5'; // 调整行高
    cancelButton.style.display = 'inline-flex';
    cancelButton.style.alignItems = 'center';
    
    // 添加按钮到按钮容器
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(saveButton);
    
    // 添加推荐程度和按钮容器到行容器
    formRowContainer.appendChild(levelGroup);
    formRowContainer.appendChild(buttonsContainer);
    
    form.appendChild(formRowContainer);
    

    
    modalContainer.appendChild(form);
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
    
    // 阻止模态框内部点击事件冒泡到覆盖层
    modalContainer.addEventListener('click', (e) => e.stopPropagation());
    
    // 关闭模态框
    function closeModal() {
        modalOverlay.remove();
        // 清除临时编辑的网站引用
        AppState.tempEditingSite = null;
    }
    
    // 点击模态框外部关闭
    modalOverlay.addEventListener('click', closeModal);
    
    // 按Escape键关闭
    document.addEventListener('keydown', function handleEsc(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    });
    
    // 处理表单提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // 获取表单数据
            const title = document.getElementById('edit-title').value.trim();
            const url = document.getElementById('edit-url').value.trim();
            const description = document.getElementById('edit-description').value.trim();
            const category = document.getElementById('edit-category').value;
            const levelValue = document.getElementById('edit-level').value;
            
            // 将文本级别转换为数字级别
            const getNumLevel = (textLevel) => {
                switch(textLevel) {
                    case 'primary': return 1;
                    case 'secondary': return 2;
                    case 'tertiary': return 3;
                    default: return 2;
                }
            };
            
            // 验证分类是否已选择
            if (!category) {
                showToast('请选择分类', 'error');
                return;
            }
            
            // 验证URL
            try {
                new URL(url);
            } catch (err) {
                showToast('请输入有效的URL地址', 'error');
                return;
            }
            
            // 验证标题
            if (!title) {
                showToast('网站标题不能为空', 'error');
                return;
            }
            
            // 更新网站数据
            const updatedSite = {
                ...site,
                title: title,
                url: url,
                description: description,
                categoryPath: category, // 只使用完整路径作为categoryPath
                level: getNumLevel(levelValue),
                updated_at: new Date().toISOString(),
                // 删除tags字段
            };
            
            // 删除可能存在的category字段，确保数据一致性
            delete updatedSite.category;
            
            // 找到并更新AppState中的网站
            const index = AppState.allSites.findIndex(s => (s.id && s.id === site.id) || s.title === site.title);
            if (index !== -1) {
                AppState.allSites[index] = updatedSite;
                
                // 重新应用筛选和排序
                applyFiltersAndSort();
                
                // 显示成功消息
                showToast('网站更新成功');
                
                // 关闭模态框
                closeModal();
            }
        } catch (error) {
            console.error('更新网站失败:', error);
            showToast('更新网站失败，请重试', 'error');
        }
    });
    
    // 处理取消按钮
    document.getElementById('cancel-edit').addEventListener('click', closeModal);
}

// 删除网站
function deleteSite(site) {
    if (confirm(`确定要删除网站 "${site.title}" 吗？`)) {
        // 从AppState中删除网站
        AppState.allSites = AppState.allSites.filter(s => !(s.id && s.id === site.id) && s.title !== site.title);
        
        // 重新应用筛选和排序
        applyFiltersAndSort();
        
        // 显示成功消息
        showToast('网站删除成功');
    }
}

// 清除筛选器
function clearFilters() {
    // 重置搜索框
    if (DOM.mainSearchInput) {
        DOM.mainSearchInput.value = '';
    }
    
    // 重置排序选项
    document.querySelectorAll('.sort-option').forEach(option => {
        option.removeAttribute('data-selected');
    });
    const defaultSortOption = document.querySelector('.sort-option[data-value="created"]');
    if (defaultSortOption) {
        defaultSortOption.setAttribute('data-selected', 'true');
    }
    
    // 重置排序状态
    AppState.currentSort = 'created';
    
    // 重置分类
    AppState.currentCategory = 'all';
    
    // 移除所有活动状态
    const activeLinks = document.querySelectorAll('.category-link.active');
    activeLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 不激活任何特定分类，显示所有网站
    
    // 清除搜索词
    AppState.currentSearchTerm = '';
    
    // 应用筛选和排序
    applyFiltersAndSort();
    
    // 显示提示
    showToast('筛选条件已清除');
}

function toggleSortMenu(event) {
    event.stopPropagation();
    const sortMenu = document.getElementById('sort-menu');
    
    sortMenu.classList.toggle('show');
}

function closeSortMenu() {
    const sortMenu = document.getElementById('sort-menu');
    
    sortMenu.classList.remove('show');
}

function closeSortMenuOnClickOutside(event) {
    const sortDropdown = document.getElementById('sort-dropdown');
    if (sortDropdown && !sortDropdown.contains(event.target)) {
        closeSortMenu();
    }
}

function handleSortOptionClick(event) {
    const value = event.target.getAttribute('data-value');
    
    // 移除所有选项的选中状态
    document.querySelectorAll('.sort-option').forEach(option => {
        option.removeAttribute('data-selected');
    });
    
    // 设置当前选项为选中
    event.target.setAttribute('data-selected', 'true');
    
    // 保存当前排序设置到状态
    AppState.currentSort = value;
    
    // 应用筛选和排序
    applyFiltersAndSort();
    
    // 关闭下拉菜单
    closeSortMenu();
}

// 应用筛选和排序
function applyFiltersAndSort() {
    // 使用AppState中的状态进行筛选
    const { allSites, currentCategory, currentSearchTerm, currentSort } = AppState;
    
    // 重置筛选结果
    let results = [...allSites];
    
    // 应用分类筛选
    if (currentCategory && currentCategory !== 'all') {
        // 针对新添加的子菜单和移动位置的菜单进行特殊处理
        // 检查当前分类是否在新添加的菜单中
        const newCategories = ['AI', '办公文档', '图片', '游戏', '设计', 
                              'AI助手', 'AI绘画', 'AI写作', 'AI编程', 'AI研究',
                              '文档编辑', '表格工具', '演示工具', 'PDF工具', '协作平台',
                              '图片浏览', '图片编辑', '图片素材', '图片压缩', '图库管理',
                              '休闲游戏', '益智游戏', '策略游戏', '角色扮演', '游戏工具',
                              'UI设计', '平面设计', '3D设计', '设计素材', '设计工具',
                              '字典翻译', '中文', '日韩朝', '西文', '翻译', '书法与篆刻',
                              '课程', '综合课程', '语言课程', '写作课程', '艺术课程',
                              '知识管理', '笔记', '绘图分析', '文献管理', '论文相关',
                              '视频', '软件', '官媒', '视频资源',
                              '音声', '音声工具', '音声资源',
                              'IT工具', '编程', '应用工具', '数据工具'];
        
        if (newCategories.includes(currentCategory)) {
            // 对于新添加的菜单，需要特殊处理分类匹配
            // 使用categoryPath字段进行匹配，因为数据加载时已经将category合并到categoryPath
            results = results.filter(site => {
                // 空值检查
                if (!site) return false;
                
                // 不再检查tags字段
                
                // 检查categoryPath字段
                const hasMatchingCategoryPath = site.categoryPath && 
                                              (site.categoryPath === currentCategory || 
                                               site.categoryPath.includes(currentCategory) ||
                                               site.categoryPath.includes(` > ${currentCategory}`) ||
                                               site.categoryPath.includes(`${currentCategory} > `));
                
                // 针对特定分类的特殊处理
                const hasSpecialMatching = 
                    (currentCategory === 'AI' && site.categoryPath?.includes('AI')) ||
                    (currentCategory === '办公文档' && (site.categoryPath?.includes('文档') || site.categoryPath?.includes('办公'))) ||
                    (currentCategory === '图片' && (site.categoryPath?.includes('图片') || site.categoryPath?.includes('图像'))) ||
                    (currentCategory === '游戏' && (site.categoryPath?.includes('游戏'))) ||
                    (currentCategory === '设计' && (site.categoryPath?.includes('设计'))) ||
                    // 确保图像-中国不加载文本-中国古籍的数据
                    (currentCategory === '中国' && site.categoryPath?.includes('图像-中国') && !site.categoryPath?.includes('文本-中国古籍'));
                
                return hasMatchingCategoryPath || hasSpecialMatching;
            });
        } else {
            // 优化的分类匹配逻辑，只使用categoryPath字段
            results = results.filter(site => {
                if (!site) return false;
                
                // 确保图像-中国不加载文本-中国古籍的数据
                if (currentCategory === '中国' && site.categoryPath?.includes('文本-中国古籍')) {
                    return false;
                }
                
                // 处理不同格式的分类路径分隔符（> 和 -）
                const hasExactMatch = site.categoryPath === currentCategory;
                const hasIncludedWithSpace = site.categoryPath && 
                                          (site.categoryPath.includes(currentCategory) ||
                                           site.categoryPath.includes(` > ${currentCategory}`) ||
                                           site.categoryPath.includes(`${currentCategory} > `));
                const hasIncludedWithDash = site.categoryPath && 
                                          (site.categoryPath.includes(`-${currentCategory}`) ||
                                           site.categoryPath.includes(`${currentCategory}-`));
                
                return hasExactMatch || hasIncludedWithSpace || hasIncludedWithDash;
            });
        }
    }
    
    // 应用搜索筛选
    if (currentSearchTerm) {
        const searchTerm = currentSearchTerm.toLowerCase().trim();
        results = results.filter(site => {
            if (!site) return false;
            return (site.title && site.title.toLowerCase().includes(searchTerm)) ||
                   (site.description && site.description.toLowerCase().includes(searchTerm)) ||
                   (site.categoryPath && site.categoryPath.toLowerCase().includes(searchTerm)) ||
                   false;
        });
    }
    
    // 应用排序
    const sortFunctions = {
        name: (a, b) => {
            const titleA = (a && a.title) || '';
            const titleB = (b && b.title) || '';
            return titleA.localeCompare(titleB, 'zh-CN');
        },
        created: (a, b) => {
            const dateA = new Date((a && (a.created_at || a.createdAt)) || 0);
            const dateB = new Date((b && (b.created_at || b.createdAt)) || 0);
            return dateB - dateA;
        },
        level: (a, b) => {
            const levelA = (a && a.level) || 0;
            const levelB = (b && b.level) || 0;
            return levelB - levelA;
        }
    };
    
    // 过滤掉可能的null或undefined条目
    results = results.filter(site => site != null);
    
    const sortFunc = sortFunctions[currentSort] || sortFunctions.created;
    results.sort(sortFunc);
    
    // 更新筛选结果
    AppState.filteredSites = results;
    
    // 渲染网站列表
    renderSites(results);
    
    // 更新网站数量显示
    if (DOM.siteCount) {
        DOM.siteCount.textContent = `已收录${results.length}个`;
    }
}

// 排序网站
function sortSites(sites, sortBy) {
    const sorted = [...sites];
    
    switch (sortBy) {
        case 'name':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'level':
            return sorted.sort((a, b) => b.level - a.level); // 从高到低
        case 'created':
            return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // 最新的在前
        default:
            // 默认按名称排序
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
}

// 处理窗口大小变化
function handleResize() {
    // 添加null检查以避免错误
    if (!DOM.sidebar || !DOM.sidebarOverlay) return;
    
    // 在大屏幕上自动打开侧边栏
    if (window.innerWidth > 1024) {
        DOM.sidebar.classList.add('open');
        DOM.sidebarOverlay.classList.remove('show');
        document.body.classList.remove('no-scroll');
    } else {
        DOM.sidebar.classList.remove('open');
        DOM.sidebarOverlay.classList.remove('show');
    }
}

// 显示提示信息
function showToast(message, type = 'success') {
    // 检查DOM元素是否存在
    if (!DOM.toastElement || !DOM.toastMessage) return;
    
    DOM.toastMessage.textContent = message;
    
    // 根据类型设置图标
    const iconElement = DOM.toastElement.querySelector('.toast-content i');
    if (iconElement) {
        if (type === 'error') {
            iconElement.className = 'fas fa-exclamation-circle';
        } else {
            iconElement.className = 'fas fa-check-circle';
        }
    }
    
    // 显示提示
    DOM.toastElement.classList.add('show');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        DOM.toastElement.classList.remove('show');
    }, 3000);
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// 防抖函数 - 优化版本
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const context = this;
        const later = () => {
            clearTimeout(timeout);
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 应用防抖到搜索函数
const debouncedHandleSearch = debounce((searchTerm) => {
    AppState.currentSearchTerm = searchTerm;
    applyFiltersAndSort();
}, 300);

// 监听DOM加载完成
document.addEventListener('DOMContentLoaded', initApp);

