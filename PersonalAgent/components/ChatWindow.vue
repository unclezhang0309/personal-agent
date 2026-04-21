<template>
	<view class="chat-window" :class="{ 'chat-window--web': !isMobile, 'chat-window--mobile': isMobile }">
		<view class="chat-header">
			<view class="left">
				<button v-if="isMobile" size="mini" class="header-secondary-btn" @click="$emit('toggle-sidebar')">角色</button>
				<text v-if="!isMobile" class="title">{{ selectedRole ? selectedRole.name : '未选择角色' }}</text>
			</view>
			<view class="right">
				<button v-if="showClearInHeader" size="mini" class="header-secondary-btn" @click="$emit('clear-session')">清空对话</button>
				<button v-if="showKbButton" size="mini" class="header-primary-btn" @click="$emit('open-kb')">知识库</button>
			</view>
		</view>

		<view v-if="isMobile" class="conversation-bar">
			<text class="conversation-title">{{ selectedRole ? selectedRole.name : '未选择角色' }}</text>
			<button v-if="canShowClearOnMobileBar" size="mini" class="header-secondary-btn" @click="$emit('clear-session')">清空对话</button>
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
					<!-- <text class="role">{{ msg.role === 'user' ? '你' : selectedRole.name }}</text> -->
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
}

.chat-header {
	flex: 0 0 56px;
	height: 56px;
	min-height: 56px;
	padding: 0 12px;
	border-bottom: 1px solid #ececec;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
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
	border-radius: 6px;
}

.header-primary-btn {
	background: #2f6dff;
	color: #fff;
	border: 1px solid #2f6dff;
}

.header-secondary-btn {
	background: #f1f4fa;
	color: #374151;
	border: 1px solid #e8eaed;
}

.message-scroll {
	flex: 1;
	min-height: 0;
	width: 100%;
	box-sizing: border-box;
	z-index: 1;
}

.message-inner {
	padding: 12px;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	box-sizing: border-box;
	min-height: 100%;
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
	flex: 0 0 56px;
	height: 56px;
	min-height: 56px;
	padding: 0 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	border-bottom: 1px solid #ececec;
	background: #fff;
	box-sizing: border-box;
}

.conversation-title {
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

.empty {
	margin-top: 48px;
	text-align: center;
	color: #888;
	font-size: 14px;
	width: 100%;
}

.msg {
	max-width: 86%;
	width: fit-content;
	padding: 10px 12px;
	border-radius: 8px;
	margin-bottom: 8px;
	display: inline-flex;
	flex-direction: column;
	gap: 4px;
	box-sizing: border-box;
}

.msg.user {
	align-self: flex-end;
	background: #2f6dff;
	color: #fff;
}

.msg.assistant {
	background: #f5f7fb;
	color: #333;
}

.role {
	font-size: 12px;
	opacity: 0.8;
}

.content {
	font-size: 15px;
	line-height: 1.5;
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
}

.new-msg-tip {
	position: absolute;
	right: 10px;
	bottom: 100%;
	margin-bottom: 6px;
	z-index: 5;
	padding: 8px 14px;
	background: rgba(47, 109, 255, 0.95);
	border-radius: 20px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
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
	background: #f7f8fb;
	border-radius: 8px;
	padding: 8px 10px 10px;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.input {
	width: 100%;
	min-height: 56px;
	max-height: 140px;
	display: block;
	background: transparent;
	padding: 0;
	box-sizing: border-box;
	line-height: 1.4;
	font-size: 14px;
	overflow-y: auto;
	border: none;
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
	border-radius: 6px;
}

.composer-settings-btn::after {
	border: none;
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
	background: #2f6dff;
	border-radius: 6px;
	border: 1px solid #2f6dff;
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
	background: #f3f4f6;
	color: #4b5563;
	border-radius: 6px;
	border: 1px solid #e5e7eb;
}

.clear-btn::after {
	border: none;
}

</style>
