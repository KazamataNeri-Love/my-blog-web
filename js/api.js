// 🔴 配置区：请修改为你的 GitHub 信息
const OWNER = "kazamataneri-love"; 
const REPO  = "my-blog-web"; 
const BRANCH = "main";

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

// 1. 获取文章列表
export async function listPosts() {
    const res = await fetch(`${API_BASE}/contents/posts`);
    if (!res.ok) return [];
    return await res.json();
}

// 2. 获取任意目录列表
export async function listDir(path = "") {
    const res = await fetch(`${API_BASE}/contents/${path}`);
    if (!res.ok) return [];
    return await res.json();
}

// 3. 获取文件内容
export async function getPost(filename) {
    const url = `${RAW_BASE}/posts/${filename}?t=${new Date().getTime()}`;
    const res = await fetch(url);
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

// 6. 自动生成文件名
export async function generateAutoFilename() {
    const now = new Date();
    const datePrefix = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const files = await listPosts();
    let maxIndex = 0;

    files.forEach(file => {
        if (file.name.startsWith(datePrefix + "-0x") && file.name.endsWith(".md")) {
            const part = file.name.replace(datePrefix + "-0x", "").replace(".md", "");
            const num = parseInt(part, 16);
            if (!isNaN(num) && num > maxIndex) maxIndex = num;
        }
    });

    const nextIndex = maxIndex + 1;
    const hexString = nextIndex.toString(16).padStart(4, '0');
    return `${datePrefix}-0x${hexString}.md`;
}

// 7. 上传图片 (支持指定子文件夹)
// folderName 例如: "2026-1-14-0x0001" (不带 .md)
export async function uploadImage(file, folderName, token) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const contentBase64 = reader.result.split(',')[1];
            // 构造路径: images/2026-1-14-0x0001/time-pic.png
            const filename = `${new Date().getTime()}-${file.name}`;
            const path = `images/${folderName}/${filename}`;
            
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
                // 返回图片的 Raw URL
                resolve(`${RAW_BASE}/${path}`);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = error => reject(error);
    });
}
