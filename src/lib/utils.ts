import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: any): string {
  if (!date) return "N/A";
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(date: any): string {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}

export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context not available"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type || "image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function safeSetLocalStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === "QuotaExceededError" || e.code === 22 || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      console.warn("LocalStorage quota exceeded. Pruning oldest conversions...");
      
      const cachedRaw = localStorage.getItem("blueprint_conversions");
      if (cachedRaw) {
        try {
          const list = JSON.parse(cachedRaw);
          if (Array.isArray(list) && list.length > 0) {
            const oldest = list.pop();
            if (oldest && oldest.id) {
              localStorage.removeItem(`blueprint_conversion_${oldest.id}`);
              localStorage.setItem("blueprint_conversions", JSON.stringify(list));
              console.log(`Pruned oldest conversion: ${oldest.id}`);
              return safeSetLocalStorage(key, value);
            }
          }
        } catch (pruneError) {
          console.error("Failed to prune oldest conversion:", pruneError);
        }
      }
      
      console.warn("Force clearing all local conversions as last resort.");
      try {
        const cachedRaw = localStorage.getItem("blueprint_conversions");
        if (cachedRaw) {
          const list = JSON.parse(cachedRaw);
          if (Array.isArray(list)) {
            list.forEach(item => {
              if (item && item.id) {
                localStorage.removeItem(`blueprint_conversion_${item.id}`);
              }
            });
          }
        }
        localStorage.removeItem("blueprint_conversions");
        localStorage.setItem(key, value);
        return true;
      } catch (lastResortError) {
        console.error("Critical: LocalStorage is completely full and cannot be cleared:", lastResortError);
      }
    }
    return false;
  }
}

export function getCleanedConversions(): any[] {
  if (typeof window === "undefined") return [];
  const cachedRaw = localStorage.getItem("blueprint_conversions");
  if (!cachedRaw) return [];
  
  try {
    let list = JSON.parse(cachedRaw);
    if (!Array.isArray(list)) return [];
    
    let needsWrite = false;

    // Enforce max limit of 8 items to prevent any quota issues in demo/local mode
    if (list.length > 8) {
      const itemsToRemove = list.slice(8);
      itemsToRemove.forEach((item: any) => {
        if (item && item.id) {
          localStorage.removeItem(`blueprint_conversion_${item.id}`);
        }
      });
      list = list.slice(0, 8);
      needsWrite = true;
    }
    
    const cleanedList = list.map((item: any) => {
      if (!item) return null;
      if (item.generatedReactCode || item.generatedHtmlCode || item.generatedCssCode || item.detectedComponents || item.layoutDescription) {
        needsWrite = true;
        try {
          const individualKey = `blueprint_conversion_${item.id}`;
          if (!localStorage.getItem(individualKey)) {
            safeSetLocalStorage(individualKey, JSON.stringify(item));
          }
        } catch (e) {
          console.error(`Failed to migrate legacy conversion payload for ${item.id}:`, e);
        }
        
        return {
          id: item.id,
          title: item.title,
          outputMode: item.outputMode,
          createdAt: item.createdAt,
          status: item.status,
          cloudinaryUrl: item.cloudinaryUrl || item.cloudinaryPublicId,
          updatedAt: item.updatedAt,
        };
      }
      return item;
    }).filter(Boolean);
    
    if (needsWrite) {
      safeSetLocalStorage("blueprint_conversions", JSON.stringify(cleanedList));
    }
    return cleanedList;
  } catch (e) {
    console.error("Error cleaning localStorage conversions:", e);
    return [];
  }
}


