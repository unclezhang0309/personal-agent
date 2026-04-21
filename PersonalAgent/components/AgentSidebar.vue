<template>
	<view class="sidebar" :class="{ collapsed }">
		<view class="sidebar-header">
			<text v-if="!collapsed" class="title">我的智能体</text>
			<view class="header-actions">
				<button v-if="!collapsed" class="header-primary-btn" size="mini" @click="$emit('create')">+新建</button>
				<button class="header-icon-btn" size="mini" @click="$emit('toggle-collapse')">
					<uni-icons :type="collapsed ? 'right' : 'left'" size="14" color="#2f6dff"></uni-icons>
				</button>
			</view>
		</view>
		<scroll-view class="role-list" scroll-y>
			<view
				v-for="role in roles"
				:key="role.id"
				class="role-item"
				:class="{ active: role.id === selectedRoleId }"
				@click="$emit('select', role.id)"
			>
				<view class="role-main">
					<text class="role-name">{{ collapsed ? (role.name || '').slice(0, 1) : role.name }}</text>
					<text v-if="!collapsed" class="role-kb">绑定 {{ (role.boundKbIds || []).length }} 个知识库</text>
				</view>
				<view v-if="!collapsed" class="role-actions">
					<text class="action" @click.stop="$emit('edit', role)">编辑</text>
					<text class="action danger" @click.stop="$emit('delete', role.id)">删除</text>
				</view>
			</view>
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
	}
};
</script>

<style scoped>
.sidebar {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	background: #f8f9fb;
	border-right: 1px solid #eceff4;
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
	border-bottom: 1px solid #ececec;
}

.header-actions {
	margin-left: auto;
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
}

.title {
	flex: 1;
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

.role-list {
	flex: 1;
	padding: 0 12rpx 12rpx;
	min-width: 0;
	box-sizing: border-box;
	overflow-x: hidden;
}

.role-item {
	width: 100%;
	background: #fff;
	border-radius: 12rpx;
	padding: 16rpx;
	margin-bottom: 12rpx;
	border: 1px solid transparent;
	box-sizing: border-box;
	overflow: hidden;
}

.role-item.active {
	border-color: #3c7cff;
	box-shadow: 0 0 0 1px rgba(60, 124, 255, 0.15);
}

.role-main {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
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
	color: #777;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.role-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 10rpx;
}

.action {
	font-size: 22rpx;
	color: #2f6dff;
}

.action.danger {
	color: #e74c3c;
}

.empty {
	padding: 20rpx;
	font-size: 24rpx;
	color: #888;
}

.sidebar.collapsed .sidebar-header {
	padding: 0 8px;
	justify-content: flex-end;
}

.sidebar.collapsed .role-list {
	padding: 0 8rpx 8rpx;
}

.sidebar.collapsed .role-item {
	padding: 12rpx 8rpx;
	display: flex;
	justify-content: center;
	align-items: center;
}

.sidebar.collapsed .role-main {
	align-items: center;
}

.sidebar.collapsed .role-name {
	width: 44rpx;
	height: 44rpx;
	line-height: 44rpx;
	text-align: center;
	border-radius: 50%;
	background: #eef3ff;
	font-size: 24rpx;
}

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
