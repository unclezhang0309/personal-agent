<template>
	<view v-if="rendered" class="overlay" :class="{ mobile: isMobile, inline, active: panelActive }" @click="onOverlayClick">
		<view class="panel" :class="{ mobile: isMobile, collapsed }" @click.stop>
			<view class="header">
				<button class="header-icon-btn" size="mini" @click="$emit('toggle-collapse')">
					<uni-icons :type="collapsed ? 'left' : 'right'" size="14" color="#2f6dff"></uni-icons>
				</button>
				<text v-if="!collapsed" class="title">知识库管理</text>
				<view v-if="!collapsed" class="header-actions">
					<button size="mini" class="header-primary-btn" @click="openCreateKb">+新建知识库</button>
				</view>
			</view>

			<scroll-view v-if="!collapsed" class="kb-scroll" scroll-y>
				<view v-for="kb in kbs" :key="kb.id" class="kb-card">
					<view class="kb-head">
						<view class="kb-title-wrap">
							<text class="kb-icon">{{ kb.icon || '📘' }}</text>
							<view class="kb-meta">
								<text class="kb-name">{{ kb.name }}</text>
								<text class="kb-desc">{{ kb.description || '暂无描述' }}</text>
							</view>
						</view>
						<view class="kb-actions">
							<text class="action" @click="openEditKb(kb)">编辑</text>
							<text class="action danger" @click="$emit('delete-kb', kb.id)">删除</text>
						</view>
					</view>
					<view class="kb-subline" @click="toggleKbItems(kb.id)">
						<view class="subline-left">
							<uni-icons :type="isKbExpanded(kb.id) ? 'bottom' : 'right'" size="14" color="#6b7280"></uni-icons>
							<text class="count">条目数：{{ getCount(kb.id) }}</text>
						</view>
						<view class="sub-actions">
							<button size="mini" class="add-item-btn" @click.stop="openCreateItem(kb.id)">+新增条目</button>
						</view>
					</view>

					<view v-if="isKbExpanded(kb.id)">
						<view v-for="item in getPagedKbItems(kb.id)" :key="item.id" class="item-row">
							<view class="item-meta">
								<text class="item-title">{{ item.title }}</text>
								<text class="item-content">{{ item.content }}</text>
							</view>
							<view class="item-actions">
								<text class="action" @click="openEditItem(item)">编辑</text>
								<text class="action danger" @click="$emit('delete-item', item.id)">删除</text>
							</view>
						</view>

						<!-- <text v-if="getKbItems(kb.id).length === 0" class="item-empty">暂无知识条目</text> -->

						<view v-if="getTotalPages(kb.id) > 1" class="pagination">
							<button
								size="mini"
								class="page-btn"
								:disabled="getCurrentPage(kb.id) === 1"
								@click="changePage(kb.id, getCurrentPage(kb.id) - 1)"
							>
								上一页
							</button>
							<text class="page-text">{{ getCurrentPage(kb.id) }} / {{ getTotalPages(kb.id) }}</text>
							<button
								size="mini"
								class="page-btn"
								:disabled="getCurrentPage(kb.id) === getTotalPages(kb.id)"
								@click="changePage(kb.id, getCurrentPage(kb.id) + 1)"
							>
								下一页
							</button>
						</view>
					</view>
				</view>
				<view v-if="kbs.length === 0" class="empty">暂无知识库，请先创建一个</view>
			</scroll-view>

			<view v-if="kbModalVisible" class="sub-overlay" @click.self="kbModalVisible = false">
				<view class="modal-card">
					<text class="modal-title">{{ kbModalMode === 'edit' ? '编辑知识库' : '新建知识库' }}</text>
					<input class="modal-input" :value="kbForm.name" placeholder="知识库名称" @input="kbForm.name = $event.detail.value" />
					<input class="modal-input" :value="kbForm.icon" placeholder="图标（如 📘）" @input="kbForm.icon = $event.detail.value" />
					<textarea
						class="modal-textarea"
						:value="kbForm.description"
						placeholder="知识库描述"
						maxlength="200"
						@input="kbForm.description = $event.detail.value"
					/>
					<text v-if="kbFormError" class="error-text">{{ kbFormError }}</text>
					<view class="modal-actions">
						<button size="mini" class="ghost-btn" @click="kbModalVisible = false">取消</button>
						<button size="mini" class="action-btn" @click="submitKb">保存</button>
					</view>
				</view>
			</view>

			<view v-if="itemModalVisible" class="sub-overlay" @click.self="itemModalVisible = false">
				<view class="modal-card">
					<text class="modal-title">{{ itemModalMode === 'edit' ? '编辑知识条目' : '新增知识条目' }}</text>
					<view class="modal-kb-info">
						<text class="modal-kb-icon">{{ currentItemKb.icon || '📘' }}</text>
						<text class="modal-kb-name">{{ currentItemKb.name || '未命名知识库' }}</text>
					</view>
					<input class="modal-input" :value="itemForm.title" placeholder="标题" @input="itemForm.title = $event.detail.value" />
					<textarea
						class="modal-textarea large"
						:value="itemForm.content"
						placeholder="内容"
						maxlength="2000"
						@input="itemForm.content = $event.detail.value"
					/>
					<text v-if="itemFormError" class="error-text">{{ itemFormError }}</text>
					<view class="modal-actions">
						<button size="mini" class="ghost-btn" @click="itemModalVisible = false">取消</button>
						<button size="mini" class="action-btn" @click="submitItem">保存</button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'KnowledgeBasePanel',
	props: {
		visible: Boolean,
		isMobile: Boolean,
		inline: {
			type: Boolean,
			default: false
		},
		collapsed: {
			type: Boolean,
			default: false
		},
		kbs: {
			type: Array,
			default: () => []
		},
		knowledgeItems: {
			type: Array,
			default: () => []
		}
	},
	data() {
		return {
			kbModalVisible: false,
			kbModalMode: 'create',
			kbForm: {
				id: '',
				name: '',
				icon: '📘',
				description: ''
			},
			kbFormError: '',
			itemModalVisible: false,
			itemModalMode: 'create',
			itemForm: {
				id: '',
				kbId: '',
				title: '',
				content: ''
			},
			itemFormError: '',
			expandedKbIds: [],
			pageByKb: {},
			pageSize: 3,
			rendered: false,
			panelActive: false,
			hideTimer: null
		};
	},
	watch: {
		visible: {
			immediate: true,
			handler(next) {
				this.syncVisibility(next);
			}
		}
	},
	methods: {
		syncVisibility(next) {
			if (this.hideTimer) {
				clearTimeout(this.hideTimer);
				this.hideTimer = null;
			}
			if (next) {
				this.rendered = true;
				setTimeout(() => {
					this.panelActive = true;
				}, 0);
				return;
			}
			this.panelActive = false;
			this.hideTimer = setTimeout(() => {
				this.rendered = false;
			}, 220);
		},
		onOverlayClick() {
			// 移动端抽屉模式：点击黑色透明区域关闭
			if (this.isMobile && !this.inline) {
				this.$emit('close');
				return;
			}
			// 其他非内联模式同样允许点击遮罩关闭
			if (!this.inline) this.$emit('close');
		},
		getKbById(kbId) {
			return this.kbs.find((kb) => kb.id === kbId) || { name: '', icon: '📘' };
		},
		getCount(kbId) {
			return this.knowledgeItems.filter((item) => item.kbId === kbId).length;
		},
		getKbItems(kbId) {
			return this.knowledgeItems.filter((item) => item.kbId === kbId);
		},
		isKbExpanded(kbId) {
			return this.expandedKbIds.includes(kbId);
		},
		toggleKbItems(kbId) {
			if (this.isKbExpanded(kbId)) {
				this.expandedKbIds = this.expandedKbIds.filter((id) => id !== kbId);
				return;
			}
			this.expandedKbIds = [...this.expandedKbIds, kbId];
			if (!this.pageByKb[kbId]) {
				this.pageByKb = { ...this.pageByKb, [kbId]: 1 };
			}
		},
		getCurrentPage(kbId) {
			return this.pageByKb[kbId] || 1;
		},
		getTotalPages(kbId) {
			const total = this.getKbItems(kbId).length;
			return Math.max(1, Math.ceil(total / this.pageSize));
		},
		getPagedKbItems(kbId) {
			const list = this.getKbItems(kbId);
			const page = this.getCurrentPage(kbId);
			const start = (page - 1) * this.pageSize;
			return list.slice(start, start + this.pageSize);
		},
		changePage(kbId, nextPage) {
			const maxPage = this.getTotalPages(kbId);
			const safePage = Math.min(maxPage, Math.max(1, nextPage));
			this.pageByKb = { ...this.pageByKb, [kbId]: safePage };
		},
		openCreateKb() {
			this.kbModalMode = 'create';
			this.kbFormError = '';
			this.kbForm = { id: '', name: '', icon: '📘', description: '' };
			this.kbModalVisible = true;
		},
		openEditKb(kb) {
			this.kbModalMode = 'edit';
			this.kbFormError = '';
			this.kbForm = {
				id: kb.id,
				name: kb.name || '',
				icon: kb.icon || '📘',
				description: kb.description || ''
			};
			this.kbModalVisible = true;
		},
		submitKb() {
			const name = (this.kbForm.name || '').trim();
			if (!name) {
				this.kbFormError = '请输入知识库名称';
				return;
			}
			const payload = {
				id: this.kbForm.id,
				name,
				icon: (this.kbForm.icon || '').trim() || '📘',
				description: (this.kbForm.description || '').trim()
			};
			if (this.kbModalMode === 'edit') this.$emit('update-kb', payload);
			else this.$emit('create-kb', payload);
			this.kbModalVisible = false;
		},
		openCreateItem(kbId) {
			this.itemModalMode = 'create';
			this.itemFormError = '';
			const kb = this.getKbById(kbId);
			this.itemForm = { id: '', kbId, title: '', content: '', kbName: kb.name, kbIcon: kb.icon };
			this.itemModalVisible = true;
		},
		openEditItem(item) {
			this.itemModalMode = 'edit';
			this.itemFormError = '';
			const kb = this.getKbById(item.kbId);
			this.itemForm = {
				id: item.id,
				kbId: item.kbId,
				title: item.title || '',
				content: item.content || '',
				kbName: kb.name,
				kbIcon: kb.icon
			};
			this.itemModalVisible = true;
		},
		submitItem() {
			const title = (this.itemForm.title || '').trim();
			const content = (this.itemForm.content || '').trim();
			if (!title || !content) {
				this.itemFormError = '请填写标题和内容';
				return;
			}
			const payload = {
				id: this.itemForm.id,
				kbId: this.itemForm.kbId,
				title,
				content
			};
			if (this.itemModalMode === 'edit') this.$emit('update-item', payload);
			else this.$emit('add-item', payload);
			this.itemModalVisible = false;
		}
	},
	computed: {
		currentItemKb() {
			if (!this.itemForm || !this.itemForm.kbId) return { name: '', icon: '📘' };
			return {
				name: this.itemForm.kbName || this.getKbById(this.itemForm.kbId).name,
				icon: this.itemForm.kbIcon || this.getKbById(this.itemForm.kbId).icon || '📘'
			};
		}
	},
	beforeUnmount() {
		if (this.hideTimer) clearTimeout(this.hideTimer);
	}
};
</script>

<style scoped>
.overlay {
	position: fixed;
	inset: 0;
	z-index: 1200;
	display: flex;
	justify-content: flex-end;
	background: transparent;
	pointer-events: none;
	transition: background 0.22s ease;
}

.overlay.mobile {
	background: rgba(0, 0, 0, 0);
}

.overlay.mobile.active {
	background: rgba(0, 0, 0, 0.45);
	pointer-events: auto;
}

.overlay.inline {
	position: relative;
	inset: auto;
	height: 100%;
	background: transparent;
	z-index: auto;
	pointer-events: auto;
}

.panel {
	width: min(760rpx, 92vw);
	height: 100%;
	background: #f8f9fb;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	pointer-events: auto;
	box-sizing: border-box;
}

.panel.mobile {
	width: var(--agent-panel-width, min(240px, calc(86vw * 2 / 3)));
	max-width: 86vw;
	transform: translateX(100%);
	transition: transform 0.22s ease, width 0.2s ease;
}

.overlay.mobile.active .panel.mobile {
	transform: translateX(0);
}

.panel.collapsed {
	width: 96rpx;
}

.overlay.inline .panel {
	width: 100%;
	max-width: 100%;
	min-width: 0;
	height: 100%;
	border-radius: 0;
}

.header {
	flex: 0 0 56px;
	height: 56px;
	min-height: 56px;
	box-sizing: border-box;
	padding: 0 12px;
	border-bottom: 1px solid #ececec;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 8px;
	min-width: 0;
}

.panel.collapsed .header {
	justify-content: center;
	padding: 0 4px;
}

.header-actions {
	margin-left: auto;
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
}

.header-primary-btn,
.header-icon-btn {
	margin: 0;
	box-sizing: border-box;
	flex-shrink: 0;
}

.header-primary-btn {
	height: 28px;
	min-height: 28px;
	line-height: 26px;
	padding: 0 12px;
	font-size: 13px;
	font-weight: 500;
	border-radius: 6px;
	background: #2f6dff;
	color: #fff;
	border: 1px solid #2f6dff;
	white-space: nowrap;
}

.header-icon-btn {
	width: 28px;
	height: 28px;
	min-width: 28px;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
}

.title {
	flex: 1;
	min-width: 0;
	font-size: 15px;
	font-weight: 600;
	color: #111827;
	line-height: 1.25;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.close {
	font-size: 14px;
	color: #666;
}

.kb-scroll {
	flex: 1;
	padding: 0 12px 14px;
	box-sizing: border-box;
}

.kb-card {
	background: #fff;
	border: 1px solid #eceff4;
	border-radius: 10px;
	padding: 10px 12px 10px 10px;
	margin-bottom: 10px;
	box-sizing: border-box;
}

.kb-head {
	display: flex;
	justify-content: space-between;
	gap: 8px;
}

.kb-title-wrap {
	display: flex;
	gap: 8px;
	flex: 1;
	min-width: 0;
}

.kb-icon {
	font-size: 28rpx;
	line-height: 1.2;
}

.kb-meta {
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex: 1;
	min-width: 0;
}

.kb-name {
	font-size: 28rpx;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kb-actions,
.item-actions {
	display: flex;
	gap: 10px;
	align-items: center;
	flex-shrink: 0;
	padding-right: 2px;
}

.action {
	font-size: 22rpx;
	color: #2f6dff;
}

.danger {
	color: #e74c3c;
}

.kb-desc {
	font-size: 22rpx;
	color: #777;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kb-subline {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 8px 2px 8px 0;
	padding: 6px 8px;
	background: #ffffff;
	border: 1px solid #eceff4;
	border-radius: 8px;
	box-sizing: border-box;
	cursor: pointer;
}

.subline-left {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.sub-actions {
	display: flex;
	align-items: center;
	gap: 6px;
}

.count {
	font-size: 22rpx;
	color: #777;
}

.item-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
	padding: 8px 10px 8px 8px;
	border-radius: 8px;
	background: #fff;
	margin-bottom: 8px;
	box-sizing: border-box;
}

.item-meta {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.item-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #222;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.item-content {
	font-size: 22rpx;
	color: #777;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.item-empty {
	display: block;
	font-size: 22rpx;
	color: #999;
	padding: 4px 0 2px;
}

.textarea {
	width: 100%;
	min-height: 78px;
}

.textarea.large {
	min-height: 120px;
}

.input,
.textarea {
	background: #fff;
	border-radius: 8px;
	padding: 8px 10px;
	box-sizing: border-box;
	margin-bottom: 8px;
	font-size: 13px;
}

.action-btn {
	margin: 0;
	background: #2f6dff;
	color: #fff;
	line-height: 1.8;
}

.add-item-btn {
	margin: 0;
	font-size: 22rpx;
	line-height: 1.8;
	background: #eef3ff;
	color: #2f6dff;
}

.empty {
	padding: 20px 10px;
	color: #888;
	font-size: 24rpx;
	text-align: center;
}

.item-collapsed-tip {
	display: block;
	font-size: 22rpx;
	color: #999;
	padding: 2px 0 4px;
}

.pagination {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 4px;
}

.page-btn {
	margin: 0;
	font-size: 22rpx;
	line-height: 1.7;
	background: #f3f4f6;
	color: #374151;
}

.page-text {
	font-size: 22rpx;
	color: #777;
}

.sub-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.35);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1250;
	padding: 12px;
	box-sizing: border-box;
}

.modal-card {
	width: min(420px, calc(100vw - 24px));
	max-height: calc(100vh - 24px);
	overflow-y: auto;
	background: #fff;
	border-radius: 12px;
	padding: 12px;
	box-sizing: border-box;
}

.modal-card .input,
.modal-card .textarea {
	width: 100%;
}

.modal-input {
	width: 100%;
	height: 40px;
	min-height: 40px;
	background: #fff;
	border: 1px solid #dcdfe6;
	border-radius: 8px;
	padding: 0 10px;
	box-sizing: border-box;
	margin-bottom: 8px;
	font-size: 14px;
	line-height: 40px;
}

.modal-textarea {
	width: 100%;
	min-height: 88px;
	background: #fff;
	border: 1px solid #dcdfe6;
	border-radius: 8px;
	padding: 8px 10px;
	box-sizing: border-box;
	margin-bottom: 8px;
	font-size: 14px;
}

.modal-textarea.large {
	min-height: 126px;
}

.modal-title {
	display: block;
	font-size: 16px;
	font-weight: 600;
	margin-bottom: 10px;
}

.modal-kb-info {
	display: flex;
	align-items: center;
	gap: 6px;
	background: #f5f7fb;
	border-radius: 8px;
	padding: 8px 10px;
	margin-bottom: 10px;
}

.modal-kb-icon {
	font-size: 16px;
	line-height: 1;
}

.modal-kb-name {
	font-size: 13px;
	color: #4b5563;
}

.error-text {
	display: block;
	margin: 2px 0 8px;
	font-size: 12px;
	color: #e74c3c;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
}

.ghost-btn {
	margin: 0;
	line-height: 1.8;
	background: #f1f3f6;
	color: #333;
}

@media (max-width: 768px) {
	.sub-overlay {
		align-items: flex-end;
		padding: 8px;
	}

	.modal-card {
		width: 100%;
		max-height: 92vh;
		border-radius: 12px 12px 0 0;
		padding-bottom: calc(12px + env(safe-area-inset-bottom));
	}
}

@keyframes slideInFromRight {
	from {
		transform: translateX(100%);
		opacity: 0.85;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
}

@keyframes fadeInPanelMask {
	from {
		background: rgba(0, 0, 0, 0);
	}
	to {
		background: rgba(0, 0, 0, 0.45);
	}
}
</style>
