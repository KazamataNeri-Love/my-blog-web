// 🔴 配置区：请修改为你的 GitHub 信息
const OWNER = "kazamataneri-love"; 
const REPO  = "my-blog-web"; 
const BRANCH = "main";

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

// 1. 获取文章列表 (只读 posts 目录)
export async function listPosts() {
    const res = await fetch(`${API_BASE}/contents/posts`);
    if (!res.ok) return [];
    return await res.json();
}

// 2. 获取任意目录列表 (用于文件选择器)
export async function listDir(path = "") {
    const res = await fetch(`${API_BASE}/contents/${path}`);
    if (!res.ok) return [];
    return await res.json();
}

// 3. 获取文件内容 (文本)
export async function getPost(filename) {
    // 加上时间戳防止缓存
    const url = `${RAW_BASE}/posts/${filename}?t=${new Date().getTime()}`;
    const res = await fetch(url);
    return await res.text();
}

// 4. 通用下载/打开链接函数
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
        link.download = pathOrUrl.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        alert("下载出错: " + e.message);
    }
}

// 5. 保存/更新文章
export async function savePost(filename, content, token) {
    const contentEncoded = btoa(unescape(encodeURIComponent(content)));
    
    // 检查文件是否存在以获取 sha
    let sha = null;
    try {
        const check = await fetch(`${API_BASE}/contents/posts/${filename}`, {
            headers: { "Authorization": `token ${token}` }
        });
        if (check.ok) {
            const data = await check.json();
            sha = data.sha;
        }
    } catch (e) {}

    const body = {
        message: `Update ${filename}`,
        content: contentEncoded,
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${API_BASE}/contents/posts/${filename}`, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await res.text());
}

// 6. 自动生成文件名 (YYYY-M-D-0xXXXX.md)
export async function generateAutoFilename() {
    const now = new Date();
    // 格式: 2026-1-14
    const datePrefix = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    
    const files = await listPosts();
    let maxIndex = 0;

    files.forEach(file => {
        // 匹配开头如 "2026-1-14-0x" 且结尾是 ".md"
        if (file.name.startsWith(datePrefix + "-0x") && file.name.endsWith(".md")) {
            const part = file.name.replace(datePrefix + "-0x", "").replace(".md", "");
            const num = parseInt(part, 16); // 16进制转10进制
            if (!isNaN(num) && num > maxIndex) {
                maxIndex = num;
            }
        }
    });

    // 序号+1，转回16进制，补齐4位
    const nextIndex = maxIndex + 1;
    const hexString = nextIndex.toString(16).padStart(4, '0');

    return `${datePrefix}-0x${hexString}.md`;
}
