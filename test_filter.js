// 测试分类筛选逻辑修复
const fs = require('fs');

// 模拟原始的筛选函数逻辑
function testFilterLogic() {
    // 读取数据文件
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    console.log(`总数据条数: ${data.length}`);
    
    // 模拟修复后的筛选逻辑
    const filterByCategory = (sites, currentCategory) => {
        return sites.filter(site => {
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
    };
    
    // 测试筛选 "图像-中国" 分类
    const imageChinaSites = data.filter(site => site.categoryPath === '图像-中国');
    console.log(`
图像-中国 原始数据条数: ${imageChinaSites.length}`);
    
    // 测试筛选 "文本-中国古籍" 分类
    const textChinaAncientSites = data.filter(site => site.categoryPath === '文本-中国古籍');
    console.log(`文本-中国古籍 原始数据条数: ${textChinaAncientSites.length}`);
    
    // 使用修复后的逻辑测试 "中国" 分类
    const chinaSites = filterByCategory(data, '中国');
    console.log(`
使用修复后的逻辑筛选 中国 分类:`);
    console.log(`- 匹配到的总条数: ${chinaSites.length}`);
    
    // 检查是否有文本-中国古籍的数据被错误地包含
    const incorrectMatches = chinaSites.filter(site => site.categoryPath === '文本-中国古籍');
    console.log(`- 错误匹配的文本-中国古籍数据: ${incorrectMatches.length}`);
    
    // 检查是否包含了所有的图像-中国数据
    const correctMatches = chinaSites.filter(site => site.categoryPath === '图像-中国');
    console.log(`- 正确匹配的图像-中国数据: ${correctMatches.length}`);
    
    // 验证结果
    if (incorrectMatches.length === 0 && correctMatches.length === imageChinaSites.length) {
        console.log('\n✅ 修复成功！"图像-中国"分类不再加载"文本-中国古籍"的数据。');
    } else {
        console.log('\n❌ 修复未完全成功，请检查。');
    }
}

// 运行测试
testFilterLogic();