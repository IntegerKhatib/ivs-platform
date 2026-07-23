import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function initiateAssetUpload(payload) {
  const { data } = await api.post("/assets/uploads/initiate", payload);
  return data;
}

export async function getPartUploadUrls(assetId, uploadId, partNumbers) {
  const { data } = await api.post(`/assets/uploads/${assetId}/parts`, {
    uploadId,
    partNumbers,
  });
  return data;
}

export async function completeAssetUpload(assetId, uploadId, parts, metadata) {
  const { data } = await api.post(`/assets/uploads/${assetId}/complete`, {
    uploadId,
    parts,
    metadata,
  });
  return data;
}

export async function abortAssetUpload(assetId, uploadId) {
  await api.delete(`/assets/uploads/${assetId}`, {
    data: { uploadId },
  });
}

export async function listAssets(limit = 100) {
  const { data } = await api.get("/assets", { params: { limit } });
  return data.items || [];
}

export async function getAsset(assetId) {
  const { data } = await api.get(`/assets/${assetId}`);
  return data;
}

export async function uploadPart(url, blob, onProgress, signal) {
  const response = await axios.put(url, blob, {
    signal,
    headers: {
      "Content-Type": "application/octet-stream",
    },
    onUploadProgress: (event) => onProgress?.(event.loaded || 0),
  });

  const etag = response.headers.etag;
  if (!etag) {
    throw new Error(
      "Amazon S3 did not expose the ETag header. Check the bucket CORS configuration.",
    );
  }

  return etag.replaceAll('"', "");
}
