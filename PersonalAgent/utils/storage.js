const STORAGE_KEY = 'personal_data_ai_demo_store_v1';

function createDefaultStore() {
	return {
		roles: [],
		kbs: [],
		knowledgeItems: [],
		sessions: {},
		selectedRoleId: ''
	};
}

export function loadStore() {
	try {
		const raw = uni.getStorageSync(STORAGE_KEY);
		if (!raw) return createDefaultStore();
		const parsed = JSON.parse(raw);
		return {
			...createDefaultStore(),
			...parsed
		};
	} catch (error) {
		return createDefaultStore();
	}
}

export function saveStore(store) {
	uni.setStorageSync(STORAGE_KEY, JSON.stringify(store));
}

export function clearStore() {
	uni.removeStorageSync(STORAGE_KEY);
}

export function createId(prefix = 'id') {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
