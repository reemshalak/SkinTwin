// One-off check of the YouCam Skin Analysis API (SD, all 16 concerns = 16 units).
// Usage: node --env-file=.env scripts/spike-skin.mjs path/to/face.jpg
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, extname } from "node:path";

const BASE = "https://yce-api-01.makeupar.com";
const KEY = process.env.YOUCAM_API_KEY;
const imgPath = process.argv[2];
if (!KEY) throw new Error("YOUCAM_API_KEY missing");
if (!imgPath) throw new Error("Pass an image path");

const SD_ACTIONS = [
  "wrinkle", "droopy_upper_eyelid", "droopy_lower_eyelid", "firmness", "acne",
  "moisture", "eye_bag", "dark_circle_v2", "age_spot", "radiance", "redness",
  "oiliness", "pore", "texture", "tear_trough", "skin_type",
];

const auth = { Authorization: `Bearer ${KEY}` };

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...auth, ...(body && { "Content-Type": "application/json" }) },
    body: body && JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

const bytes = await readFile(imgPath);
const contentType = extname(imgPath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";

const file = await api("POST", "/s2s/v2.0/file", {
  files: [{ content_type: contentType, file_name: basename(imgPath), file_size: bytes.length }],
});
const { file_id, requests } = file.data.files[0];
const put = requests[0];
const up = await fetch(put.url, { method: put.method || "PUT", headers: put.headers, body: bytes });
if (!up.ok) throw new Error(`upload -> ${up.status}`);
console.log("uploaded", file_id);

const task = await api("POST", "/s2s/v2.0/task/skin-analysis", {
  src_file_id: file_id,
  dst_actions: SD_ACTIONS,
  format: "json",
});
const taskId = task.data.task_id;
console.log("task", taskId);

let result;
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  result = await api("GET", `/s2s/v2.0/task/skin-analysis/${taskId}`);
  const status = result.data?.task_status;
  console.log("status", status);
  if (status === "success" || status === "error") break;
}

await mkdir("spike-output", { recursive: true });
await writeFile("spike-output/skin-analysis.json", JSON.stringify(result, null, 2));
console.log("saved spike-output/skin-analysis.json");
