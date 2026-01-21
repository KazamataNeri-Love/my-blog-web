// 🔴 配置区：已更新为你的信息
const OWNER = "KazamataNeri-love"; 
const REPO  = "my-blog-web"; 
const BRANCH = "main";

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

// 1. 获取完整文件树 (递归，用于多级目录)
export async function fetchFileTree() {
    // 使用 Git Tree API 获取递归文件列表
    const res = await fetch(`${API_BASE}/git/trees/${BRANCH}?recursive=1&t=${new Date().getTime()}`);
    if (!res.ok) return [];
    const data = await res.json();
    // 过滤出 posts/ 开头的文件和文件夹
    return data.tree.filter(item => item.path.startsWith('posts/'));
}

// 2. 获取任意目录列表 (用于文件选择器)
export async function listDir(path = "") {
    const res = await fetch(`${API_BASE}/contents/${path}`);
    if (!res.ok) return [];
    return await res.json();
}

// 3. 获取文件内容 (支持完整路径)
export async function getPost(path) {
    // path 可能是 "posts/分类/文章.md"
    const safePath = path.split('/').map(encodeURIComponent).join('/');
    const url = `${RAW_BASE}/${safePath}?t=${new Date().getTime()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("文件不存在或无法访问");
    return await res.text();
}

// 4. 通用下载/打开链接
export async function downloadFile(pathOrUrl) {
    if (pathOrUrl.startsWith("http")) {
        window.open(pathOrUrl, "_blank");
        return;
    }
    const url = `${RAW_BASE}/${pathOrUrl}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("文件未找到");
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = decodeURIComponent(pathOrUrl.split('/').pop());
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        alert("下载出错: " + e.message);
    }
}

// 5. 保存/更新文章 (支持任意路径)
export async function savePost(fullPath, content, token) {
    // Base64 编码
    const contentEncoded = btoa(unescape(encodeURIComponent(content)));
    
    // 检查文件是否存在以获取 sha (用于更新)
    let sha = null;
    try {
        // API 需要逐级 encode，但不能 encode 斜杠
        // 简单处理：直接请求 API，API 通常能处理路径中的非 ASCII 字符，但最好 encodeURI
        const safePath = fullPath.split('/').map(encodeURIComponent).join('/');
        const check = await fetch(`${API_BASE}/contents/${safePath}`, {
            headers: { "Authorization": `token ${token}` }
        });
        if (check.ok) {
            const data = await check.json();
            sha = data.sha;
        }
    } catch (e) {}

    const body = {
        message: `Update ${fullPath}`,
        content: contentEncoded,
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    // 发送 PUT 请求
    // 注意：GitHub API 的 contents 接口要求路径参数
    const res = await fetch(`${API_BASE}/contents/${fullPath}`, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await res.text());
}

// 6. 上传图片 (保持原样)
export async function uploadImage(file, folderName, token) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const contentBase64 = reader.result.split(',')[1];
            const safeFolderName = encodeURIComponent(folderName);
            const filename = `${new Date().getTime()}-${file.name}`;
            const path = `images/${safeFolderName}/${filename}`;
            
            const body = {
                message: `Upload image to ${folderName}`,
                content: contentBase64,
                branch: BRANCH
            };

            try {
                const res = await fetch(`${API_BASE}/contents/${path}`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                });

                if (!res.ok) throw new Error(await res.text());
                const rawUrl = `${RAW_BASE}/images/${encodeURIComponent(folderName)}/${encodeURIComponent(filename)}`;
                resolve(rawUrl);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = error => reject(error);
    });
}
