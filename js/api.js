// 🔴 请务必修改下面两行！
const OWNER = "kazamataneri-love";  // 例如 "kazamataneri-love"
const REPO  = "my-blog-web";           // 如果你仓库名叫 my-blog-web 就不用改

const BRANCH = "main";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

// 获取文章列表
export async function listPosts() {
    const url = `${API_BASE}/contents/posts`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
}

// 获取文章内容
export async function getPost(filename) {
    const url = `${RAW_BASE}/posts/${filename}`;
    const res = await fetch(url);
    return await res.text();
}

// 下载文件功能
export async function downloadFile(path) {
    const url = `${RAW_BASE}/${path}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("下载失败");
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = path.split('/').pop();
        link.click();
    } catch (e) {
        alert("下载出错: " + e.message);
    }
}

// 【新增】获取指定目录下的文件列表
// path 默认为空，表示根目录
export async function listDir(path = "") {
    const url = `${API_BASE}/contents/${path}`;
    const res = await fetch(url);
    if (!res.ok) return []; // 如果文件夹不存在或出错，返回空数组
    return await res.json();
}

// 保存文章 (需要 Token)
export async function savePost(filename, content, token) {
    // 1. 检查文件是否存在以获取 sha (用于更新)
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

    // 2. 准备发送的数据 (Base64编码解决中文乱码)
    // 这是一个简单的 UTF-8 转 Base64 的方法
    const contentEncoded = btoa(unescape(encodeURIComponent(content)));

    const body = {
        message: `Update ${filename}`,
        content: contentEncoded,
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    // 3. 发送 PUT 请求
    const res = await fetch(`${API_BASE}/contents/posts/${filename}`, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error("保存失败: " + await res.text());
}
