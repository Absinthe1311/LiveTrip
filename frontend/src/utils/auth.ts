// 认证工具
export function getUserId(): string | null {
  // 从 localStorage 获取用户 ID
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id || user.userId || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}
