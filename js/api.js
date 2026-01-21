// --- 配置区域 ---
const OWNER = "kazamataneri-love";  // 你的 GitHub 用户名
const REPO = "my-blog-web";         // 你的仓库名
const BRANCH = "main";              // 分支名 (通常是 main 或 master)

// 公共前缀
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

// --- 1. 获取文章列表 (posts 目录) ---
export async function listPosts() {
    const res = await fetch(`${API_BASE}/contents/posts`);
    if (!res.ok) throw new Error("无法获取文章列表");
    return await res.json();
}

// --- 2. 获取单篇文章内容 ---
export async function getPost(filename) {
    // 加上时间戳防止缓存
    const res = await fetch(`${RAW_BASE}/posts/${filename}?t=${new Date().getTime()}`);
    if (!res.ok) throw new Error("文章不存在或读取失败");
    return await res.text();
}

// --- 3. 保存文章 (新建或更新) ---
export async function savePost(filename, content, token) {
    const url = `${API_BASE}/contents/posts/${filename}`;
    
    // 先检查文件是否存在 (为了获取 sha 进行更新)
    let sha = null;
    try {
        const checkRes = await fetch(url);
        if (checkRes.ok) {
            const data = await checkRes.json();
            sha = data.sha;
        }
    } catch (e) { /* 文件不存在，sha 为 null */ }

    //以此构建请求体
    const body = {
        message: `Update post: ${filename}`,
        content: btoa(unescape(encodeURIComponent(content))), // UTF-8 Base64 编码
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "保存失败");
    }
    return await res.json();
}

// --- 4. 上传图片 ---
export async function uploadImage(file, folderName, token) {
    // 读取文件为 Base64
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const content = await toBase64(file);
    const path = `images/${folderName}/${file.name}`;
    const url = `${API_BASE}/contents/${path}`;

    // 检查是否已存在 (获取 sha)
    let sha = null;
    try {
        const checkRes = await fetch(url);
        if (checkRes.ok) {
            const data = await checkRes.json();
            sha = data.sha;
        }
    } catch (e) {}

    const body = {
        message: `Upload image: ${file.name}`,
        content: content,
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error("图片上传失败");
    
    // 返回 GitHub Raw 链接
    return `${RAW_BASE}/${path}`;
}

// --- 5. 列出目录 (用于插入文件) ---
export async function listDir(path = "") {
    const url = path ? `${API_BASE}/contents/${path}` : `${API_BASE}/contents`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("无法读取目录");
    return await res.json();
}

// --- 6. [关键修复] 强制文件下载 ---
export async function downloadFile(path) {
    // 1. 获取文件元数据 (为了拿到 download_url)
    const apiUrl = `${API_BASE}/contents/${path}`;
    const metaRes = await fetch(apiUrl);
    
    if (!metaRes.ok) throw new Error(`无法定位文件: ${path}`);
    const metaData = await metaRes.json();
    
    // 2. 请求文件二进制流
    const downloadUrl = metaData.download_url;
    const fileRes = await fetch(downloadUrl);
    
    if (!fileRes.ok) throw new Error("文件流下载失败");
    
    // 3. 转换为 Blob 并触发下载
    const blob = await fileRes.blob();
    const tempUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = tempUrl;
    a.download = metaData.name; // 使用 GitHub 上的原文件名
    
    document.body.appendChild(a);
    a.click();
    
    // 4. 清理
    window.URL.revokeObjectURL(tempUrl);
    document.body.removeChild(a);
}
