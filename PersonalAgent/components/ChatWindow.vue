<template>
	<view class="chat-window" :class="{ 'chat-window--web': !isMobile, 'chat-window--mobile': isMobile }">
		<view class="chat-header">
			<view class="left">
				<button v-if="isMobile" size="mini" class="composer-settings-btn header-nav-btn" @click="$emit('toggle-sidebar')">
					<uni-icons type="person-filled" size="12" color="#2f6dff"></uni-icons>
					<text>角色</text>
				</button>
				<text v-if="!isMobile" class="title">{{ selectedRole ? selectedRole.name : '未选择角色' }}</text>
			</view>
			<view class="right">
				<button v-if="showClearInHeader" size="mini" class="clear-ghost-btn" @click="$emit('clear-session')">清空对话</button>
				<button
					v-if="showKbButton"
					size="mini"
					class="composer-settings-btn header-nav-btn"
					@click="$emit('open-kb')"
				>
					<text class="header-nav-emoji">📚</text>
					<text>知识库</text>
				</button>
			</view>
		</view>

		<view v-if="isMobile" class="conversation-bar">
			<text class="conversation-title">{{ selectedRole ? selectedRole.name : '未选择角色' }}</text>
			<button v-if="canShowClearOnMobileBar" size="mini" class="conversation-clear-btn" @click="$emit('clear-session')">
				清空对话
			</button>
		</view>

		<scroll-view
			class="message-scroll"
			scroll-y
			:scroll-with-animation="true"
			:scroll-into-view="scrollIntoView"
			:enable-flex="true"
			@scroll="onMessageScroll"
		>
			<view class="message-inner">
				<view v-if="!selectedRole" class="empty">请先在左侧创建或选择角色</view>
				<view v-else-if="messages.length === 0" class="empty">开始和 {{ selectedRole.name }} 对话吧</view>
				<view v-for="msg in messages" :key="msg.id" :id="'msg-' + msg.id" class="msg" :class="msg.role">
					<text class="content">{{ msg.content }}</text>
				</view>
				<view id="chat-anchor-bottom" class="chat-anchor-bottom"></view>
			</view>
		</scroll-view>

		<view class="composer-bottom">
			<view class="composer">
				<view v-if="showNewMsgTip" class="new-msg-tip" @click="scrollToBottomForce">
					<text class="new-msg-text">新消息</text>
				</view>
				<view class="composer-frame">
					<textarea
						class="input"
						:value="inputText"
						placeholder="输入消息..."
						maxlength="2000"
						:auto-height="true"
						@input="$emit('update:inputText', $event.detail.value)"
						@keydown="onInputKeydown"
					/>
					<view class="composer-actions">
						<button type="default" class="composer-settings-btn" @click="$emit('open-settings')">设置</button>
						<view class="composer-actions-end">
							<button v-if="showClearInComposer" size="mini" class="clear-btn" @click="$emit('clear-session')">清空对话</button>
							<button class="send-btn" type="primary" @click="$emit('send')">发送</button>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'ChatWindow',
	props: {
		isMobile: Boolean,
		showKbButton: {
			type: Boolean,
			default: false
		},
		showClearInHeader: {
			type: Boolean,
			default: true
		},
		showClearInComposer: {
			type: Boolean,
			default: false
		},
		hasMessages: {
			type: Boolean,
			default: false
		},
		selectedRole: {
			type: Object,
			default: null
		},
		messages: {
			type: Array,
			default: () => []
		},
		inputText: {
			type: String,
			default: ''
		}
	},
	data() {
		return {
			scrollIntoView: '',
			stickToBottom: true,
			showNewMsgTip: false,
			prevMsgLen: 0,
			scrollViewClientH: 0
		};
	},
	computed: {
		canShowClearOnMobileBar() {
			return this.isMobile && !!this.selectedRole && !!this.hasMessages;
		}
	},
	watch: {
		isMobile() {
			this.measureScrollArea();
		},
		messages: {
			deep: true,
			handler(newList) {
				const len = (newList && newList.length) || 0;
				if (len < this.prevMsgLen) {
					this.prevMsgLen = len;
					this.stickToBottom = true;
					this.showNewMsgTip = false;
					this.$nextTick(() => this.scrollToBottom());
					return;
				}
				const grew = len > this.prevMsgLen;
				this.prevMsgLen = len;
				if (!grew) return;
				this.$nextTick(() => {
					if (this.stickToBottom) {
						this.scrollToBottom();
						this.showNewMsgTip = false;
					} else {
						this.showNewMsgTip = true;
					}
				});
			}
		},
		selectedRole: {
			handler() {
				this.stickToBottom = true;
				this.showNewMsgTip = false;
				this.prevMsgLen = (this.messages && this.messages.length) || 0;
				this.$nextTick(() => {
					this.measureScrollArea();
					this.scrollToBottom();
				});
			}
		}
	},
	mounted() {
		this.prevMsgLen = (this.messages && this.messages.length) || 0;
		this.measureScrollArea();
		this.$nextTick(() => this.scrollToBottom());
		// #ifdef H5
		this._onWinResize = () => this.measureScrollArea();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', this._onWinResize);
		}
		// #endif
	},
	beforeUnmount() {
		// #ifdef H5
		if (typeof window !== 'undefined' && this._onWinResize) {
			window.removeEventListener('resize', this._onWinResize);
		}
		// #endif
	},
	methods: {
		measureScrollArea() {
			this.$nextTick(() => {
				const q = uni.createSelectorQuery().in(this);
				q.select('.message-scroll').boundingClientRect((rect) => {
					if (rect && rect.height) this.scrollViewClientH = rect.height;
				});
				q.exec();
			});
		},
		onMessageScroll(e) {
			const d = e.detail || {};
			let scrollTop = d.scrollTop;
			let scrollHeight = d.scrollHeight;
			if (scrollTop == null) return;
			if (scrollHeight == null) {
				// #ifdef H5
				try {
					const t = e.target;
					if (t && typeof t.scrollHeight === 'number') scrollHeight = t.scrollHeight;
				} catch (err) {
					void err;
				}
				// #endif
			}
			if (scrollHeight == null) return;
			const clientH = this.scrollViewClientH || 200;
			const distBottom = scrollHeight - scrollTop - clientH;
			const nearBottom = distBottom < 80;
			this.stickToBottom = nearBottom;
			if (nearBottom) this.showNewMsgTip = false;
		},
		scrollToBottom() {
			this.scrollIntoView = '';
			this.$nextTick(() => {
				this.scrollIntoView = 'chat-anchor-bottom';
			});
		},
		scrollToBottomForce() {
			this.stickToBottom = true;
			this.showNewMsgTip = false;
			this.scrollToBottom();
		},
		onInputKeydown(e) {
			const evt = (e && e.detail && e.detail.event) || e;
			if (!evt) return;
			const isEnter = evt.key === 'Enter' || evt.keyCode === 13;
			if (!isEnter) return;
			if (evt.ctrlKey || evt.metaKey) {
				return;
			}
			if (typeof evt.preventDefault === 'function') evt.preventDefault();
			this.$emit('send');
		}
	}
};
</script>

<style scoped>
.chat-window {
	height: 100%;
	min-height: 0;
	overflow: hidden;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	position: relative;
	background: linear-gradient(180deg, #f7f9ff 0%, #f4f7fb 40%, #f8fafc 100%);
}

.chat-header {
	flex: 0 0 56px;
	height: 56px;
	min-height: 56px;
	padding: 0 12px;
	border-bottom: 1px solid #e6ebf5;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(8px);
}

.left,
.right {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.left {
	flex: 1;
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

.header-primary-btn,
.header-secondary-btn {
	margin: 0;
	box-sizing: border-box;
	height: 28px;
	min-height: 28px;
	line-height: 26px;
	padding: 0 12px;
	font-size: 13px;
	font-weight: 500;
	border-radius: 999px;
	transition: all 0.2s ease;
}

.header-primary-btn {
	background: linear-gradient(135deg, #2f6dff 0%, #4f87ff 100%);
	color: #fff;
	border: 1px solid #2f6dff;
	box-shadow: 0 6px 14px rgba(47, 109, 255, 0.22);
}

.header-secondary-btn {
	background: #f6f8fd;
	color: #374151;
	border: 1px solid #e3e8f3;
}

.header-primary-btn::after,
.header-secondary-btn::after {
	border: none;
}

.message-scroll {
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
	z-index: 1;
	padding-top: 4px;
}

.message-inner {
	padding: 12px;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	box-sizing: border-box;
	min-height: 100%;
	gap: 2px;
}

/* 桌面 Web：消息列与输入区同宽，背景仍为整窗；略宽于原 560px 输入框 */
.chat-window--web {
	--chat-thread-width: min(680px, calc(100% - 32px));
}

.chat-window--web .message-inner {
	max-width: var(--chat-thread-width);
	margin-left: auto;
	margin-right: auto;
	width: 100%;
}

.chat-window--web .composer-bottom {
	max-width: var(--chat-thread-width);
	width: 100%;
	margin-left: auto;
	margin-right: auto;
}

.chat-window--web .composer {
	width: 100%;
	max-width: 100%;
}

.chat-window--web .composer-frame {
	width: 100%;
	max-width: 100%;
}

.chat-window--web .input {
	width: 100%;
	max-width: 100%;
}

/* 移动端：消息列与输入区同宽（与两侧留白一致） */
.chat-window--mobile {
	--chat-thread-width: calc(100% - 24px);
}

.chat-window--mobile .message-inner {
	max-width: var(--chat-thread-width);
	margin-left: auto;
	margin-right: auto;
	width: 100%;
}

.chat-window--mobile .composer-bottom {
	max-width: var(--chat-thread-width);
	width: 100%;
	margin-left: auto;
	margin-right: auto;
}

.chat-window--mobile .composer {
	width: 100%;
	max-width: 100%;
	margin: 0 0 8px;
}

.chat-window--mobile .composer-frame {
	width: 100%;
	max-width: 100%;
}

.chat-window--mobile .input {
	width: 100%;
	max-width: 100%;
}

.chat-anchor-bottom {
	height: 1px;
	width: 100%;
	flex-shrink: 0;
}

.conversation-bar {
	flex: 0 0 42px;
	height: 42px;
	min-height: 42px;
	padding: 0 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	background: linear-gradient(180deg, rgba(232, 240, 255, 0.9) 0%, rgba(224, 235, 255, 0.86) 100%);
	backdrop-filter: blur(6px);
	box-sizing: border-box;
}

.conversation-title {
	flex: 1;
	min-width: 0;
	font-size: 13px;
	font-weight: 500;
	color: #374151;
	line-height: 1.25;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.conversation-clear-btn {
	margin: 0;
	height: 24px;
	min-height: 24px;
	line-height: 22px;
	padding: 0 10px;
	font-size: 12px;
	font-weight: 500;
	color: #4b5563;
	background: rgba(248, 250, 252, 0.92);
	border: 1px solid #d9e1ee;
	border-radius: 999px;
	box-sizing: border-box;
	transition: all 0.2s ease;
}

.conversation-clear-btn::after {
	border: none;
}

.clear-ghost-btn {
	margin: 0;
	min-height: 28px;
	height: 28px;
	line-height: 26px;
	padding: 0 12px;
	font-size: 13px;
	font-weight: 500;
	box-sizing: border-box;
	background: rgba(248, 250, 252, 0.46);
	color: #4b5563;
	border-radius: 999px;
	border: 1px solid rgba(191, 204, 226, 0.68);
	transition: all 0.2s ease;
}

.clear-ghost-btn::after {
	border: none;
}

.empty {
	margin-top: 40px;
	padding: 12px 16px;
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid #e7edf7;
	border-radius: 999px;
	box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
	text-align: center;
	color: #74809a;
	font-size: 14px;
	width: fit-content;
	align-self: center;
}

.msg {
	max-width: 86%;
	width: fit-content;
	padding: 11px 14px;
	border-radius: 22px;
	margin-bottom: 10px;
	display: inline-flex;
	flex-direction: column;
	gap: 4px;
	box-sizing: border-box;
	box-shadow: none;
	border: 1px solid transparent;
	transition: border-color 0.2s ease;
}

.msg.user {
	align-self: flex-end;
	background: linear-gradient(135deg, #2f6dff 0%, #5b93ff 100%);
	color: #fff;
	border-color: rgba(255, 255, 255, 0.22);
	border-bottom-right-radius: 6px;
	position: relative;
	z-index: 2;
}

.msg.assistant {
	background: rgba(255, 255, 255, 0.96);
	color: #1f2937;
	border-color: #e9eef8;
	border-bottom-left-radius: 6px;
	z-index: 1;
}

.content {
	font-size: 15px;
	line-height: 1.58;
	white-space: pre-wrap;
	word-break: break-word;
	overflow-wrap: anywhere;
}

.composer-bottom {
	flex: 0 0 auto;
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-sizing: border-box;
	z-index: 10;
	padding-bottom: max(8px, env(safe-area-inset-bottom));
}

.new-msg-tip {
	position: absolute;
	right: 10px;
	bottom: 100%;
	margin-bottom: 6px;
	z-index: 5;
	padding: 8px 14px;
	background: linear-gradient(135deg, rgba(47, 109, 255, 0.96), rgba(91, 147, 255, 0.96));
	border-radius: 999px;
	box-shadow: 0 8px 20px rgba(47, 109, 255, 0.28);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.new-msg-text {
	font-size: 13px;
	color: #fff;
}

.composer {
	position: relative;
	margin: 0 0 8px;
	align-self: center;
	overflow: visible;
	padding: 0;
	border: none;
	border-radius: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
	background: transparent;
	z-index: 2;
	width: fit-content;
	max-width: calc(100% - 16px);
	box-sizing: border-box;
}

.composer-frame {
	width: min(560px, 72vw);
	max-width: 100%;
	background: rgba(255, 255, 255, 0.94);
	border-radius: 28px;
	padding: 8px 12px 10px;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	gap: 6px;
	border: 1px solid #dfe7f5;
	box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input {
	width: 100%;
	min-height: 44px;
	max-height: 140px;
	display: block;
	background: transparent;
	padding: 4px 8px;
	box-sizing: border-box;
	line-height: 1.5;
	font-size: 14px;
	overflow-y: auto;
	border: none;
	color: #111827;
}

.input::placeholder {
	color: #96a1b5;
}

.composer-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
	width: 100%;
}

.composer-actions-end {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	flex: 1;
	min-width: 0;
}

.composer-settings-btn {
	flex-shrink: 0;
	margin: 0;
	box-sizing: border-box;
	min-height: 32px;
	height: 32px;
	line-height: 30px;
	padding: 0 14px;
	font-size: 14px;
	font-weight: 500;
	color: #2f6dff;
	background: #fff;
	border: 1px solid #2f6dff;
	border-radius: 999px;
	transition: all 0.2s ease;
}

.composer-settings-btn::after {
	border: none;
}

.header-nav-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
}

.header-nav-emoji {
	font-size: 12px;
	line-height: 1;
}

.send-btn {
	margin: 0;
	box-sizing: border-box;
	min-height: 32px;
	height: 32px;
	line-height: 30px;
	padding: 0 16px;
	font-size: 14px;
	font-weight: 500;
	color: #fff;
	background: linear-gradient(135deg, #2f6dff 0%, #4f87ff 100%);
	border-radius: 999px;
	border: 1px solid #2f6dff;
	box-shadow: 0 6px 16px rgba(47, 109, 255, 0.24);
	transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.send-btn::after {
	border: none;
}

.clear-btn {
	margin: 0;
	min-height: 32px;
	height: 32px;
	line-height: 30px;
	padding: 0 14px;
	font-size: 14px;
	font-weight: 500;
	box-sizing: border-box;
	background: #f7f9fc;
	color: #4b5563;
	border-radius: 999px;
	border: 1px solid #e3e9f4;
	transition: all 0.2s ease;
}

.clear-btn::after {
	border: none;
}

/* #ifdef H5 */
.header-primary-btn:hover,
.send-btn:hover {
	filter: brightness(1.03);
}

.header-secondary-btn:hover,
.clear-ghost-btn:hover,
.composer-settings-btn:hover,
.clear-btn:hover {
	border-color: #cfd8e8;
	background: #ffffff;
}

.conversation-clear-btn:hover {
	color: #374151;
	border-color: #cfd8e8;
	background: #ffffff;
}

.msg:hover {
	box-shadow: none;
}

.msg.user:hover {
	box-shadow: none;
}

.composer-frame:focus-within {
	border-color: #bfd4ff;
	box-shadow: 0 14px 32px rgba(47, 109, 255, 0.16);
}

.new-msg-tip:hover {
	transform: translateY(-1px);
	box-shadow: 0 12px 24px rgba(47, 109, 255, 0.34);
}

.send-btn:active,
.header-primary-btn:active {
	transform: translateY(1px);
}
/* #endif */

</style>
