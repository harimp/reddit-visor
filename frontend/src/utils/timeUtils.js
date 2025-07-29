// Utility function to get relative time
export function getRelativeTime(timestamp) {
    const now = new Date();
    const postTime = new Date(timestamp * 1000);
    const diff = Math.floor((now - postTime) / 1000);
    
    if (diff < 60) {
        return `${diff}s ago`;
    } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `${minutes}m ago`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours}h ago`;
    } else if (diff < 2592000) { // 30 days
        const days = Math.floor(diff / 86400);
        return `${days}d ago`;
    } else if (diff < 31536000) { // 365 days
        const months = Math.floor(diff / 2592000);
        return `${months}mo ago`;
    } else {
        const years = Math.floor(diff / 31536000);
        return `${years}y ago`;
    }
}
