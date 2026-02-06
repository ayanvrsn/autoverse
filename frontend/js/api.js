const API_BASE_URL =
    window.location.origin && window.location.origin !== 'null'
        ? `${window.location.origin}/api`
        : 'http://localhost:3003/api';

const Auth = {
    getToken() {
        return localStorage.getItem('token');
    },

    setToken(token) {
        localStorage.setItem('token', token);
    },

    removeToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        const token = this.getToken();
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (e) {
            return null;
        }
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'ADMIN';
    },

    logout() {
        this.removeToken();
        window.location.href = '/frontend/login.html';
    }
};

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = Auth.getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

const AuthAPI = {
    getGoogleLoginUrl() {
        return `${API_BASE_URL}/auth/google?source=frontend`;
    },

    async login(email, password) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            Auth.setToken(data.token);
            Auth.setUser(data.user);
        }
        return data;
    },

    async register(email, password) {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            Auth.setToken(data.token);
            Auth.setUser(data.user);
        }
        return data;
    },

    async getMe() {
        return apiRequest('/auth/me');
    },

    async setPassword(password) {
        return apiRequest('/auth/set-password', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
    },

    async getUsers() {
        return apiRequest('/auth/users');
    },

    async resendVerification(email) {
        return apiRequest('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    async deleteUser(id) {
        return apiRequest(`/auth/users/${id}`, {
            method: 'DELETE'
        });
    }
};

const CarsAPI = {
    async getAll() {
        return apiRequest('/cars');
    },

    async getById(id) {
        return apiRequest(`/cars/${id}`);
    },

    async getConfigs(carId) {
        return apiRequest(`/cars/${carId}/configs`);
    },

    async create(carData) {
        return apiRequest('/cars', {
            method: 'POST',
            body: JSON.stringify(carData)
        });
    },

    async update(id, carData) {
        return apiRequest(`/cars/${id}`, {
            method: 'PUT',
            body: JSON.stringify(carData)
        });
    },

    async delete(id) {
        return apiRequest(`/cars/${id}`, {
            method: 'DELETE'
        });
    }
};

const ConfigAPI = {
    async getAll() {
        return apiRequest('/configs');
    },

    async getById(id) {
        return apiRequest(`/configs/${id}`);
    },

    async create(configData) {
        return apiRequest('/configs', {
            method: 'POST',
            body: JSON.stringify(configData)
        });
    },

    async update(id, configData) {
        return apiRequest(`/configs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(configData)
        });
    },

    async delete(id) {
        return apiRequest(`/configs/${id}`, {
            method: 'DELETE'
        });
    }
};

const CartAPI = {
    async get() {
        return apiRequest('/cart');
    },

    async addItem(carId, configurationId) {
        return apiRequest('/cart', {
            method: 'POST',
            body: JSON.stringify({ carId, configurationId })
        });
    },

    async removeItem(itemIndex) {
        return apiRequest(`/cart/item/${itemIndex}`, {
            method: 'DELETE'
        });
    },

    async clear() {
        return apiRequest('/cart', {
            method: 'DELETE'
        });
    }
};

const OrdersAPI = {
    async getAll() {
        return apiRequest('/orders');
    },

    async getById(id) {
        return apiRequest(`/orders/${id}`);
    },

    async create() {
        return apiRequest('/orders', {
            method: 'POST'
        });
    },

    async createStripeCheckoutSession() {
        return apiRequest('/orders/checkout/session', {
            method: 'POST'
        });
    },

    async confirmStripeSession(sessionId) {
        return apiRequest('/orders/checkout/confirm', {
            method: 'POST',
            body: JSON.stringify({ sessionId })
        });
    },

    async getAllAdmin() {
        return apiRequest('/orders/admin/all');
    },

    async getSalesByDay(from, to) {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const query = params.toString();
        return apiRequest(`/orders/admin/sales${query ? `?${query}` : ''}`);
    },

    async updateStatus(id, status) {
        return apiRequest(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }
};

const UI = {
    showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showLoading(container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    },

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(price);
    },

    escapeHtml(value) {
        const str = String(value ?? '');
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, (ch) => map[ch]);
    },

    renderOrderItems(items, { showPrice = true } = {}) {
        if (!Array.isArray(items) || items.length === 0) {
            return '<span class="text-gray">No items</span>';
        }

        return `
            <div class="order-items">
                ${items.map((item) => {
                    const car = item?.carId;
                    const config = item?.configurationId;
                    const carLabel = (!car || typeof car === 'string')
                        ? 'Unknown car'
                        : ([car.brand, car.model, car.year].filter(Boolean).join(' ') || 'Unknown car');
                    const configLabel = (!config || typeof config === 'string' || !config?.name)
                        ? null
                        : String(config.name);
                    const priceLabel = typeof item?.price === 'number' ? this.formatPrice(item.price) : null;

                    return `
                        <div class="order-item-row">
                            <span class="order-item-title">${this.escapeHtml(carLabel)}</span>
                            ${configLabel ? `<span class="badge">${this.escapeHtml(configLabel)}</span>` : ''}
                            ${showPrice && priceLabel ? `<span class="order-item-price">${this.escapeHtml(priceLabel)}</span>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    async updateCartBadge() {
        const badge = document.querySelector('.cart-badge');
        if (!badge || !Auth.isLoggedIn()) return;
        
        try {
            const cart = await CartAPI.get();
            const count = cart.items ? cart.items.length : 0;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        } catch (e) {
            badge.style.display = 'none';
        }
    },

    requireAuth() {
        if (!Auth.isLoggedIn()) {
            window.location.href = '/frontend/login.html';
            return false;
        }
        return true;
    },

    requireAdmin() {
        if (!Auth.isAdmin()) {
            window.location.href = '/frontend/catalog.html';
            return false;
        }
        return true;
    },

    updateNav() {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        
        if (Auth.isLoggedIn()) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            
            const adminLink = document.querySelector('.admin-link');
            if (adminLink) {
                adminLink.style.display = Auth.isAdmin() ? 'block' : 'none';
            }

            this.updateCartBadge();
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.updateNav();

    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.navbar-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
});
