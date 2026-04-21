<template>
	<view class="page" :style="{ height: windowHeightPx }">
		<view class="layout">
			<view v-if="!isMobile" class="sidebar-wrap" :class="{ collapsed: sidebarCollapsed }">
				<AgentSidebar
					:roles="roles"
					:selected-role-id="selectedRoleId"
					:collapsed="sidebarCollapsed"
					@create="openCreateRole"
					@edit="openEditRole"
					@delete="deleteRole"
					@select="selectRole"
					@toggle-collapse="onSidebarToggleCollapse"
				/>
			</view>
			<view class="chat-wrap">
				<view class="chat-shell">
					<ChatWindow
						:is-mobile="isMobile"
						:show-kb-button="isMobile"
						:show-clear-in-header="!isMobile"
						:show-clear-in-composer="false"
						:has-messages="currentMessages.length > 0"
						:selected-role="selectedRole"
						:messages="currentMessages"
						:input-text="inputText"
						@toggle-sidebar="openMobileSidebar"
						@open-kb="openKbPanel"
						@open-settings="openChatSettings"
						@clear-session="clearCurrentSession"
						@update:inputText="inputText = $event"
						@send="sendMessage"
					/>
				</view>
			</view>
			<view
				v-if="!isMobile"
				class="kb-wrap"
				:class="{ open: kbPanelVisible, collapsed: kbPanelVisible && kbPanelCollapsed }"
			>
				<view v-if="!kbPanelVisible" class="kb-dock">
					<button class="kb-dock-btn" size="mini" @click="openKbPanel">
						<uni-icons type="left" size="14" color="#2f6dff"></uni-icons>
					</button>
				</view>
				<KnowledgeBasePanel
					v-else
					:visible="true"
					:is-mobile="false"
					:inline="true"
					:collapsed="kbPanelCollapsed"
					:kbs="kbs"
					:knowledge-items="knowledgeItems"
					@close="closeKbPanel"
					@toggle-collapse="onKbPanelToggleCollapse"
					@create-kb="createKb"
					@update-kb="updateKb"
					@delete-kb="deleteKb"
					@add-item="addKnowledgeItem"
					@update-item="updateKnowledgeItem"
					@delete-item="deleteKnowledgeItem"
				/>
			</view>
		</view>

		<view v-if="isMobile" class="mobile-sidebar-overlay" :class="{ active: mobileSidebarVisible }" @click="closeMobileSidebar">
			<view class="mobile-sidebar" :class="{ collapsed: sidebarCollapsed }" @click.stop>
				<AgentSidebar
					:roles="roles"
					:selected-role-id="selectedRoleId"
					:collapsed="sidebarCollapsed"
					@create="openCreateRole"
					@edit="openEditRole"
					@delete="deleteRole"
					@select="onMobileSelect"
					@toggle-collapse="onSidebarToggleCollapse"
				/>
			</view>
		</view>

		<AgentEditorModal
			:visible="roleEditorVisible"
			:mode="roleEditorMode"
			:value="editingRole"
			:kbs="kbs"
			@close="roleEditorVisible = false"
			@save="saveRole"
		/>

		<KnowledgeBasePanel
			:visible="isMobile && kbPanelVisible"
			:is-mobile="isMobile"
			:inline="false"
			:collapsed="kbPanelCollapsed"
			:kbs="kbs"
			:knowledge-items="knowledgeItems"
			@close="closeKbPanel"
			@toggle-collapse="onKbPanelToggleCollapse"
			@create-kb="createKb"
			@update-kb="updateKb"
			@delete-kb="deleteKb"
			@add-item="addKnowledgeItem"
			@update-item="updateKnowledgeItem"
			@delete-item="deleteKnowledgeItem"
		/>

		<view v-if="deleteRoleConfirmId" class="delete-role-overlay" @click.self="cancelDeleteRole">
			<view class="delete-role-dialog" @click.stop>
				<text class="delete-role-title">删除角色</text>
				<text class="delete-role-msg">删除后将移除此角色会话，是否继续？</text>
				<view class="delete-role-actions">
					<button class="delete-role-btn cancel" size="mini" @click="cancelDeleteRole">取消</button>
					<button class="delete-role-btn danger" size="mini" @click="confirmDeleteRole">删除</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import AgentSidebar from '@/components/AgentSidebar.vue';
import AgentEditorModal from '@/components/AgentEditorModal.vue';
import KnowledgeBasePanel from '@/components/KnowledgeBasePanel.vue';
import ChatWindow from '@/components/ChatWindow.vue';
import { buildMockReply } from '@/utils/mockChat';
import { createId, loadStore, saveStore } from '@/utils/storage';

export default {
	components: {
		AgentSidebar,
		AgentEditorModal,
		KnowledgeBasePanel,
		ChatWindow
	},
	data() {
		return {
			roles: [],
			kbs: [],
			knowledgeItems: [],
			sessions: {},
			selectedRoleId: '',
			inputText: '',
			kbPanelVisible: false,
			roleEditorVisible: false,
			roleEditorMode: 'create',
			editingRole: {},
			mobileSidebarVisible: false,
			isMobile: false,
			sidebarCollapsed: false,
			kbPanelCollapsed: false,
			deviceModeInitialized: false,
			windowHeightPx: '100vh',
			deleteRoleConfirmId: ''
		};
	},
	computed: {
		selectedRole() {
			return this.roles.find((role) => role.id === this.selectedRoleId) || null;
		},
		currentMessages() {
			return this.sessions[this.selectedRoleId] || [];
		}
	},
	onLoad() {
		this.restoreData();
		this.updateDeviceType();
	},
	onResize() {
		this.updateDeviceType();
	},
	methods: {
		updateDeviceType() {
			try {
				const info = uni.getSystemInfoSync();
				const nextIsMobile = Number(info.windowWidth || 0) < 1024;
				const prevIsMobile = this.isMobile;
				this.isMobile = nextIsMobile;
				const h = Number(info.windowHeight || 0);
				this.windowHeightPx = h > 0 ? `${h}px` : '100vh';
				if (!this.deviceModeInitialized) {
					this.applyModeDefaults(nextIsMobile);
					this.deviceModeInitialized = true;
				} else if (prevIsMobile !== nextIsMobile) {
					this.applyModeDefaults(nextIsMobile);
				}
			} catch (error) {
				this.isMobile = false;
				this.windowHeightPx = '100vh';
			}
		},
		applyModeDefaults(isMobileMode) {
			if (isMobileMode) {
				this.mobileSidebarVisible = false;
				this.sidebarCollapsed = false;
				this.kbPanelVisible = false;
				this.kbPanelCollapsed = false;
				return;
			}
			this.mobileSidebarVisible = false;
			this.sidebarCollapsed = false;
			this.kbPanelVisible = true;
			this.kbPanelCollapsed = false;
		},
		restoreData() {
			const store = loadStore();
			this.roles = store.roles || [];
			this.kbs = store.kbs || [];
			this.knowledgeItems = store.knowledgeItems || [];
			this.sessions = store.sessions || {};
			this.selectedRoleId = store.selectedRoleId || (this.roles[0] && this.roles[0].id) || '';
		},
		persist() {
			saveStore({
				roles: this.roles,
				kbs: this.kbs,
				knowledgeItems: this.knowledgeItems,
				sessions: this.sessions,
				selectedRoleId: this.selectedRoleId
			});
		},
		openCreateRole() {
			if (!this.isMobile) this.mobileSidebarVisible = false;
			this.roleEditorMode = 'create';
			this.editingRole = {};
			this.roleEditorVisible = true;
		},
		openEditRole(role) {
			if (!this.isMobile) this.mobileSidebarVisible = false;
			this.roleEditorMode = 'edit';
			this.editingRole = { ...role };
			this.roleEditorVisible = true;
		},
		saveRole(payload) {
			if (!payload || typeof payload !== 'object') {
				uni.showModal({ title: '提示', content: '请填写角色名称', showCancel: false });
				return;
			}
			const name = String(payload.name != null ? payload.name : '').trim();
			if (!name) {
				uni.showModal({ title: '提示', content: '请填写角色名称', showCancel: false });
				return;
			}
			const data = { ...payload, name };
			let toastText = '';
			if (this.roleEditorMode === 'edit' && data.id) {
				this.roles = this.roles.map((item) => (item.id === data.id ? { ...item, ...data } : item));
				toastText = '角色已更新';
			} else {
				const newRole = {
					...data,
					id: createId('role'),
					createdAt: Date.now()
				};
				this.roles = [newRole, ...this.roles];
				this.selectedRoleId = newRole.id;
				toastText = '角色已创建';
			}
			this.roleEditorVisible = false;
			this.persist();
			uni.showToast({ title: toastText, icon: 'none' });
		},
		deleteRole(roleId) {
			this.deleteRoleConfirmId = roleId;
		},
		cancelDeleteRole() {
			this.deleteRoleConfirmId = '';
		},
		confirmDeleteRole() {
			const roleId = this.deleteRoleConfirmId;
			if (!roleId) return;
			this.roles = this.roles.filter((item) => item.id !== roleId);
			const nextSessions = { ...this.sessions };
			delete nextSessions[roleId];
			this.sessions = nextSessions;
			if (this.selectedRoleId === roleId) {
				this.selectedRoleId = (this.roles[0] && this.roles[0].id) || '';
			}
			this.deleteRoleConfirmId = '';
			this.persist();
		},
		selectRole(roleId) {
			this.selectedRoleId = roleId;
			this.persist();
		},
		openMobileSidebar() {
			this.sidebarCollapsed = false;
			this.mobileSidebarVisible = true;
		},
		closeMobileSidebar() {
			this.mobileSidebarVisible = false;
			this.sidebarCollapsed = false;
			this.roleEditorVisible = false;
		},
		openKbPanel() {
			this.kbPanelCollapsed = false;
			this.kbPanelVisible = true;
		},
		openChatSettings() {
			uni.showToast({ title: '设置功能开发中', icon: 'none' });
		},
		closeKbPanel() {
			this.kbPanelVisible = false;
			this.kbPanelCollapsed = false;
		},
		onKbPanelToggleCollapse() {
			if (this.isMobile) {
				// 移动端收起即回到入口按钮逻辑
				this.closeKbPanel();
				return;
			}
			this.kbPanelCollapsed = !this.kbPanelCollapsed;
		},
		onSidebarToggleCollapse() {
			if (this.isMobile) {
				// 移动端收起即关闭抽屉，回到“角色”按钮入口
				this.closeMobileSidebar();
				return;
			}
			this.sidebarCollapsed = !this.sidebarCollapsed;
		},
		onMobileSelect(roleId) {
			this.selectRole(roleId);
			this.closeMobileSidebar();
		},
		createKb({ name, icon, description }) {
			const kb = {
				id: createId('kb'),
				name,
				icon: icon || '📘',
				description: description || '',
				createdAt: Date.now()
			};
			this.kbs = [kb, ...this.kbs];
			this.persist();
			uni.showToast({ title: '知识库已创建', icon: 'none' });
		},
		updateKb(payload) {
			this.kbs = this.kbs.map((item) => (item.id === payload.id ? { ...item, ...payload } : item));
			this.persist();
		},
		deleteKb(kbId) {
			this.kbs = this.kbs.filter((item) => item.id !== kbId);
			this.knowledgeItems = this.knowledgeItems.filter((item) => item.kbId !== kbId);
			this.roles = this.roles.map((role) => ({
				...role,
				boundKbIds: (role.boundKbIds || []).filter((id) => id !== kbId)
			}));
			this.persist();
		},
		addKnowledgeItem({ kbId, title, content }) {
			this.knowledgeItems = [
				{
					id: createId('item'),
					kbId,
					title,
					content,
					sourceType: 'text',
					createdAt: Date.now()
				},
				...this.knowledgeItems
			];
			this.persist();
			uni.showToast({ title: '已添加知识', icon: 'none' });
		},
		updateKnowledgeItem(payload) {
			this.knowledgeItems = this.knowledgeItems.map((item) => (item.id === payload.id ? { ...item, ...payload } : item));
			this.persist();
		},
		deleteKnowledgeItem(itemId) {
			this.knowledgeItems = this.knowledgeItems.filter((item) => item.id !== itemId);
			this.persist();
		},
		sendMessage() {
			const text = (this.inputText || '').trim();
			if (!text) return;
			if (!this.selectedRole) {
				uni.showToast({ title: '请先创建或选择角色', icon: 'none' });
				return;
			}
			const roleId = this.selectedRoleId;
			const userMsg = {
				id: createId('msg'),
				role: 'user',
				content: text,
				time: Date.now()
			};
			const before = this.sessions[roleId] || [];
			const byRoleKbIds = new Set(this.selectedRole.boundKbIds || []);
			const kbItems = this.knowledgeItems.filter((item) => byRoleKbIds.has(item.kbId));
			const replyText = buildMockReply({
				userText: text,
				roleName: this.selectedRole.name,
				roleDescription: this.selectedRole.description || '',
				knowledgeItems: kbItems
			});
			const botMsg = {
				id: createId('msg'),
				role: 'assistant',
				content: replyText,
				time: Date.now()
			};
			this.sessions = {
				...this.sessions,
				[roleId]: [...before, userMsg, botMsg]
			};
			this.inputText = '';
			this.persist();
		},
		clearCurrentSession() {
			if (!this.selectedRoleId) return;
			this.sessions = {
				...this.sessions,
				[this.selectedRoleId]: []
			};
			this.persist();
		}
	}
};
</script>

<style scoped>
.page {
	width: 100vw;
	background: linear-gradient(180deg, #f7f9ff 0%, #f3f6fb 100%);
	overflow: hidden;
	--agent-panel-width: min(240px, calc(86vw * 2 / 3));
	--side-panel-collapsed: 96rpx;
}

.layout {
	height: 100%;
	display: flex;
	min-height: 0;
	min-width: 0;
}

.sidebar-wrap {
	width: var(--agent-panel-width);
	height: 100%;
	transition: width 0.2s ease;
	box-sizing: border-box;
	flex-shrink: 0;
}

.sidebar-wrap.collapsed {
	width: var(--side-panel-collapsed);
}

.chat-wrap {
	flex: 1;
	height: 100%;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
	padding: 0;
	box-sizing: border-box;
	background: transparent;
}

.chat-shell {
	height: 100%;
	min-height: 0;
	overflow: hidden;
	background: transparent;
}

.kb-wrap {
	width: var(--side-panel-collapsed);
	height: 100%;
	transition: width 0.2s ease;
	border-left: 1px solid #e6ebf5;
	background: linear-gradient(180deg, #f7f9ff 0%, #f3f6fb 100%);
	box-sizing: border-box;
	overflow: hidden;
	flex-shrink: 0;
}

.kb-wrap.open {
	width: var(--agent-panel-width);
}

.kb-wrap.open.collapsed {
	width: var(--side-panel-collapsed);
}

.kb-dock {
	width: var(--side-panel-collapsed);
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: flex-start;
	padding-top: 12px;
	box-sizing: border-box;
}

.kb-dock-btn {
	margin: 0;
	width: 36px;
	min-width: 36px;
	padding: 0;
	line-height: 1.8;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #ffffff;
	border: 1px solid #dfe6f3;
	border-radius: 10px;
	box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
}

.mobile-sidebar-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0);
	z-index: 1300;
	pointer-events: none;
	transition: background 0.22s ease;
}

.mobile-sidebar-overlay.active {
	background: rgba(0, 0, 0, 0.4);
	pointer-events: auto;
}

.mobile-sidebar {
	width: var(--agent-panel-width);
	max-width: 86vw;
	height: 100%;
	background: linear-gradient(180deg, #f7f9ff 0%, #f3f6fb 100%);
	overflow: hidden;
	transition: width 0.2s ease;
	transform: translateX(-100%);
	transition: transform 0.22s ease, width 0.2s ease;
}

.mobile-sidebar-overlay.active .mobile-sidebar {
	transform: translateX(0);
}

.mobile-sidebar.collapsed {
	width: var(--side-panel-collapsed);
}

@media (max-width: 1024px) {
	.sidebar-wrap {
		display: none;
	}

	.kb-dock {
		display: none;
	}

	.kb-wrap {
		display: none;
	}

}

.delete-role-overlay {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 2200;
	background: rgba(15, 23, 42, 0.42);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	box-sizing: border-box;
	backdrop-filter: blur(2px);
}

.delete-role-dialog {
	width: 100%;
	max-width: 320px;
	background: #fff;
	border-radius: 14px;
	padding: 20px;
	box-sizing: border-box;
	box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22);
	border: 1px solid #e8edf7;
}

.delete-role-title {
	display: block;
	font-size: 17px;
	font-weight: 600;
	color: #111;
	margin-bottom: 10px;
}

.delete-role-msg {
	display: block;
	font-size: 14px;
	line-height: 1.5;
	color: #667085;
	margin-bottom: 20px;
}

.delete-role-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
}

.delete-role-btn {
	margin: 0;
	line-height: 1.9;
	min-width: 72px;
	border-radius: 8px;
	transition: all 0.2s ease;
}

.delete-role-btn.cancel {
	background: #f4f7fb;
	color: #333;
	border: 1px solid #e3e9f4;
}

.delete-role-btn.danger {
	background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
	color: #fff;
	box-shadow: 0 6px 14px rgba(239, 68, 68, 0.2);
}

/* #ifdef H5 */
.kb-dock-btn:hover {
	border-color: #cfd9eb;
	background: #f9fbff;
}

.delete-role-btn.cancel:hover {
	background: #fff;
	border-color: #cfd8e8;
}

.delete-role-btn.danger:hover {
	filter: brightness(1.03);
}
/* #endif */
</style>
