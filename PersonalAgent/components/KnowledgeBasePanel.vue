<template>
	<view v-if="rendered" class="overlay" :class="{ mobile: isMobile, inline, active: panelActive }" @click="onOverlayClick">
		<view class="panel" :class="{ mobile: isMobile, collapsed }" @click.stop>
			<view class="header">
				<button class="header-icon-btn" size="mini" @click="$emit('toggle-collapse')">
					<uni-icons :type="collapsed ? 'left' : 'right'" size="14" color="#2f6dff"></uni-icons>
				</button>
				<view v-if="!collapsed" class="header-main">
					<text class="title">知识库</text>
					<button size="mini" class="header-primary-btn" @click="openCreateKb">
						<text class="plus-text">+</text>
					</button>
				</view>
			</view>

			<scroll-view
				v-if="!collapsed"
				class="kb-scroll"
				scroll-y
				:show-scrollbar="false"
				@scroll="onKbScroll"
				@click="closeActionMenus"
			>
				<view class="kb-virtual-spacer" :style="{ height: `${kbVirtualTop}px` }"></view>
				<view v-for="kb in visibleKbs" :key="kb.id" class="kb-card" :class="{ 'menu-open': activeKbMenuId === kb.id }">
					<view class="kb-head">
						<view class="kb-title-wrap">
							<view class="kb-meta">
								<text class="kb-name">{{ kb.name }}</text>
								<text class="kb-desc">{{ kb.description || '暂无描述' }}</text>
							</view>
						</view>
						<view class="kb-actions">
							<view class="more-wrap">
								<button
									class="more-btn"
									:class="{ active: activeKbMenuId === kb.id }"
									size="mini"
									@click.stop="toggleKbMenu(kb.id)"
								>
									<uni-icons type="more-filled" size="14" color="#60708a"></uni-icons>
								</button>
								<view v-if="activeKbMenuId === kb.id" class="item-menu">
									<text class="menu-item" @click.stop="onEditKb(kb)">编辑</text>
									<text class="menu-item danger" @click.stop="onDeleteKb(kb.id)">删除</text>
								</view>
							</view>
						</view>
					</view>
					<view class="kb-subline" @click="toggleKbItems(kb.id)">
						<view class="subline-left">
							<uni-icons :type="isKbExpanded(kb.id) ? 'bottom' : 'right'" size="14" color="#6b7280"></uni-icons>
							<text class="count">条目数：{{ getCount(kb.id) }}</text>
						</view>
						<view class="sub-actions">
							<button size="mini" class="add-item-btn" @click.stop="openCreateItem(kb.id)">
								<text class="plus-text">+</text>
							</button>
						</view>
					</view>

					<view v-if="isKbExpanded(kb.id)">
						<view
							v-for="item in getPagedKbItems(kb.id)"
							:key="item.id"
							class="item-row"
							:class="{ 'menu-open': activeItemMenuId === item.id }"
						>
							<view class="item-meta">
								<text class="item-title">{{ item.title }}</text>
								<text class="item-content">{{ item.content }}</text>
							</view>
							<view class="item-actions">
								<view class="more-wrap">
									<button
										class="more-btn"
										:class="{ active: activeItemMenuId === item.id }"
										size="mini"
										@click.stop="toggleItemMenu(item.id)"
									>
										<uni-icons type="more-filled" size="14" color="#60708a"></uni-icons>
									</button>
									<view v-if="activeItemMenuId === item.id" class="item-menu">
										<text class="menu-item" @click.stop="onEditItem(item)">编辑</text>
										<text class="menu-item danger" @click.stop="onDeleteItem(item.id)">删除</text>
									</view>
								</view>
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
				<view class="kb-virtual-spacer" :style="{ height: `${kbVirtualBottom}px` }"></view>
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
			hideTimer: null,
			activeKbMenuId: '',
			activeItemMenuId: '',
			kbScrollTop: 0,
			kbViewportH: 0,
			kbOverscan: 4
		};
	},
	computed: {
		kbVirtualMap() {
			let total = 0;
			const offsets = [];
			const heights = [];
			for (let i = 0; i < this.kbs.length; i += 1) {
				const kb = this.kbs[i];
				offsets.push(total);
				const h = this.estimateKbCardHeight(kb);
				heights.push(h);
				total += h;
			}
			return { offsets, heights, total };
		},
		kbStartIndex() {
			const { offsets } = this.kbVirtualMap;
			if (!offsets.length) return 0;
			const top = this.kbScrollTop;
			let idx = 0;
			for (let i = 0; i < offsets.length; i += 1) {
				if (offsets[i] > top) break;
				idx = i;
			}
			return Math.max(0, idx - this.kbOverscan);
		},
		kbEndIndex() {
			const { offsets, heights } = this.kbVirtualMap;
			if (!offsets.length) return 0;
			const bottom = this.kbScrollTop + (this.kbViewportH || 480) + 220;
			let idx = offsets.length - 1;
			for (let i = this.kbStartIndex; i < offsets.length; i += 1) {
				const itemBottom = offsets[i] + heights[i];
				if (itemBottom >= bottom) {
					idx = i;
					break;
				}
			}
			return Math.min(this.kbs.length, idx + this.kbOverscan + 1);
		},
		visibleKbs() {
			return this.kbs.slice(this.kbStartIndex, this.kbEndIndex);
		},
		kbVirtualTop() {
			const { offsets } = this.kbVirtualMap;
			return offsets[this.kbStartIndex] || 0;
		},
		kbVirtualBottom() {
			const { offsets, heights, total } = this.kbVirtualMap;
			if (!this.kbs.length) return 0;
			const end = this.kbEndIndex - 1;
			const renderedBottom = end >= 0 ? offsets[end] + heights[end] : 0;
			return Math.max(0, total - renderedBottom);
		},
		currentItemKb() {
			if (!this.itemForm || !this.itemForm.kbId) return { name: '', icon: '📘' };
			return {
				name: this.itemForm.kbName || this.getKbById(this.itemForm.kbId).name,
				icon: this.itemForm.kbIcon || this.getKbById(this.itemForm.kbId).icon || '📘'
			};
		}
	},
	watch: {
		visible: {
			immediate: true,
			handler(next) {
				this.syncVisibility(next);
			}
		},
		kbs: {
			deep: true,
			handler() {
				this.$nextTick(() => this.measureKbViewport());
			}
		},
		expandedKbIds() {
			this.$nextTick(() => this.measureKbViewport());
		},
		pageByKb: {
			deep: true,
			handler() {
				this.$nextTick(() => this.measureKbViewport());
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
			this.closeActionMenus();
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
		onKbScroll(e) {
			const d = e && e.detail ? e.detail : {};
			this.kbScrollTop = Number(d.scrollTop || 0);
		},
		measureKbViewport() {
			const q = uni.createSelectorQuery().in(this);
			q.select('.kb-scroll').boundingClientRect((rect) => {
				if (rect && rect.height) this.kbViewportH = rect.height;
			});
			q.exec();
		},
		estimateKbCardHeight(kb) {
			const collapsedHeight = 148;
			if (!this.isKbExpanded(kb.id)) return collapsedHeight;
			const itemCount = this.getPagedKbItems(kb.id).length;
			const paginationHeight = this.getTotalPages(kb.id) > 1 ? 44 : 0;
			return collapsedHeight + itemCount * 76 + paginationHeight + 14;
		},
		closeActionMenus() {
			this.activeKbMenuId = '';
			this.activeItemMenuId = '';
		},
		toggleKbMenu(kbId) {
			this.activeItemMenuId = '';
			this.activeKbMenuId = this.activeKbMenuId === kbId ? '' : kbId;
		},
		toggleItemMenu(itemId) {
			this.activeKbMenuId = '';
			this.activeItemMenuId = this.activeItemMenuId === itemId ? '' : itemId;
		},
		onEditKb(kb) {
			this.closeActionMenus();
			this.openEditKb(kb);
		},
		onDeleteKb(kbId) {
			this.closeActionMenus();
			this.$emit('delete-kb', kbId);
		},
		onEditItem(item) {
			this.closeActionMenus();
			this.openEditItem(item);
		},
		onDeleteItem(itemId) {
			this.closeActionMenus();
			this.$emit('delete-item', itemId);
		},
		openCreateKb() {
			this.closeActionMenus();
			this.kbModalMode = 'create';
			this.kbFormError = '';
			this.kbForm = { id: '', name: '', icon: '📘', description: '' };
			this.kbModalVisible = true;
		},
		openEditKb(kb) {
			this.closeActionMenus();
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
			this.closeActionMenus();
			this.itemModalMode = 'create';
			this.itemFormError = '';
			const kb = this.getKbById(kbId);
			this.itemForm = { id: '', kbId, title: '', content: '', kbName: kb.name, kbIcon: kb.icon };
			this.itemModalVisible = true;
		},
		openEditItem(item) {
			this.closeActionMenus();
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
	mounted() {
		this.$nextTick(() => this.measureKbViewport());
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
	min-height: 0;
	background: linear-gradient(180deg, #edf3ff 0%, #e5edf9 100%);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	pointer-events: auto;
	box-sizing: border-box;
	border-left: 1px solid #e6ebf5;
	box-shadow: -10px 0 30px rgba(15, 23, 42, 0.08);
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
	border-bottom: 1px solid #e6ebf5;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 8px;
	min-width: 0;
	background: rgba(255, 255, 255, 0.7);
	backdrop-filter: blur(8px);
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

.header-main {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-left: auto;
	justify-content: flex-end;
	min-width: 0;
}

.header-primary-btn,
.header-icon-btn {
	margin: 0;
	box-sizing: border-box;
	flex-shrink: 0;
	transition: all 0.2s ease;
}

.header-primary-btn {
	width: 28px;
	height: 28px;
	min-width: 28px;
	min-height: 28px;
	line-height: 1;
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	background: linear-gradient(135deg, #2f6dff 0%, #4f87ff 100%);
	color: #fff;
	border: 1px solid rgba(36, 94, 226, 0.95);
	box-shadow: 0 6px 14px rgba(47, 109, 255, 0.22), inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
}

.header-primary-btn::after {
	border: none;
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
	border: 1px solid rgba(191, 204, 226, 0.75);
	border-radius: 999px;
	box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.8);
}

.header-icon-btn::after {
	border: none;
}

.title {
	flex: 0 1 auto;
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
	min-height: 0;
	padding: 12px 12px 14px;
	box-sizing: border-box;
	scrollbar-width: none;
	-ms-overflow-style: none;
}

.kb-virtual-spacer {
	width: 100%;
	flex-shrink: 0;
}

.kb-scroll::-webkit-scrollbar {
	display: none;
}

.kb-card {
	background: rgba(255, 255, 255, 0.96);
	border: none;
	border-radius: 24px;
	padding: 10px 12px 10px 10px;
	margin-bottom: 12px;
	box-sizing: border-box;
	overflow: visible;
	box-shadow: none;
	transition: background 0.2s ease;
	position: relative;
	z-index: 1;
}

.kb-card.menu-open {
	z-index: 50;
}

.kb-head {
	display: flex;
	justify-content: space-between;
	gap: 8px;
}

.kb-title-wrap {
	display: flex;
	align-items: center;
	gap: 8px;
	flex: 1;
	min-width: 0;
}

.kb-meta {
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex: 1;
	min-width: 0;
	padding-left: 6px;
}

.kb-name {
	font-size: 28rpx;
	font-weight: 600;
	line-height: 1.25;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kb-actions,
.item-actions {
	margin-left: auto;
	display: flex;
	align-items: center;
	align-self: flex-start;
	position: relative;
	z-index: 4;
}

.more-wrap {
	position: relative;
}

.more-btn {
	margin: 0;
	width: 24px;
	height: 24px;
	min-width: 24px;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #6b7280;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 999px;
	transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.more-btn::after {
	border: none;
}

.more-btn.active {
	background: #f3f7ff;
	border-color: #d8e4fa;
}

.item-menu {
	position: absolute;
	top: calc(100% + 10px);
	right: 0;
	min-width: 86px;
	background: #fff;
	border: 1px solid #e6ecf7;
	border-radius: 14px;
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
	overflow: hidden;
	z-index: 120;
}

.menu-item {
	display: block;
	padding: 6px 10px;
	font-size: 12px;
	color: #2f6dff;
	background: #fff;
	white-space: nowrap;
}

.action {
	font-size: 22rpx;
	color: #2f6dff;
	font-weight: 500;
	transition: opacity 0.2s ease, color 0.2s ease;
}

.danger {
	color: #ef4444;
}

.menu-item.danger {
	color: #ef4444;
}

.kb-desc {
	font-size: 22rpx;
	color: #6b7280;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kb-subline {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	margin: 10px 0 0;
	padding: 6px 8px;
	background: #eaf2ff;
	border: none;
	border: 1px solid #d4e3fb;
	border-radius: 999px;
	box-sizing: border-box;
	cursor: pointer;
	transition: all 0.2s ease;
}

.kb-subline + view {
	margin-top: 8px;
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
	color: #667085;
}

.item-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
	padding: 8px 10px 8px 8px;
	border-radius: 999px;
	background: #fff;
	margin-bottom: 8px;
	box-sizing: border-box;
	border: none;
	transition: background 0.2s ease;
	position: relative;
	z-index: 1;
}

.item-row.menu-open {
	z-index: 55;
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
	color: #6b7280;
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
	background: linear-gradient(135deg, #2f6dff 0%, #4f87ff 100%);
	color: #fff;
	line-height: 1.8;
	border-radius: 999px;
	box-shadow: 0 6px 14px rgba(47, 109, 255, 0.2);
	transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.add-item-btn {
	margin: 0;
	height: 30px;
	min-height: 30px;
	width: 30px;
	min-width: 30px;
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
	background: linear-gradient(135deg, #2f6dff 0%, #4f87ff 100%);
	color: #fff;
	border-radius: 999px;
	border: 1px solid rgba(36, 94, 226, 0.95);
	box-shadow: 0 6px 14px rgba(47, 109, 255, 0.22), inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
	transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.add-item-btn::after {
	border: none;
}

.plus-text {
	font-size: 18px;
	font-weight: 600;
	line-height: 1;
	transform: translateY(-1px);
}

.empty {
	padding: 16px 14px;
	margin-top: 14px;
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid #e6ecf7;
	border-radius: 999px;
	box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
	color: #74809a;
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
	background: #f6f8fc;
	color: #374151;
	border-radius: 999px;
	border: 1px solid #e4e9f3;
	transition: all 0.2s ease;
}

.page-text {
	font-size: 22rpx;
	color: #6b7280;
}

.sub-overlay {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.42);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1250;
	padding: 12px;
	box-sizing: border-box;
	backdrop-filter: blur(2px);
}

.modal-card {
	width: min(420px, calc(100vw - 24px));
	max-height: calc(100vh - 24px);
	overflow-y: auto;
	background: #fff;
	border-radius: 24px;
	padding: 12px;
	box-sizing: border-box;
	border: 1px solid #e8edf7;
	box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22);
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
	border: 1px solid #dbe2ef;
	border-radius: 999px;
	padding: 0 10px;
	box-sizing: border-box;
	margin-bottom: 8px;
	font-size: 14px;
	line-height: 40px;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.modal-textarea {
	width: 100%;
	min-height: 88px;
	background: #fff;
	border: 1px solid #dbe2ef;
	border-radius: 22px;
	padding: 8px 10px;
	box-sizing: border-box;
	margin-bottom: 8px;
	font-size: 14px;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
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
	background: #f6f9ff;
	border-radius: 999px;
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
	min-height: 40px;
	height: 40px;
	line-height: 38px;
	padding: 0 18px;
	background: #f4f7fb;
	color: #333;
	border-radius: 999px;
	border: 1px solid rgba(191, 204, 226, 0.75);
	box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.85);
	transition: all 0.2s ease;
	min-width: 96px;
	font-size: 14px;
	font-weight: 600;
}

.ghost-btn::after {
	border: none;
}

.action-btn {
	min-height: 40px;
	height: 40px;
	line-height: 38px;
	padding: 0 18px;
	min-width: 96px;
	font-size: 14px;
	font-weight: 600;
}

/* #ifdef H5 */
.header-icon-btn:hover {
	border-color: #cfd9eb;
	background: #f9fbff;
}

.header-primary-btn:hover,
.action-btn:hover {
	filter: brightness(1.03);
}

.header-primary-btn:active,
.action-btn:active {
	transform: translateY(1px);
}

.kb-card:hover {
	background: #f9fbff;
}

.kb-subline:hover {
	background: #e2edff;
}

.item-row:hover {
	background: #fbfdff;
}

.action:hover {
	opacity: 0.86;
}

.more-btn:hover {
	background: #f3f7ff;
	border-color: #d8e4fa;
}

.menu-item:hover {
	background: #f7faff;
}

.danger:hover {
	color: #dc2626;
}

.page-btn:hover,
.ghost-btn:hover {
	background: linear-gradient(180deg, #ffffff 0%, #eef4ff 100%);
	border-color: #c5d7f6;
}

.add-item-btn:hover {
	filter: brightness(1.03);
}

.modal-input:focus,
.modal-textarea:focus {
	border-color: #bfd4ff;
	box-shadow: 0 0 0 3px rgba(47, 109, 255, 0.12);
}
/* #endif */

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

	.modal-actions {
		justify-content: space-between;
		gap: 10px;
	}

	.modal-actions .ghost-btn,
	.modal-actions .action-btn {
		flex: 1;
		min-width: 0;
		height: 44px;
		min-height: 44px;
		line-height: 42px;
		font-size: 15px;
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
