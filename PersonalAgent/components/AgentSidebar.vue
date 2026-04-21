<template>
	<view class="sidebar" :class="{ collapsed }" @click="closeMenus">
		<view class="sidebar-header">
			<view v-if="!collapsed" class="header-main">
				<text class="title">角色</text>
				<button class="header-primary-btn" size="mini" @click="$emit('create')">
					<text class="plus-text">+</text>
				</button>
			</view>
			<view class="header-actions">
				<button class="header-icon-btn" size="mini" @click="$emit('toggle-collapse')">
					<uni-icons :type="collapsed ? 'right' : 'left'" size="14" color="#2f6dff"></uni-icons>
				</button>
			</view>
		</view>
		<scroll-view
			class="role-list"
			scroll-y
			:show-scrollbar="false"
			@scroll="onRoleScroll"
		>
			<view class="role-spacer" :style="{ height: `${roleTopSpacer}px` }"></view>
			<view
				v-for="entry in visibleRoleEntries"
				:key="entry.role.id"
				class="role-item"
				:class="{ active: entry.role.id === selectedRoleId, 'menu-open': openMenuRoleId === entry.role.id }"
				@click="$emit('select', entry.role.id)"
			>
				<view class="role-avatar">
					<image class="role-avatar-image" :src="getRoleAvatarSrc(entry.role)" mode="aspectFill"></image>
				</view>
				<view class="role-main">
					<text class="role-name">{{ collapsed ? (entry.role.name || '').slice(0, 1) : entry.role.name }}</text>
					<text v-if="!collapsed" class="role-kb">绑定 {{ (entry.role.boundKbIds || []).length }} 个知识库</text>
				</view>
				<view v-if="!collapsed" class="role-actions">
					<view class="more-wrap">
						<button
							class="more-btn"
							:class="{ active: openMenuRoleId === entry.role.id }"
							size="mini"
							@click.stop="toggleRoleMenu(entry.role.id)"
						>
							<uni-icons type="more-filled" size="14" color="#60708a"></uni-icons>
						</button>
						<view v-if="openMenuRoleId === entry.role.id" class="item-menu">
							<text class="menu-item" @click.stop="onEdit(entry.role)">编辑</text>
							<text class="menu-item danger" @click.stop="onDelete(entry.role.id)">删除</text>
						</view>
					</view>
				</view>
			</view>
			<view class="role-spacer" :style="{ height: `${roleBottomSpacer}px` }"></view>
			<view v-if="roles.length === 0" class="empty">还没有角色，点击“新建”开始</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	name: 'AgentSidebar',
	props: {
		roles: {
			type: Array,
			default: () => []
		},
		selectedRoleId: {
			type: String,
			default: ''
		},
		collapsed: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			openMenuRoleId: '',
			roleScrollTop: 0,
			roleViewportH: 0,
			roleItemH: 86,
			roleOverscan: 4
		};
	},
	computed: {
		roleStartIndex() {
			if (!this.roles.length) return 0;
			return Math.max(0, Math.floor(this.roleScrollTop / this.roleItemH) - this.roleOverscan);
		},
		roleEndIndex() {
			if (!this.roles.length) return 0;
			const visibleCount = Math.ceil((this.roleViewportH || 320) / this.roleItemH) + this.roleOverscan * 2;
			return Math.min(this.roles.length, this.roleStartIndex + visibleCount);
		},
		visibleRoleEntries() {
			return this.roles.slice(this.roleStartIndex, this.roleEndIndex).map((role, offset) => ({
				role,
				index: this.roleStartIndex + offset
			}));
		},
		roleTopSpacer() {
			return this.roleStartIndex * this.roleItemH;
		},
		roleBottomSpacer() {
			return Math.max(0, (this.roles.length - this.roleEndIndex) * this.roleItemH);
		}
	},
	watch: {
		roles: {
			deep: true,
			handler() {
				this.$nextTick(() => this.measureRoleViewport());
			}
		},
		collapsed() {
			this.$nextTick(() => this.measureRoleViewport());
		}
	},
	mounted() {
		this.$nextTick(() => this.measureRoleViewport());
	},
	methods: {
		getRoleAvatarSrc(role) {
			const data = role || {};
			return (
				data.avatarUrl ||
				data.avatar ||
				data.iconUrl ||
				"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect x='1' y='1' width='94' height='94' rx='47' fill='%23ffffff' stroke='%23d5e1fa' stroke-width='2'/%3E%3Ctext x='48' y='58' font-size='34' text-anchor='middle'%3E%F0%9F%A4%96%3C/text%3E%3C/svg%3E"
			);
		},
		toggleRoleMenu(roleId) {
			this.openMenuRoleId = this.openMenuRoleId === roleId ? '' : roleId;
		},
		closeMenus() {
			this.openMenuRoleId = '';
		},
		onEdit(role) {
			this.openMenuRoleId = '';
			this.$emit('edit', role);
		},
		onDelete(roleId) {
			this.openMenuRoleId = '';
			this.$emit('delete', roleId);
		},
		onRoleScroll(e) {
			const d = e && e.detail ? e.detail : {};
			this.roleScrollTop = Number(d.scrollTop || 0);
			if (d.scrollHeight && d.scrollTop != null && this.roleViewportH <= 0) {
				const viewport = Number(d.scrollHeight) - Number(d.deltaY || 0);
				if (viewport > 0) this.roleViewportH = Math.min(viewport, 600);
			}
		},
		measureRoleViewport() {
			const q = uni.createSelectorQuery().in(this);
			q.select('.role-list').boundingClientRect((rect) => {
				if (rect && rect.height) this.roleViewportH = rect.height;
			});
			q.exec();
		}
	}
};
</script>

<style scoped>
.sidebar {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	background: linear-gradient(180deg, #eef3ff 0%, #e6edf9 100%);
	border-right: 1px solid #e6ebf5;
	min-width: 0;
	box-sizing: border-box;
	overflow: hidden;
}

.sidebar-header {
	flex: 0 0 56px;
	height: 56px;
	min-height: 56px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	padding: 0 12px;
	gap: 8px;
	flex-wrap: nowrap;
	border-bottom: 1px solid #e6ebf5;
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(8px);
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
	min-width: 0;
}

.title {
	flex: 0 1 auto;
	min-width: 0;
	font-size: 15px;
	font-weight: 600;
	color: #111827;
	line-height: 1.25;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
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

.plus-text {
	font-size: 18px;
	font-weight: 600;
	line-height: 1;
	transform: translateY(-1px);
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

.role-list {
	flex: 1;
	padding: 14rpx 12rpx 12rpx;
	min-width: 0;
	box-sizing: border-box;
	overflow-x: hidden;
	scrollbar-width: none;
	-ms-overflow-style: none;
}

.role-spacer {
	width: 100%;
	flex-shrink: 0;
}

.role-list::-webkit-scrollbar {
	display: none;
}

.role-item {
	width: 100%;
	background: rgba(255, 255, 255, 0.96);
	border-radius: 999rpx;
	padding: 14rpx;
	margin-bottom: 14rpx;
	border: none;
	box-sizing: border-box;
	overflow: visible;
	box-shadow: none;
	transition: box-shadow 0.22s ease, background 0.22s ease;
	display: flex;
	align-items: center;
	gap: 12rpx;
	position: relative;
	z-index: 1;
	min-height: 100rpx;
}

.role-item.active {
	border: 1px solid #9cc0ff;
	box-shadow: 0 10px 26px rgba(47, 109, 255, 0.12);
	background: linear-gradient(180deg, #ffffff 0%, #f7faff 100%);
}

.role-item.menu-open {
	z-index: 50;
}

.role-avatar {
	flex-shrink: 0;
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #eef3ff 0%, #dfeaff 100%);
	border: 1px solid #d5e1fa;
	overflow: hidden;
}

.role-avatar-image {
	width: 100%;
	height: 100%;
	border-radius: 50%;
}

.role-main {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	flex: 1;
	min-width: 0;
}

.role-name {
	display: block;
	font-size: 28rpx;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.role-kb {
	display: block;
	font-size: 22rpx;
	color: #6b7280;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.role-actions {
	margin-left: auto;
	align-self: flex-start;
	position: relative;
	z-index: 3;
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
	line-height: 1;
	color: #6b7280;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 999px;
	display: flex;
	align-items: center;
	justify-content: center;
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
	top: calc(100% + 12rpx);
	right: 0;
	min-width: 116rpx;
	background: #fff;
	border: 1px solid #e6ecf7;
	border-radius: 16rpx;
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
	overflow: hidden;
	z-index: 120;
}

.menu-item {
	display: block;
	padding: 12rpx 16rpx;
	font-size: 22rpx;
	color: #2f6dff;
	background: #fff;
}

.action {
	font-size: 22rpx;
	color: #2f6dff;
	font-weight: 500;
	transition: opacity 0.2s ease;
}

.action.danger {
	color: #ef4444;
}

.menu-item.danger {
	color: #ef4444;
}

.empty {
	padding: 16rpx 14rpx;
	font-size: 24rpx;
	color: #74809a;
	margin-top: 14rpx;
	background: rgba(255, 255, 255, 0.72);
	border: 1px solid #e6ecf7;
	border-radius: 999rpx;
	box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
	text-align: center;
}

.sidebar.collapsed .sidebar-header {
	padding: 0 8px;
	justify-content: flex-end;
}

.sidebar.collapsed .role-list {
	padding: 14rpx 8rpx 8rpx;
}

.sidebar.collapsed .role-item {
	padding: 12rpx 8rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0;
}

.sidebar.collapsed .role-main {
	align-items: center;
	flex: none;
}

.sidebar.collapsed .role-name {
	width: 44rpx;
	height: 44rpx;
	line-height: 44rpx;
	text-align: center;
	border-radius: 50%;
	background: #edf3ff;
	font-size: 24rpx;
}

.sidebar.collapsed .role-avatar {
	display: none;
}

/* #ifdef H5 */
.header-primary-btn:hover {
	filter: brightness(1.03);
}

.header-icon-btn:hover {
	background: #f9fbff;
	border-color: #cfd9eb;
}

.role-item:hover {
	animation: roleItemHoverTint 0.22s ease both;
}

.role-item.active:hover {
	box-shadow: 0 12px 28px rgba(47, 109, 255, 0.16);
}

.role-item:not(.active):hover {
	background: #f9fbff;
	box-shadow: none;
}

.more-btn:hover {
	background: #f3f7ff;
	border-color: #d8e4fa;
}

.menu-item:hover {
	background: #f7faff;
}

.action:hover {
	opacity: 0.86;
}

@keyframes roleItemHoverTint {
	from {
		background: rgba(255, 255, 255, 0.96);
	}
	to {
		background: #f9fbff;
	}
}
/* #endif */

.sidebar.collapsed .empty {
	padding: 12rpx 6rpx;
	text-align: center;
	font-size: 20rpx;
}

.sidebar.collapsed .header-icon-btn {
	width: 28px;
	min-width: 28px;
}

.sidebar.collapsed .header-actions {
	width: 100%;
	justify-content: flex-end;
}
</style>
