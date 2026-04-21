<template>
	<view v-if="visible" class="overlay" @click.self="$emit('close')">
		<view class="panel">
			<view class="header">
				<text class="title">{{ mode === 'edit' ? '编辑角色' : '创建角色' }}</text>
				<text class="close" @click="$emit('close')">关闭</text>
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
					<label v-for="kb in kbs" :key="kb.id" class="kb-item">
						<checkbox :checked="(formData.boundKbIds || []).includes(kb.id)" @click="toggleKb(kb.id)" />
						<text>{{ kb.name }}</text>
					</label>
					<text v-if="kbs.length === 0" class="hint">知识库，请先在知识库面板创建</text>
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
			headOptions,
			bodyOptions,
			legOptions,
			shoeOptions
		};
	},
	computed: {},
	watch: {
		visible(next) {
			if (next) this.initForm();
		}
	},
	methods: {
		initForm() {
			this.nameError = '';
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
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1800;
	padding: 24rpx;
	box-sizing: border-box;
}

.panel {
	width: min(760rpx, 96vw);
	max-height: 88vh;
	background: #fff;
	border-radius: 20rpx;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
}

.header {
	padding: 22rpx;
	border-bottom: 1px solid #efefef;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.title {
	font-size: 32rpx;
	font-weight: 600;
}

.close {
	color: #666;
	font-size: 24rpx;
}

.form {
	padding: 20rpx 22rpx;
	overflow-y: auto;
}

.label {
	display: block;
	font-size: 24rpx;
	color: #666;
	margin: 14rpx 0 10rpx;
}

.input {
	height: 72rpx;
	background: #f8f9fb;
	border-radius: 12rpx;
	padding: 0 20rpx;
	border: 1px solid transparent;
	box-sizing: border-box;
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
	background: #f8f9fb;
	border-radius: 12rpx;
	padding: 14rpx 20rpx;
	box-sizing: border-box;
	font-size: 24rpx;
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
	background: #f2f5fb;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	color: #2f6dff;
	font-weight: 500;
}

.kb-list {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	margin-top: 8rpx;
}

.kb-item {
	display: flex;
	align-items: center;
	gap: 10rpx;
	font-size: 24rpx;
}

.hint {
	font-size: 22rpx;
	color: #999;
}

.footer {
	border-top: 1px solid #efefef;
	padding: 18rpx 22rpx;
	display: flex;
	justify-content: flex-end;
	gap: 14rpx;
}

.btn {
	margin: 0;
	line-height: 1.9;
	font-size: 24rpx;
}

.btn.ghost {
	background: #f3f4f8;
	color: #333;
}

.btn.primary {
	background: #2f6dff;
	color: #fff;
}

@media (max-width: 768px) {
	.overlay {
		align-items: flex-end;
		padding: 8px;
	}

	.panel {
		width: 100%;
		max-height: 92vh;
		border-radius: 12px 12px 0 0;
	}

	.form {
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	}
}
</style>
