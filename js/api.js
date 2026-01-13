// 🔴 配置区：请修改为你的 GitHub 信息
const OWNER = "kazamataneri-love"; 
const REPO  = "my-blog-web"; 
const BRANCH = "main";

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

// 1. 获取文章列表 (只读 posts 目录)
export async function listPosts() {
    // 加上时间戳防止缓存
    const res = await fetch(`${API_BASE}/contents/posts?t=${new Date().getTime()}`);
    if (!res.ok) return [];
    return await res.json();
}

// 2. 获取任意目录列表 (用于文件选择器)
export async function listDir(path = "") {
    const res = await fetch(`${API_BASE}/contents/${path}`);
    if (!res.ok) return [];
    return await res.json();
}

// 3. 获取文件内容
export async function getPost(filename) {
    // 处理中文文件名，确保 URL 编码正确
    const safeFilename = encodeURIComponent(filename);
    const url = `${RAW_BASE}/posts/${safeFilename}?t=${new Date().getTime()}`;
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
    // 仓库内文件下载
    const url = `${RAW_BASE}/${pathOrUrl}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("文件未找到");
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        // 解码文件名，防止下载下来是乱码
        link.download = decodeURIComponent(pathOrUrl.split('/').pop());
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        alert("下载出错: " + e.message);
    }
}

// 5. 保存/更新文章
export async function savePost(filename, content, token) {
    // Base64 编码 (处理中文内容)
    const contentEncoded = btoa(unescape(encodeURIComponent(content)));
    const safeFilename = encodeURIComponent(filename);
    
    // 检查文件是否存在以获取 sha (用于更新)
    let sha = null;
    try {
        const check = await fetch(`${API_BASE}/contents/posts/${safeFilename}`, {
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

    const res = await fetch(`${API_BASE}/contents/posts/${safeFilename}`, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(await res.text());
}

// 6. 上传图片 (存放至 images/日期-标题/xxx.png)
export async function uploadImage(file, folderName, token) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const contentBase64 = reader.result.split(',')[1];
            // 构造路径：images/2026-01-14-我的日记/时间戳-图片名.png
            const safeFolderName = encodeURIComponent(folderName); // 文件夹名可能含中文
            const filename = `${new Date().getTime()}-${file.name}`;
            const path = `images/${safeFolderName}/${filename}`;
            
            const body = {
                message: `Upload image to ${folderName}`,
                content: contentBase64,
                branch: BRANCH
            };

            try {
                // path 这里不需要再次 encode，因为路径中的斜杠不能被转义
                // 但是 folderName 作为路径一部分，如果是中文，GitHub API 通常能处理
                // 为了保险，我们在 URL 中拼接时最好小心，但 API_BASE/contents/ 会自动处理
                const res = await fetch(`${API_BASE}/contents/${path}`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                });

                if (!res.ok) throw new Error(await res.text());
                // 返回图片的 Raw CDN URL
                // 注意：这里要返回 encode 过的 URL 供 Markdown 使用
                const rawUrl = `${RAW_BASE}/images/${encodeURIComponent(folderName)}/${encodeURIComponent(filename)}`;
                resolve(rawUrl);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = error => reject(error);
    });
}
