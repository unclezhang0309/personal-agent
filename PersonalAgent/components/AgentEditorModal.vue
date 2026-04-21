<template>
	<view v-if="visible" class="overlay" @click.self="$emit('close')">
		<view class="panel">
			<view class="header">
				<text class="title">{{ mode === 'edit' ? '编辑角色' : '创建角色' }}</text>
			</view>

			<view class="form">
				<text class="label">角色名称</text>
				<input class="input" :class="{ 'input--error': nameError }" :value="formData.name" placeholder="例如：学习助手" @input="onNameInput" />
				<text v-if="nameError" class="field-error">{{ nameError }}</text>

				<text class="label">身份描述</text>
				<textarea
					class="textarea"
					:value="formData.description"
					placeholder="例如：你是一位耐心、结构化的学习助手，擅长把复杂问题拆解为可执行步骤。"
					maxlength="300"
					@input="onDescriptionInput"
				/>

				<text class="label">角色部件（预设）</text>
				<view class="row">
					<text class="part-label">🧢 头部</text>
					<swiper
						class="part-swiper"
						:current="getPartIndex('head')"
						:circular="true"
						:indicator-dots="false"
						:autoplay="false"
						:duration="250"
						@change="onPartSwiperChange('head', $event)"
					>
						<swiper-item v-for="opt in headOptions" :key="`head-${opt.value}`">
							<view class="part-card">{{ opt.text }}</view>
						</swiper-item>
					</swiper>
				</view>
				<view class="row">
					<text class="part-label">👕 衣服</text>
					<swiper
						class="part-swiper"
						:current="getPartIndex('body')"
						:circular="true"
						:indicator-dots="false"
						:autoplay="false"
						:duration="250"
						@change="onPartSwiperChange('body', $event)"
					>
						<swiper-item v-for="opt in bodyOptions" :key="`body-${opt.value}`">
							<view class="part-card">{{ opt.text }}</view>
						</swiper-item>
					</swiper>
				</view>
				<view class="row">
					<text class="part-label">👖 裤子</text>
					<swiper
						class="part-swiper"
						:current="getPartIndex('legs')"
						:circular="true"
						:indicator-dots="false"
						:autoplay="false"
						:duration="250"
						@change="onPartSwiperChange('legs', $event)"
					>
						<swiper-item v-for="opt in legOptions" :key="`legs-${opt.value}`">
							<view class="part-card">{{ opt.text }}</view>
						</swiper-item>
					</swiper>
				</view>
				<view class="row">
					<text class="part-label">👟 鞋子</text>
					<swiper
						class="part-swiper"
						:current="getPartIndex('shoes')"
						:circular="true"
						:indicator-dots="false"
						:autoplay="false"
						:duration="250"
						@change="onPartSwiperChange('shoes', $event)"
					>
						<swiper-item v-for="opt in shoeOptions" :key="`shoes-${opt.value}`">
							<view class="part-card">{{ opt.text }}</view>
						</swiper-item>
					</swiper>
				</view>

				<text class="label">绑定知识库（可多选）</text>
				<view class="kb-list">
					<input
						class="kb-search-input"
						:value="kbSearchText"
						placeholder="搜索知识库名称..."
						@input="onKbSearchInput"
					/>
					<view v-if="selectedKbs.length > 0" class="selected-kb-wrap">
						<text class="selected-kb-title">已选 {{ selectedKbs.length }} 项</text>
						<view class="selected-kb-tags">
							<view v-for="kb in selectedKbs" :key="`selected-${kb.id}`" class="selected-kb-tag">
								<text class="selected-kb-name">{{ kb.name }}</text>
								<text class="selected-kb-remove" @click="toggleKb(kb.id)">×</text>
							</view>
						</view>
					</view>
					<scroll-view
						v-if="kbs.length > 0"
						class="kb-option-list"
						scroll-y
						:show-scrollbar="false"
						@scroll="onKbListScroll"
					>
						<view class="kb-list-spacer" :style="{ height: `${kbListTopSpacer}px` }"></view>
						<view
							v-for="kb in visibleFilteredKbs"
							:key="kb.id"
							class="kb-item"
							:class="{ selected: (formData.boundKbIds || []).includes(kb.id) }"
							@click="toggleKb(kb.id)"
						>
							<text class="kb-item-name">{{ kb.name }}</text>
							<text class="kb-item-check">{{ (formData.boundKbIds || []).includes(kb.id) ? '已选' : '选择' }}</text>
						</view>
						<view class="kb-list-spacer" :style="{ height: `${kbListBottomSpacer}px` }"></view>
						<text v-if="filteredKbs.length === 0" class="hint">没有匹配的知识库</text>
					</scroll-view>
					<text v-else class="hint">知识库为空，请先在知识库面板创建</text>
				</view>
			</view>

			<view class="footer">
				<button class="btn ghost" @click="$emit('close')">取消</button>
				<button class="btn primary" @click="onSubmit">保存</button>
			</view>
		</view>
	</view>
</template>

<script>
const headOptions = [
	{ text: '🧢 头-棒球帽', value: '🧢 头-棒球帽' },
	{ text: '🎩 头-礼帽', value: '🎩 头-礼帽' },
	{ text: '👒 头-草帽', value: '👒 头-草帽' },
	{ text: '⛑️ 头-头盔', value: '⛑️ 头-头盔' }
];
const bodyOptions = [
	{ text: '👕 衣-短袖', value: '👕 衣-短袖' },
	{ text: '🧥 衣-外套', value: '🧥 衣-外套' },
	{ text: '👔 衣-衬衫', value: '👔 衣-衬衫' },
	{ text: '🥼 衣-大褂', value: '🥼 衣-大褂' }
];
const legOptions = [
	{ text: '👖 裤-牛仔裤', value: '👖 裤-牛仔裤' },
	{ text: '🩳 裤-短裤', value: '🩳 裤-短裤' },
	{ text: '👖 裤-运动裤', value: '👖 裤-运动裤' },
	{ text: '👖 裤-休闲裤', value: '👖 裤-休闲裤' }
];
const shoeOptions = [
	{ text: '👟 鞋-运动鞋', value: '👟 鞋-运动鞋' },
	{ text: '🥾 鞋-靴子', value: '🥾 鞋-靴子' },
	{ text: '👞 鞋-皮鞋', value: '👞 鞋-皮鞋' },
	{ text: '🥿 鞋-平底鞋', value: '🥿 鞋-平底鞋' }
];

function createDefaultForm() {
	return {
		id: '',
		name: '',
		description: '',
		avatarParts: {
			head: headOptions[0].value,
			body: bodyOptions[0].value,
			legs: legOptions[0].value,
			shoes: shoeOptions[0].value
		},
		boundKbIds: []
	};
}

export default {
	name: 'AgentEditorModal',
	props: {
		visible: Boolean,
		mode: {
			type: String,
			default: 'create'
		},
		kbs: {
			type: Array,
			default: () => []
		},
		value: {
			type: Object,
			default: () => ({})
		}
	},
	data() {
		return {
			formData: createDefaultForm(),
			nameError: '',
			kbSearchText: '',
			kbListScrollTop: 0,
			kbListViewportH: 0,
			kbItemH: 56,
			kbOverscan: 4,
			headOptions,
			bodyOptions,
			legOptions,
			shoeOptions
		};
	},
	computed: {
		filteredKbs() {
			const keyword = String(this.kbSearchText || '').trim().toLowerCase();
			if (!keyword) return this.kbs;
			return this.kbs.filter((kb) => String(kb.name || '').toLowerCase().includes(keyword));
		},
		selectedKbs() {
			const selectedIds = new Set(this.formData.boundKbIds || []);
			return this.kbs.filter((kb) => selectedIds.has(kb.id));
		},
		kbStartIndex() {
			if (!this.filteredKbs.length) return 0;
			return Math.max(0, Math.floor(this.kbListScrollTop / this.kbItemH) - this.kbOverscan);
		},
		kbEndIndex() {
			if (!this.filteredKbs.length) return 0;
			const visibleCount = Math.ceil((this.kbListViewportH || 260) / this.kbItemH) + this.kbOverscan * 2;
			return Math.min(this.filteredKbs.length, this.kbStartIndex + visibleCount);
		},
		visibleFilteredKbs() {
			return this.filteredKbs.slice(this.kbStartIndex, this.kbEndIndex);
		},
		kbListTopSpacer() {
			return this.kbStartIndex * this.kbItemH;
		},
		kbListBottomSpacer() {
			return Math.max(0, (this.filteredKbs.length - this.kbEndIndex) * this.kbItemH);
		}
	},
	watch: {
		visible(next) {
			if (next) {
				this.initForm();
				this.$nextTick(() => this.measureKbListViewport());
			}
		}
	},
	methods: {
		initForm() {
			this.nameError = '';
			this.kbSearchText = '';
			const base = createDefaultForm();
			this.formData = {
				...base,
				...this.value,
				avatarParts: {
					...base.avatarParts,
					...(this.value.avatarParts || {})
				},
				boundKbIds: [...(this.value.boundKbIds || [])]
			};
		},
		onNameInput(e) {
			const d = e && e.detail;
			this.formData.name = d && d.value != null ? d.value : '';
			this.nameError = '';
		},
		onDescriptionInput(e) {
			this.formData.description = e.detail.value;
		},
		onPartSelectChange(part, value) {
			this.formData.avatarParts[part] = value;
		},
		getPartOptions(part) {
			const map = {
				head: this.headOptions,
				body: this.bodyOptions,
				legs: this.legOptions,
				shoes: this.shoeOptions
			};
			return map[part] || [];
		},
		getPartIndex(part) {
			const options = this.getPartOptions(part);
			const currentValue = this.formData.avatarParts[part];
			const index = options.findIndex((item) => item.value === currentValue);
			return index >= 0 ? index : 0;
		},
		onPartSwiperChange(part, event) {
			const current = Number(event.detail.current || 0);
			const options = this.getPartOptions(part);
			const selected = options[current];
			if (selected) this.formData.avatarParts[part] = selected.value;
		},
		toggleKb(kbId) {
			const list = new Set(this.formData.boundKbIds || []);
			if (list.has(kbId)) list.delete(kbId);
			else list.add(kbId);
			this.formData.boundKbIds = Array.from(list);
		},
		onKbSearchInput(e) {
			const d = e && e.detail;
			this.kbSearchText = d && d.value != null ? d.value : '';
			this.kbListScrollTop = 0;
			this.$nextTick(() => this.measureKbListViewport());
		},
		onKbListScroll(e) {
			const d = e && e.detail ? e.detail : {};
			this.kbListScrollTop = Number(d.scrollTop || 0);
		},
		measureKbListViewport() {
			const q = uni.createSelectorQuery().in(this);
			q.select('.kb-option-list').boundingClientRect((rect) => {
				if (rect && rect.height) this.kbListViewportH = rect.height;
			});
			q.exec();
		},
		onSubmit() {
			const name = String(this.formData.name == null ? '' : this.formData.name).trim();
			if (!name) {
				this.nameError = '请填写角色名称';
				return;
			}
			this.nameError = '';
			this.$emit('save', {
				...this.formData,
				name
			});
		}
	}
};
</script>

<style scoped>
.overlay {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.42);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1800;
	padding: 24rpx;
	box-sizing: border-box;
	backdrop-filter: blur(2px);
}

.panel {
	width: min(760rpx, 96vw);
	max-height: 88vh;
	background: #fff;
	border-radius: 24px;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	border: 1px solid #e8edf7;
	box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22);
	overflow: hidden;
}

.header {
	padding: 22rpx;
	border-bottom: 1px solid #e6ebf5;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(8px);
}

.title {
	font-size: 32rpx;
	font-weight: 600;
}

.form {
	padding: 20rpx 22rpx;
	overflow-y: auto;
}

.label {
	display: block;
	font-size: 24rpx;
	color: #5f6b80;
	margin: 14rpx 0 10rpx;
}

.input {
	height: 72rpx;
	background: #f9fbff;
	border-radius: 999rpx;
	padding: 0 20rpx;
	border: 1px solid #dbe2ef;
	box-sizing: border-box;
	transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.input--error {
	border-color: #ef4444;
	background: #fff5f5;
}

.field-error {
	display: block;
	font-size: 24rpx;
	color: #dc2626;
	margin: 8rpx 0 0 4rpx;
	line-height: 1.4;
}

.textarea {
	width: 100%;
	min-height: 140rpx;
	background: #f9fbff;
	border-radius: 24rpx;
	padding: 14rpx 20rpx;
	box-sizing: border-box;
	font-size: 24rpx;
	border: 1px solid #dbe2ef;
	transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.row {
	display: flex;
	align-items: flex-start;
	flex-direction: column;
	gap: 10rpx;
	padding: 10rpx 0 14rpx;
}

.part-label {
	font-size: 26rpx;
}

.part-swiper {
	width: 100%;
	height: 86rpx;
}

.part-card {
	height: 72rpx;
	margin: 0 2rpx;
	background: #f4f7ff;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	color: #2f6dff;
	font-weight: 500;
	border: 1px solid #dbe6fb;
}

.kb-list {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	margin-top: 8rpx;
}

.kb-search-input {
	width: 100%;
	height: 70rpx;
	min-height: 70rpx;
	background: #f9fbff;
	border: 1px solid #dbe2ef;
	border-radius: 999rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
	font-size: 24rpx;
	line-height: 70rpx;
}

.selected-kb-wrap {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.selected-kb-title {
	font-size: 22rpx;
	color: #6b7280;
}

.selected-kb-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
}

.selected-kb-tag {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	background: #edf3ff;
	border: 1px solid #d9e4ff;
	border-radius: 999rpx;
	padding: 6rpx 12rpx;
	max-width: 100%;
}

.selected-kb-name {
	font-size: 22rpx;
	color: #2f6dff;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.selected-kb-remove {
	font-size: 22rpx;
	color: #5b6b80;
	line-height: 1;
}

.kb-option-list {
	max-height: 260rpx;
	padding-right: 4rpx;
	scrollbar-width: none;
	-ms-overflow-style: none;
}

.kb-option-list::-webkit-scrollbar {
	display: none;
}

.kb-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
	font-size: 24rpx;
	background: rgba(255, 255, 255, 0.92);
	border: 1px solid #e5ebf6;
	border-radius: 999rpx;
	padding: 12rpx 14rpx;
	box-sizing: border-box;
	margin-bottom: 10rpx;
}

.kb-list-spacer {
	width: 100%;
	flex-shrink: 0;
}

.kb-item.selected {
	background: #eef4ff;
	border-color: #cfe0ff;
}

.kb-item-name {
	flex: 1;
	min-width: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kb-item-check {
	flex-shrink: 0;
	font-size: 20rpx;
	color: #2f6dff;
}

.hint {
	font-size: 22rpx;
	color: #999;
}

.footer {
	border-top: 1px solid #e6ebf5;
	padding: 18rpx 22rpx;
	display: flex;
	justify-content: flex-end;
	gap: 12rpx;
}

.btn {
	margin: 0;
	min-height: 40px;
	height: 40px;
	line-height: 38px;
	padding: 0 18px;
	font-size: 14px;
	border-radius: 999px;
	transition: all 0.2s ease;
	min-width: 96px;
	font-weight: 600;
}

.btn.ghost {
	background: #f4f7fb;
	color: #333;
	border: 1px solid rgba(191, 204, 226, 0.75);
	box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.85);
}

.btn.ghost::after {
	border: none;
}

.btn.primary {
	background: linear-gradient(135deg, #2f6dff 0%, #4f87ff 100%);
	color: #fff;
	box-shadow: 0 6px 14px rgba(47, 109, 255, 0.2);
}

/* #ifdef H5 */
.input:focus,
.textarea:focus {
	background: #fff;
	border-color: #bfd4ff;
	box-shadow: 0 0 0 3px rgba(47, 109, 255, 0.12);
}

.btn.primary:hover {
	filter: brightness(1.03);
}

.btn.ghost:hover {
	background: #fff;
	border-color: #cfd8e8;
}
/* #endif */

@media (max-width: 768px) {
	.overlay {
		align-items: flex-end;
		padding: 8px;
	}

	.panel {
		width: 100%;
		max-height: 92vh;
		border-radius: 24px 24px 0 0;
	}

	.form {
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	}

	.footer {
		padding: 14px 12px calc(14px + env(safe-area-inset-bottom));
		justify-content: space-between;
		gap: 10px;
	}

	.btn {
		flex: 1;
		min-width: 0;
		height: 44px;
		min-height: 44px;
		line-height: 42px;
		font-size: 15px;
	}

	.kb-option-list {
		max-height: 200px;
	}
}
</style>
