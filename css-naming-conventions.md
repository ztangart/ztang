# CSS 命名约定

## 1. 命名规范

### 采用 BEM 命名规范

**BEM** (Block-Element-Modifier) 是一种流行的CSS命名方法论，它可以帮助我们：
- 提高代码的可读性
- 减少样式冲突
- 增强代码的可维护性

### BEM 命名格式

```css
/* 块（Block）- 独立的、可重用的组件 */
.block {}

/* 元素（Element）- 块的一部分，不能独立使用 */
.block__element {}

/* 修饰符（Modifier）- 改变块或元素的状态或外观 */
.block--modifier {}
.block__element--modifier {}
```

## 2. 项目特定命名约定

### 常用组件命名

| 组件类型 | 命名模式 | 示例 |
|---------|---------|------|
| 模态框 | `modal-[purpose]` | `modal-add`, `modal-edit`, `modal-confirm` |
| 表单 | `form-[purpose]` | `form-login`, `form-search` |
| 按钮 | `btn-[type]-[size]` | `btn-primary-large`, `btn-secondary-small` |
| 输入框 | `input-[type]` | `input-text`, `input-email` |
| 卡片 | `card-[type]` | `card-feature`, `card-article` |

### 状态命名

| 状态 | 前缀/后缀 | 示例 |
|------|-----------|------|
| 悬停 | `--hover` | `btn--hover` |
| 激活 | `--active` | `menu__item--active` |
| 禁用 | `--disabled` | `input--disabled` |
| 成功 | `--success` | `alert--success` |
| 错误 | `--error` | `input--error` |

## 3. 代码风格约定

### 选择器

- 使用类选择器，避免使用ID选择器
- 避免使用通用选择器（`*`）
- 避免过度嵌套，最多嵌套2-3层

### 属性顺序

按以下顺序组织CSS属性：

1. 布局属性（position, float, display, etc.）
2. 盒模型属性（width, height, margin, padding, etc.）
3. 视觉属性（color, background, border, etc.）
4. 字体属性（font, text-align, line-height, etc.）
5. 其他属性

### 注释

- 为每个组件添加注释说明
- 对复杂的样式逻辑添加解释
- 使用统一的注释格式

## 4. 避免重复定义

- 定期审查样式表，删除重复的选择器
- 对于可复用的样式，使用共享类
- 使用CSS变量定义主题颜色和间距

## 5. 示例

```css
/* 模态框组件 */
.modal {
  /* 布局属性 */
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  
  /* 盒模型属性 */
  width: 90%;
  max-width: 500px;
  padding: 24px;
  
  /* 视觉属性 */
  background-color: #333333;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

/* 模态框标题 */
.modal__title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

/* 模态框表单 */
.modal__form {
  /* 样式 */
}

/* 表单组 */
.form-group {
  margin-bottom: 16px;
}

/* 表单标签 */
.form-group__label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #ffffff;
}

/* 表单输入框 */
.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #666666;
  border-radius: 4px;
  font-size: 14px;
  color: #ffffff;
  background-color: #444444;
}

/* 按钮 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* 主按钮 */
.btn--primary {
  background-color: #007bff;
  color: #ffffff;
}

/* 取消按钮 */
.btn--cancel {
  background-color: #6c757d;
  color: #ffffff;
}
```