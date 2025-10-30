// 网站管理系统 - JavaScript核心功能

// 全局状态管理
const state = {
    sites: [],
    categories: [],
    currentEditId: null,
    currentCategory: null, // 当前选中的分类名称
    currentCategories: [], // 当前选中的分类集合（包括子分类）
    sortBy: null // 可以是 'name', 'level' 或 null（默认按时间）
};

// DOM元素缓存
const elements = {
    sitesGrid: document.getElementById('sites-grid'),
    emptyState: document.getElementById('empty-state'),
    addSiteBtn: document.getElementById('add-site-btn'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    reloadBtn: document.getElementById('reload-btn'),
    importInput: document.getElementById('import-input'),
    searchInput: document.getElementById('search-input'),
    siteModal: document.getElementById('site-modal'),
    deleteModal: document.getElementById('delete-modal'),
    modalTitle: document.getElementById('modal-title'),
    siteForm: document.getElementById('site-form'),
    siteTitle: document.getElementById('site-title'),
    siteUrl: document.getElementById('site-url'),
    siteDescription: document.getElementById('site-description'),
    siteCategory: document.getElementById('site-category'),
    siteTags: document.getElementById('site-tags'),
    siteLevel: document.getElementById('site-level'),
    // closeModal 已移除
    // cancelBtn 已移除
    saveBtn: document.getElementById('save-btn'),
    closeDeleteModal: document.getElementById('close-delete-modal'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    toast: document.getElementById('toast'),
    // 分类选择模态框元素
    categoryModal: document.getElementById('category-modal'),
    selectCategoryBtn: document.getElementById('select-category-btn'),
    categorySelector: document.getElementById('category-selector'),
    confirmCategoryBtn: document.getElementById('confirm-category-btn'),
    cancelCategoryBtn: document.getElementById('cancel-category-btn'),
    closeCategoryModal: document.getElementById('close-category-modal'),
    // 主题切换按钮
    themeToggle: document.getElementById('theme-toggle')
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
            { name: '在线百科', children: [{ name: '综合百科' }, { name: '历史' }, { name: '艺术史' }] },
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
                    { name: '出版社' },
                    { name: '宗教' },
                    { name: '下载资源' }
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
    
            { name: '视频', children: [{ name: '软件' }, { name: '官媒' }, { name: '资源' }] },
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
            { name: '艺术' },
            { name: '文化' },
            { name: '教育' },
            { name: '副业' }
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
    }
];

// 当前选择的分类路径
let currentSelectedCategoryPath = [];
let currentSelectedCategory = null;

// 初始化主题
function initTheme() {
    // 从localStorage获取主题偏好
    const savedTheme = localStorage.getItem('theme');
    
    // 如果有保存的主题，应用它
    if (savedTheme) {
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    } else {
        // 默认根据系统偏好设置
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-mode');
        }
    }
}

// 切换主题
function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    
    // 保存主题偏好到localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // 更新主题图标（可以在后续优化）
    const themeIcon = elements.themeToggle.querySelector('svg');
    if (isDarkMode) {
        // 可以更换为太阳图标，但保持现有图标简单
        elements.themeToggle.title = '切换到浅色模式';
    } else {
        elements.themeToggle.title = '切换到深色模式';
    }
}

// 初始化应用
async function init() {
    // 初始化主题
    initTheme();
    
    // 加载数据
    await loadData();
    
    // 渲染网站列表
    renderSites();
    
    // 绑定事件监听器
    bindEventListeners();
}

// 初始化汉堡菜单功能
function initHamburgerMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');
    
    if (menuToggle && navbar) {
        // 初始状态为收起
        if (window.innerWidth <= 768) {
            navbar.classList.add('collapsed');
        }
        
        // 汉堡菜单点击事件
        menuToggle.addEventListener('click', () => {
            navbar.classList.toggle('collapsed');
            menuToggle.classList.toggle('active');
        });
        
        // 监听窗口大小变化，在大屏幕时自动展开菜单
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navbar.classList.remove('collapsed');
                menuToggle.classList.remove('active');
            } else if (!menuToggle.classList.contains('active')) {
                // 仅在小屏幕且菜单按钮未激活时收起菜单
                navbar.classList.add('collapsed');
            }
        });
    }
}

// 从本地存储加载数据
async function loadData(forceRefresh = false) {
    try {
        // 如果强制刷新或没有本地存储数据，则从JSON文件加载
        if (forceRefresh || !localStorage.getItem('siteManagerData')) {
            // 从JSON文件加载
            try {
                const response = await fetch('data.json');
                if (response.ok) {
                    const fileData = await response.json();
                    state.sites = fileData.sites || [];
                    updateCategories();
                    saveData(); // 将文件数据保存到localStorage
                    if (forceRefresh) {
                        showToast('数据已从文件重新加载', 'success');
                    }
                }
            } catch (error) {
                console.log('没有找到外部数据文件，使用空数据');
                if (forceRefresh) {
                    showToast('无法从文件加载数据', 'error');
                }
            }
        } else {
            // 从localStorage加载
            const savedData = localStorage.getItem('siteManagerData');
            const parsedData = JSON.parse(savedData);
            state.sites = parsedData.sites || [];
            
            // 提取所有唯一分类
            updateCategories();
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        showToast('加载数据失败', 'error');
    }
}

// 保存数据到本地存储
function saveData() {
    try {
        const dataToSave = {
            sites: state.sites,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('siteManagerData', JSON.stringify(dataToSave));
    } catch (error) {
        console.error('保存数据失败:', error);
        showToast('保存数据失败', 'error');
    }
}

// 更新分类列表（保留用于数据管理）
function updateCategories() {
    const categorySet = new Set();
    state.sites.forEach(site => {
        if (site.category) {
            categorySet.add(site.category);
        }
    });
    state.categories = Array.from(categorySet).sort();
}

// 渲染网站列表
function renderSites() {
    // 获取搜索条件
    const searchTerm = elements.searchInput.value.toLowerCase();
    
    // 过滤网站
    let filteredSites = state.sites;
    
    // 按分类过滤
    if (state.currentCategories && state.currentCategories.length > 0) {
        filteredSites = filteredSites.filter(site => 
            state.currentCategories.includes(site.category)
        );
    }
    
    // 按搜索词过滤
    if (searchTerm) {
        filteredSites = filteredSites.filter(site => 
            site.title.toLowerCase().includes(searchTerm) ||
            site.url.toLowerCase().includes(searchTerm) ||
            site.description.toLowerCase().includes(searchTerm) ||
            (site.tags && site.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    // 清空网格
    elements.sitesGrid.innerHTML = '';
    
    // 检查是否有网站
    if (filteredSites.length === 0) {
        elements.emptyState.style.display = 'flex';
        elements.sitesGrid.appendChild(elements.emptyState);
        return;
    }
    
    // 隐藏空状态
    elements.emptyState.style.display = 'none';
    
    // 根据当前排序方式排序
    if (state.sortBy === 'name') {
        // 按字母顺序排序
        filteredSites.sort((a, b) => a.title.localeCompare(b.title));
    } else if (state.sortBy === 'level') {
        // 按重要程度排序（非常重要 > 重要 > 一般）
        filteredSites.sort((a, b) => b.level - a.level);
    } else {
        // 默认按更新时间排序（最新的在前）
        filteredSites.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    
    // 渲染每个网站卡片
    filteredSites.forEach(site => {
        const card = createSiteCard(site);
        elements.sitesGrid.appendChild(card);
    });
}

// 创建网站卡片
function createSiteCard(site) {
    const card = document.createElement('div');
    card.className = 'site-card';
    card.dataset.id = site.id;
    
    // 格式化日期
    const formattedDate = new Date(site.updatedAt).toLocaleDateString('zh-CN');
    
    // 创建卡片内容 - 标题可点击跳转到URL
    card.innerHTML = `
        <div class="site-card-header">
            <div>
                <!-- 根据重要程度设置不同样式 -->
            <h3 class="site-title" data-url="${normalizeUrl(site.url)}" style="${site.level === 1 ? 'color: #999;' : site.level === 3 ? 'text-decoration: underline;' : ''}">${escapeHtml(site.title)}</h3>
                <!-- URL隐藏，通过标题点击跳转 -->
            </div>
            <div class="site-actions">
                <button class="action-btn edit-btn" title="编辑">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="action-btn delete-btn" title="删除">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        ${site.description ? `<p class="site-description">${escapeHtml(site.description)}</p>` : ''}
        
        ${site.tags && site.tags.length > 0 ? `
            <div class="tags">
                ${site.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        ` : ''}
        
        <div class="site-meta">
            <!-- 隐藏分类和日期显示 -->
        </div>
    `;
    
    // 绑定标题点击跳转事件
    const titleElement = card.querySelector('.site-title');
    titleElement.addEventListener('click', (e) => {
        // 如果点击的是编辑按钮区域，则不执行跳转
        if (e.target.closest('.site-actions')) return;
        const url = titleElement.getAttribute('data-url');
        if (url) {
            window.open(url, '_blank');
        }
    });
    
    // 绑定卡片按钮事件
    card.querySelector('.edit-btn').addEventListener('click', () => editSite(site.id));
    card.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(site.id));
    
    return card;
}

// 渲染分类过滤器函数已移除，因为分类过滤功能已删除

// 打开添加网站模态框
function openAddModal() {
    state.currentEditId = null;
    // 模态框标题已移除
    resetForm();
    // 自动设置分类为当前选中的分类
    if (state.currentCategory) {
        elements.siteCategory.value = state.currentCategory;
    } else {
        elements.siteCategory.value = '';
    }
    elements.siteModal.style.display = 'flex';
    elements.siteTitle.focus();
}

// 打开分类选择模态框
function openCategoryModal() {
    // 重置选择状态
    currentSelectedCategoryPath = [];
    currentSelectedCategory = null;
    
    // 生成分类选择器
    generateCategorySelector();
    
    // 显示模态框
    elements.categoryModal.style.display = 'flex';
}

// 生成分类选择器
function generateCategorySelector() {
    const selector = elements.categorySelector;
    selector.innerHTML = '';
    
    // 显示当前选择路径
    const pathDisplay = document.createElement('div');
    pathDisplay.className = 'category-path';
    pathDisplay.textContent = currentSelectedCategoryPath.length > 0 
        ? currentSelectedCategoryPath.join(' > ') 
        : '请选择分类';
    selector.appendChild(pathDisplay);
    
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
        
        currentLevel.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.textContent = category.name;
            
            // 检查是否是叶子节点
            if (!category.children || category.children.length === 0) {
                // 叶子节点可以直接选择
                categoryItem.addEventListener('click', () => {
                    currentSelectedCategory = category.name;
                    currentSelectedCategoryPath.push(category.name);
                    generateCategorySelector();
                });
            } else {
                // 非叶子节点可以继续下钻
                categoryItem.classList.add('category-parent');
                categoryItem.addEventListener('click', () => {
                    currentSelectedCategoryPath.push(category.name);
                    generateCategorySelector();
                });
            }
            
            categoryList.appendChild(categoryItem);
        });
        
        selector.appendChild(categoryList);
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
            generateCategorySelector();
        });
        selector.appendChild(backBtn);
    }
}

// 确认选择分类
function confirmCategorySelection() {
    if (currentSelectedCategory) {
        elements.siteCategory.value = currentSelectedCategory;
        closeCategoryModal();
    } else {
        showToast('请选择一个有效的分类', 'error');
    }
}

// 关闭分类选择模态框
function closeCategoryModal() {
    elements.categoryModal.style.display = 'none';
    currentSelectedCategoryPath = [];
    currentSelectedCategory = null;
}

// 打开编辑网站模态框
function editSite(id) {
    const site = state.sites.find(s => s.id === id);
    if (!site) return;
    
    state.currentEditId = id;
    // 模态框标题已移除
    
    // 填充表单
    elements.siteTitle.value = site.title;
    elements.siteUrl.value = site.url;
    elements.siteDescription.value = site.description || '';
    elements.siteCategory.value = site.category;
    elements.siteTags.value = site.tags ? site.tags.join(', ') : '';
    elements.siteLevel.value = site.level.toString();
    
    elements.siteModal.style.display = 'flex';
    elements.siteTitle.focus();
}

// 打开删除确认模态框
function openDeleteModal(id) {
    state.currentEditId = id;
    elements.deleteModal.style.display = 'flex';
}

// 关闭模态框
function closeModal() {
    elements.siteModal.style.display = 'none';
    resetForm();
    state.currentEditId = null;
}

// 关闭删除模态框
function closeDeleteModal() {
    elements.deleteModal.style.display = 'none';
    state.currentEditId = null;
}

// 关闭所有模态框
function closeModals() {
    closeModal();
    closeDeleteModal();
}

// 重置表单
function resetForm() {
    elements.siteForm.reset();
}

// 保存网站信息并自动关闭模态框
async function saveSite() {
    // 获取表单数据
    const title = elements.siteTitle.value.trim();
    const url = normalizeUrl(elements.siteUrl.value.trim());
    const description = elements.siteDescription.value.trim();
    const category = elements.siteCategory.value.trim();
    const tags = elements.siteTags.value.trim() 
        ? elements.siteTags.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
        : [];
    // 获取表单中选择的重要程度，如果未选择则默认为重要（2）
    const level = parseInt(elements.siteLevel.value) || 2;
    
    // 基本验证
    if (!title || !url || !category) {
        showToast('请填写必填字段', 'error');
        return;
    }
    
    const now = new Date().toISOString();
    
    if (state.currentEditId) {
        // 编辑现有网站
        const index = state.sites.findIndex(s => s.id === state.currentEditId);
        if (index !== -1) {
            state.sites[index] = {
                ...state.sites[index],
                title,
                url,
                description,
                category,
                tags,
                level,
                updatedAt: now
            };
            showToast('网站更新成功', 'success');
        }
    } else {
        // 检查URL是否重复
        const isUrlExists = state.sites.some(site => site.url === url);
        if (isUrlExists) {
            showToast('该网站URL已存在，请使用不同的URL', 'error');
            return;
        }
        
        // 添加新网站
        const newSite = {
            id: Date.now(),
            title,
            url,
            description,
            category,
            tags,
            level,
            createdAt: now,
            updatedAt: now
        };
        state.sites.push(newSite);
        showToast('网站添加成功', 'success');
    }
    
    // 更新分类并保存数据
    updateCategories();
    saveData();
    
    // 更新UI
    renderSites();
    closeModals();
}

// 删除网站
function deleteSite() {
    if (!state.currentEditId) return;
    
    state.sites = state.sites.filter(site => site.id !== state.currentEditId);
    
    // 更新分类并保存数据
    updateCategories();
    saveData();
    
    // 更新UI
    renderSites();
    closeModals();
    
    showToast('网站已删除', 'success');
}

// 导出数据
function exportData() {
    try {
        const dataToExport = {
            sites: state.sites,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `site-manager-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        showToast('数据导出成功', 'success');
    } catch (error) {
        console.error('导出数据失败:', error);
        showToast('导出数据失败', 'error');
    }
}

// 导入数据
function importData() {
    elements.importInput.click();
}

// 处理文件导入
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.sites && Array.isArray(importedData.sites)) {
                // 合并导入的数据（可以选择替换或合并）
                state.sites = [...state.sites, ...importedData.sites];
                
                // 去重（基于URL）
                const uniqueUrls = new Set();
                state.sites = state.sites.filter(site => {
                    const normalizedUrl = normalizeUrl(site.url);
                    if (uniqueUrls.has(normalizedUrl)) {
                        return false;
                    }
                    uniqueUrls.add(normalizedUrl);
                    return true;
                });
                
                // 更新分类并保存数据
                updateCategories();
                saveData();
                
                // 更新UI
                renderSites();
                
                showToast(`成功导入 ${importedData.sites.length} 个网站`, 'success');
            } else {
                throw new Error('无效的数据格式');
            }
        } catch (error) {
            console.error('导入数据失败:', error);
            showToast('导入数据失败，请检查文件格式', 'error');
        }
    };
    reader.readAsText(file);
    
    // 清空文件输入以允许重新选择相同的文件
    elements.importInput.value = '';
}

// 显示提示消息
function showToast(message, type = 'info') {
    const toast = elements.toast;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    // 添加显示类
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 3秒后自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 从文件重新加载数据
async function reloadDataFromFile() {
    await loadData(true);
    renderSites();
}

// 绑定所有事件监听器
function bindEventListeners() {
    // 排序下拉菜单项点击事件
    document.querySelectorAll('.dropdown-item[data-sort]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sortType = this.getAttribute('data-sort');
            
            // 如果已经按该类型排序，则取消排序
            if (state.sortBy === sortType) {
                state.sortBy = null;
                // 移除所有排序选项的活动状态
                document.querySelectorAll('.dropdown-item[data-sort]').forEach(option => {
                    option.classList.remove('active');
                });
            } else {
                state.sortBy = sortType;
                // 设置当前选项为活动状态，移除其他选项的活动状态
                document.querySelectorAll('.dropdown-item[data-sort]').forEach(option => {
                    if (option.getAttribute('data-sort') === sortType) {
                        option.classList.add('active');
                    } else {
                        option.classList.remove('active');
                    }
                });
            }
            renderSites();
        });
    })
    

    // 按钮点击事件
    elements.addSiteBtn.addEventListener('click', openAddModal);
    elements.exportBtn.addEventListener('click', exportData);
    elements.importBtn.addEventListener('click', importData);
    elements.importInput.addEventListener('change', handleFileImport);
    
    // 重新加载数据按钮事件
    if (elements.reloadBtn) {
        elements.reloadBtn.addEventListener('click', reloadDataFromFile);
    }
    
    // 分类选择事件
    if (elements.selectCategoryBtn) {
        elements.selectCategoryBtn.addEventListener('click', openCategoryModal);
    }
    if (elements.confirmCategoryBtn) {
        elements.confirmCategoryBtn.addEventListener('click', confirmCategorySelection);
    }
    if (elements.cancelCategoryBtn) {
        elements.cancelCategoryBtn.addEventListener('click', closeCategoryModal);
    }
    if (elements.closeCategoryModal) {
        elements.closeCategoryModal.addEventListener('click', closeCategoryModal);
    }
    
    // 下拉菜单点击事件处理
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            // 阻止事件冒泡，避免触发父级下拉菜单的关闭
            e.stopPropagation();
            
            const dropdown = this.closest('.dropdown');
            const content = dropdown.querySelector('.dropdown-content');
            const isCurrentlyOpen = content.classList.contains('show');
            
            // 先关闭所有已打开的下拉菜单
            document.querySelectorAll('.dropdown-content.show').forEach(openContent => {
                // 不关闭当前菜单，稍后再处理它的状态
                if (openContent !== content) {
                    openContent.classList.remove('show');
                }
            });
            
            // 切换当前下拉菜单的显示状态
            if (isCurrentlyOpen) {
                content.classList.remove('show');
            } else {
                content.classList.add('show');
            }
        });
    });
    
    // 为嵌套下拉菜单专门添加事件处理
    document.querySelectorAll('.dropdown-nested > .dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('mouseenter', function() {
            const dropdown = this.closest('.dropdown');
            const content = dropdown.querySelector('.dropdown-content');
            if (content && !content.classList.contains('show')) {
                content.classList.add('show');
            }
        });
    });
    
    // 查找指定分类的所有子分类（递归）
function findAllSubcategories(categoryName) {
    const result = [categoryName]; // 包含自身
    
    // 递归查找所有子分类
    function findChildren(categories) {
        for (const cat of categories) {
            if (cat.name === categoryName && cat.children) {
                // 找到指定分类，收集其所有子分类
                collectSubcategories(cat.children);
                return;
            }
            if (cat.children) {
                findChildren(cat.children);
            }
        }
    }
    
    function collectSubcategories(categories) {
        for (const cat of categories) {
            result.push(cat.name);
            if (cat.children) {
                collectSubcategories(cat.children);
            }
        }
    }
    
    findChildren(categoryHierarchy);
    return result;
}

// 图像分类点击事件
document.querySelectorAll('.dropdown-item[data-category]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 获取分类名称
            const category = this.getAttribute('data-category');
            
            // 设置当前分类（再次点击取消选择）
            if (state.currentCategory === category) {
                state.currentCategory = null;
                state.currentCategories = [];
                this.style.fontWeight = 'normal';
                this.style.color = '';
            } else {
                // 重置其他分类的样式
                document.querySelectorAll('.dropdown-item[data-category]').forEach(other => {
                    other.style.fontWeight = 'normal';
                    other.style.color = '';
                });
                
                // 设置选中状态
                state.currentCategory = category;
                // 查找所有相关分类（包括子分类）
                state.currentCategories = findAllSubcategories(category);
                this.style.fontWeight = '600';
                this.style.color = 'var(--highlight-color)';
            }
            
            // 重新渲染网站列表
            renderSites();
            
            // 关闭下拉菜单
            document.querySelectorAll('.dropdown-content').forEach(content => {
                content.classList.remove('show');
            });
        });
    });
    
    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', function(e) {
        // 如果点击的不是下拉菜单内部元素，关闭所有下拉菜单
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(content => {
                content.classList.remove('show');
            });
        }
    });
    
    // 鼠标离开时自动关闭嵌套菜单
    document.querySelectorAll('.dropdown-nested').forEach(nestedDropdown => {
        nestedDropdown.addEventListener('mouseleave', function() {
            const content = this.querySelector('.dropdown-content');
            if (content) {
                // 稍微延迟关闭，给用户一点时间移动鼠标
                setTimeout(() => {
                    content.classList.remove('show');
                }, 200);
            }
        });
    });
    
    // 为下拉菜单项添加样式，表明它有子菜单
      document.querySelectorAll('.dropdown-nested > .dropdown-toggle').forEach(toggle => {
          // 确保样式正确应用
          toggle.style.position = 'relative';
          toggle.style.paddingRight = '24px'; // 为右侧箭头留出空间
          
          // 检查是否已经添加了箭头，避免重复添加
          if (!toggle.querySelector('span')) {
              toggle.innerHTML += ' <span style="position: absolute; right: 8px;">▶</span>';
          }
      });
    
    // 关闭模态框相关事件已移除
    elements.saveBtn.addEventListener('click', saveSite);
    
    // 删除模态框事件
    elements.closeDeleteModal.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    // 确认删除按钮事件 - 已确保会自动关闭弹窗
    elements.confirmDeleteBtn.addEventListener('click', deleteSite);
    
    // 表单提交事件
    elements.siteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveSite();
    });
    
    // 搜索事件 - 增强搜索功能
    elements.searchInput.addEventListener('input', debounce(renderSites, 300));
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            renderSites();
        }
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === elements.siteModal || e.target === elements.deleteModal) {
            closeModals();
        }
    });
    
    // ESC键关闭模态框
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModals();
        }
    });
    
    // URL输入验证
    elements.siteUrl.addEventListener('input', function() {
        this.value = this.value.trim();
        if (this.value && !this.value.startsWith('http://') && !this.value.startsWith('https://')) {
            this.value = 'https://' + this.value;
        }
    });
    
    // 主题切换事件
    elements.themeToggle.addEventListener('click', toggleTheme);
}

// 防抖函数 - 优化搜索性能
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 辅助函数：转义HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 辅助函数：格式化URL显示
function formatUrl(url) {
    // 移除协议和可能的www
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

// 辅助函数：标准化URL
function normalizeUrl(url) {
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = 'https://' + normalized;
    }
    return normalized;
}

// 辅助函数：获取重要程度文本
function getLevelText(level) {
    const levels = {
        1: '一般',
        2: '重要',
        3: '非常重要'
    };
    return levels[level] || '一般';
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // 初始化汉堡菜单
    initHamburgerMenu();
});
